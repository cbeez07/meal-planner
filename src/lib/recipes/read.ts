import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { recipeIngredients, recipeSteps, recipeTags, recipes, tags } from "@/lib/db/schema";

export async function getRecipeById(id: string) {
  const db = await getDb();
  const recipe = (await db.select().from(recipes).where(eq(recipes.id, id)).limit(1))[0];
  if (!recipe) return null;
  const ingredients = await db
    .select()
    .from(recipeIngredients)
    .where(eq(recipeIngredients.recipeId, id));
  ingredients.sort((a, b) => a.sortOrder - b.sortOrder);
  const steps = await db.select().from(recipeSteps).where(eq(recipeSteps.recipeId, id));
  steps.sort((a, b) => a.sortOrder - b.sortOrder);
  const tagRows = await db
    .select({ name: tags.name })
    .from(recipeTags)
    .innerJoin(tags, eq(recipeTags.tagId, tags.id))
    .where(eq(recipeTags.recipeId, id));
  return {
    ...recipe,
    ingredients,
    steps,
    tags: tagRows.map((t) => t.name),
  };
}

export function serializeRecipe(recipe: NonNullable<Awaited<ReturnType<typeof getRecipeById>>>) {
  return {
    id: recipe.id,
    title: recipe.title,
    sourceUrl: recipe.sourceUrl,
    sourceKind: recipe.sourceKind,
    sourceServings: recipe.sourceServings,
    timeMinutes: recipe.timeMinutes,
    photoPath: recipe.photoPath,
    notes: recipe.notes,
    createdAt: recipe.createdAt,
    updatedAt: recipe.updatedAt,
    tags: recipe.tags,
    ingredients: recipe.ingredients.map((i) => ({
      id: i.id,
      name: i.name,
      amount: i.amount,
      unit: i.unit,
      aisle: i.aisle,
    })),
    steps: recipe.steps.map((s) => ({ id: s.id, body: s.body })),
  };
}
