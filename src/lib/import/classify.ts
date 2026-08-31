export type SourceKind =
  | "manual"
  | "blog"
  | "pinterest"
  | "tiktok"
  | "instagram"
  | "youtube";

export function classifyUrl(raw: string): Exclude<SourceKind, "manual"> {
  let host = "";
  try {
    host = new URL(raw).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "blog";
  }
  if (host.includes("tiktok.com")) return "tiktok";
  if (host.includes("instagram.com")) return "instagram";
  if (host.includes("youtube.com") || host.includes("youtu.be")) return "youtube";
  if (host.includes("pinterest.") || host === "pin.it") return "pinterest";
  return "blog";
}
