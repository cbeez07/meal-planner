import { eq } from "drizzle-orm";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { ApiError, jsonError, jsonOk } from "@/lib/api";
import { getDb } from "@/lib/db";
import { recipes } from "@/lib/db/schema";
import { uploadDir } from "@/lib/env";
import { newId, nowIso } from "@/lib/ids";
import { requireUser } from "@/lib/session";

const MAX = 5 * 1024 * 1024;
const TYPES: Record<string, string> = {
  "\xFF\xD8\xFF": "jpg",
  "\x89PNG\r\n\x1A\n": "png",
  RIFF: "webp",
};

function sniff(buf: Buffer): string | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.length >= 8 && buf.toString("ascii", 0, 8) === "\x89PNG\r\n\x1A\n") return "png";
  if (
    buf.length >= 12 &&
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp";
  }
  void TYPES;
  return null;
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    const { id } = await context.params;
    const db = await getDb();
    const recipe = (await db.select().from(recipes).where(eq(recipes.id, id)).limit(1))[0];
    if (!recipe) throw new ApiError("not_found", "Recipe not found", 404);

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new ApiError("invalid", "Photo file required", 400);
    if (file.size > MAX) throw new ApiError("invalid", "Photo must be 5 MB or smaller", 400);
    const buf = Buffer.from(await file.arrayBuffer());
    const ext = sniff(buf);
    if (!ext) throw new ApiError("invalid", "Photo must be jpeg, png, or webp", 400);

    const dir = uploadDir();
    await mkdir(dir, { recursive: true });
    const filename = `${newId()}.${ext}`;
    await writeFile(path.join(dir, filename), buf);
    await db
      .update(recipes)
      .set({ photoPath: filename, updatedAt: nowIso() })
      .where(eq(recipes.id, id));
    return jsonOk({ photoPath: filename });
  } catch (error) {
    return jsonError(error);
  }
}
