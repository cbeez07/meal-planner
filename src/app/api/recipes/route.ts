import { and, eq } from "drizzle-orm";
import { ApiError, jsonError, jsonOk } from "@/lib/api";
import { getDb } from "@/lib/db";
import { recipeIngredients, recipeTags, recipes, tags } from "@/lib/db/schema";
import { createRecipe } from "@/lib/recipes/write";
import { requireUser } from "@/lib/session";

export async function GET(request: Request) {
  try {
    await requireUser();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim().toLowerCase() ?? "";
    const tag = searchParams.get("tag")?.trim().toLowerCase() ?? "";
    const ingredient = searchParams.get("ingredient")?.trim().toLowerCase() ?? "";

    const db = await getDb();
    const all = await db.select().from(recipes);
    const filtered = [];
    for (const recipe of all) {
      if (q && !recipe.title.toLowerCase().includes(q)) continue;
      if (ingredient) {
        const ings = await db
          .select()
          .from(recipeIngredients)
          .where(eq(recipeIngredients.recipeId, recipe.id));
        if (!ings.some((i) => i.nameNormalized.includes(ingredient) || i.name.toLowerCase().includes(ingredient))) {
          continue;
        }
      }
      if (tag) {
        const tagRows = await db
          .select({ name: tags.name })
          .from(recipeTags)
          .innerJoin(tags, eq(recipeTags.tagId, tags.id))
          .where(and(eq(recipeTags.recipeId, recipe.id), eq(tags.name, tag)));
        if (tagRows.length === 0) continue;
      }
      const tagRows = await db
        .select({ name: tags.name })
        .from(recipeTags)
        .innerJoin(tags, eq(recipeTags.tagId, tags.id))
        .where(eq(recipeTags.recipeId, recipe.id));
      filtered.push({
        id: recipe.id,
        title: recipe.title,
        sourceServings: recipe.sourceServings,
        timeMinutes: recipe.timeMinutes,
        sourceKind: recipe.sourceKind,
        tags: tagRows.map((t) => t.name),
      });
    }
    filtered.sort((a, b) => a.title.localeCompare(b.title));
    return jsonOk({ recipes: filtered });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    if (body.sourceServings != null && body.sourceServings < 1) {
      throw new ApiError("invalid", "Servings must be at least 1", 400);
    }
    const id = await createRecipe(user.id, body);
    return jsonOk({ id }, 201);
  } catch (error) {
    return jsonError(error);
  }
}
