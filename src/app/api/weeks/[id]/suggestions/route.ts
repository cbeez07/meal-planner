import { eq } from "drizzle-orm";
import { ApiError, jsonError, jsonOk } from "@/lib/api";
import { getDb } from "@/lib/db";
import { recipeIngredients, recipes } from "@/lib/db/schema";
import { plannedIngredientSet, rankByOverlap } from "@/lib/domain/overlap";
import { requireUser } from "@/lib/session";
import { getWeekWithSlots } from "@/lib/weeks";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    const { id } = await context.params;
    const week = await getWeekWithSlots(id);
    if (!week) throw new ApiError("not_found", "Week not found", 404);

    const plannedIds = new Set(
      week.slots.filter((s) => s.kind === "dinner" && s.recipe).map((s) => s.recipe!.id),
    );
    const db = await getDb();
    const all = await db.select().from(recipes);
    const candidates = [];
    const plannedRecipes = [];
    for (const recipe of all) {
      const ingredients = await db
        .select()
        .from(recipeIngredients)
        .where(eq(recipeIngredients.recipeId, recipe.id));
      const packed = {
        id: recipe.id,
        title: recipe.title,
        ingredients: ingredients.map((i) => ({
          name: i.name,
          nameNormalized: i.nameNormalized,
        })),
      };
      if (plannedIds.has(recipe.id)) plannedRecipes.push(packed);
      else candidates.push(packed);
    }

    if (plannedRecipes.length === 0) {
      return jsonOk({
        suggestions: [],
        note: "Pick an anchor dinner to see overlap suggestions.",
      });
    }

    const names = plannedIngredientSet(plannedRecipes);
    const ranked = rankByOverlap(names, candidates);
    return jsonOk({
      suggestions: ranked.map((s) => ({
        recipeId: s.recipeId,
        title: s.title,
        score: s.score,
        sharedIngredients: s.sharedIngredients,
      })),
    });
  } catch (error) {
    return jsonError(error);
  }
}
