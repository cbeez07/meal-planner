import { afterEach, describe, expect, it, vi } from "vitest";
import { assertPublicUrl, isBlockedIp } from "./fetchSafe";

vi.mock("node:dns/promises", () => ({
  lookup: vi.fn(),
}));

import { lookup } from "node:dns/promises";

const mockedLookup = vi.mocked(lookup);

describe("isBlockedIp", () => {
  it("rejects private, loopback, link-local, and metadata", () => {
    expect(isBlockedIp("127.0.0.1")).toBe(true);
    expect(isBlockedIp("10.0.0.5")).toBe(true);
    expect(isBlockedIp("192.168.1.1")).toBe(true);
    expect(isBlockedIp("172.16.0.1")).toBe(true);
    expect(isBlockedIp("169.254.169.254")).toBe(true);
    expect(isBlockedIp("169.254.1.1")).toBe(true);
    expect(isBlockedIp("::1")).toBe(true);
    expect(isBlockedIp("fd12::1")).toBe(true);
  });

  it("allows public addresses", () => {
    expect(isBlockedIp("1.1.1.1")).toBe(false);
    expect(isBlockedIp("8.8.8.8")).toBe(false);
  });
});

describe("assertPublicUrl", () => {
  afterEach(() => {
    mockedLookup.mockReset();
  });

  it("rejects file and private hosts", async () => {
    await expect(assertPublicUrl("file:///etc/passwd")).rejects.toMatchObject({
      code: "invalid_url",
    });
    await expect(assertPublicUrl("http://127.0.0.1/")).rejects.toMatchObject({
      code: "blocked_host",
    });
    await expect(assertPublicUrl("http://192.168.0.10/admin")).rejects.toMatchObject({
      code: "blocked_host",
    });
  });

  it("allows public https after DNS", async () => {
    mockedLookup.mockResolvedValue([{ address: "1.1.1.1", family: 4 }] as never);
    const url = await assertPublicUrl("https://example.com/recipe");
    expect(url.hostname).toBe("example.com");
  });

  it("rejects a public hostname that resolves privately", async () => {
    mockedLookup.mockResolvedValue([{ address: "10.1.1.1", family: 4 }] as never);
    await expect(assertPublicUrl("https://evil.example")).rejects.toMatchObject({
      code: "blocked_host",
    });
  });
});
