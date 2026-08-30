import { eq } from "drizzle-orm";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { ApiError, jsonError, jsonOk } from "@/lib/api";
import { getDb } from "@/lib/db";
import { recipes } from "@/lib/db/schema";
import { uploadDir } from "@/lib/env";
import { getRecipeById, serializeRecipe } from "@/lib/recipes/read";
import { recipeInProtectedWeek, updateRecipe } from "@/lib/recipes/write";
import { requireUser } from "@/lib/session";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    const { id } = await context.params;
    const recipe = await getRecipeById(id);
    if (!recipe) throw new ApiError("not_found", "Recipe not found", 404);
    return jsonOk(serializeRecipe(recipe));
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    const { id } = await context.params;
    const body = await request.json();
    if (body.sourceServings != null && body.sourceServings < 1) {
      throw new ApiError("invalid", "Servings must be at least 1", 400);
    }
    await updateRecipe(id, body);
    const recipe = await getRecipeById(id);
    return jsonOk(serializeRecipe(recipe!));
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    const { id } = await context.params;
    const recipe = await getRecipeById(id);
    if (!recipe) throw new ApiError("not_found", "Recipe not found", 404);
    if (await recipeInProtectedWeek(id)) {
      throw new ApiError("in_use", "This recipe is on this week or a future week", 409);
    }
    const db = await getDb();
    await db.delete(recipes).where(eq(recipes.id, id));
    if (recipe.photoPath) {
      await unlink(path.join(uploadDir(), recipe.photoPath)).catch(() => undefined);
    }
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
