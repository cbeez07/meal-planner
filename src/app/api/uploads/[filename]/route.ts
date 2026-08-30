import { readFile } from "node:fs/promises";
import path from "node:path";
import { ApiError, jsonError } from "@/lib/api";
import { uploadDir } from "@/lib/env";
import { requireUser } from "@/lib/session";

const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ filename: string }> },
) {
  try {
    await requireUser();
    const { filename } = await context.params;
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      throw new ApiError("invalid", "Invalid file", 400);
    }
    const ext = filename.split(".").pop()?.toLowerCase() ?? "";
    const type = TYPES[ext];
    if (!type) throw new ApiError("not_found", "Not found", 404);
    const buf = await readFile(path.join(uploadDir(), filename));
    return new Response(buf, {
      headers: { "Content-Type": type, "Cache-Control": "private, max-age=86400" },
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return jsonError(new ApiError("not_found", "Not found", 404));
    }
    return jsonError(error);
  }
}
