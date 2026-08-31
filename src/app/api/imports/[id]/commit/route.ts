import { eq } from "drizzle-orm";
import { ApiError, jsonError, jsonOk } from "@/lib/api";
import { getDb } from "@/lib/db";
import { importDrafts } from "@/lib/db/schema";
import { createRecipe } from "@/lib/recipes/write";
import { requireUser } from "@/lib/session";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const db = await getDb();
    const row = (await db.select().from(importDrafts).where(eq(importDrafts.id, id)).limit(1))[0];
    if (!row) throw new ApiError("not_found", "Draft not found", 404);
    const stored = row.extractedJson ? JSON.parse(row.extractedJson) : {};
    const overrides = await request.json().catch(() => ({}));
    const payload = { ...stored, ...overrides };
    if (!payload.title?.trim()) {
      throw new ApiError("invalid", "Review the draft and add a title before saving", 400);
    }
    const recipeId = await createRecipe(user.id, payload);
    await db.update(importDrafts).set({ status: "saved" }).where(eq(importDrafts.id, id));
    return jsonOk({ recipeId }, 201);
  } catch (error) {
    return jsonError(error);
  }
}
