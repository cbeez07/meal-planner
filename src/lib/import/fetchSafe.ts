import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { ApiError } from "@/lib/api";

export const FETCH_USER_AGENT = "WeeklyMeals/1.0 (+https://github.com/weekly-meals)";
const MAX_REDIRECTS = 5;
const MAX_BYTES = 2 * 1024 * 1024;
const TIMEOUT_MS = 15_000;

function ipIsBlocked(ip: string): boolean {
  const addr = ip.toLowerCase();
  if (addr === "127.0.0.1" || addr === "::1" || addr === "0.0.0.0") return true;
  if (addr.startsWith("fe80:") || addr.startsWith("::ffff:127.")) return true;
  if (addr === "169.254.169.254") return true;
  if (addr.startsWith("169.254.")) return true;

  const v4 = addr.includes(".") && !addr.includes(":");
  if (v4) {
    const parts = addr.split(".").map(Number);
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return true;
    const [a, b] = parts;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
  }

  if (addr.includes(":")) {
    if (addr.startsWith("fc") || addr.startsWith("fd")) return true;
    if (addr.startsWith("::ffff:")) {
      return ipIsBlocked(addr.slice(7));
    }
  }
  return false;
}

export function isBlockedIp(ip: string): boolean {
  return ipIsBlocked(ip);
}

export async function assertPublicUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new ApiError("invalid_url", "Enter a valid http(s) URL", 400);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new ApiError("invalid_url", "Only http and https URLs are allowed", 400);
  }
  if (url.username || url.password) {
    throw new ApiError("invalid_url", "URLs with credentials are not allowed", 400);
  }

  const host = url.hostname;
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) {
    throw new ApiError("blocked_host", "That address is not allowed", 400);
  }

  const ips: string[] = [];
  if (isIP(host)) {
    ips.push(host);
  } else {
    try {
      const records = await lookup(host, { all: true });
      ips.push(...records.map((r) => r.address));
    } catch {
      throw new ApiError("dns_failed", "Could not resolve that host", 400);
    }
  }

  if (ips.length === 0 || ips.some(ipIsBlocked)) {
    throw new ApiError("blocked_host", "That address is not allowed", 400);
  }
  return url;
}

export type SafeFetchResult = {
  url: string;
  body: string;
  contentType: string;
};

export async function fetchPublicUrl(
  raw: string,
  redirectsLeft = MAX_REDIRECTS,
): Promise<SafeFetchResult> {
  const url = await assertPublicUrl(raw);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/json;q=0.9,*/*;q=0.8",
        "User-Agent": FETCH_USER_AGENT,
      },
    });

    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const loc = res.headers.get("location");
      if (!loc || redirectsLeft <= 0) {
        throw new ApiError("fetch_failed", "Too many redirects", 400);
      }
      return fetchPublicUrl(new URL(loc, url).toString(), redirectsLeft - 1);
    }

    if (!res.ok) {
      throw new ApiError("fetch_failed", `Site returned ${res.status}`, 400);
    }

    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_BYTES) {
      throw new ApiError("fetch_failed", "Response was too large", 400);
    }

    return {
      url: url.toString(),
      body: buf.toString("utf8"),
      contentType: res.headers.get("content-type") ?? "",
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("fetch_failed", "Could not fetch that URL", 400);
  } finally {
    clearTimeout(timer);
  }
}
