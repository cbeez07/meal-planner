import { and, eq, gte } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  recipeIngredients,
  recipeSteps,
  recipeTags,
  recipes,
  tags,
  weekSlots,
  weeks,
} from "@/lib/db/schema";
import {
  classifyAisle,
  canonicalUnit,
  isAisle,
  normalizeIngredientName,
  type Aisle,
} from "@/lib/domain/ingredients";
import { ApiError } from "@/lib/api";
import { currentOrUpcomingSunday } from "@/lib/dates";
import { newId, nowIso } from "@/lib/ids";

export type RecipeInput = {
  title: string;
  sourceUrl?: string | null;
  sourceKind?: string | null;
  sourceServings?: number;
  timeMinutes?: number | null;
  notes?: string | null;
  tags?: string[];
  ingredients?: {
    name: string;
    amount?: number | null;
    unit?: string | null;
    aisle?: string | null;
  }[];
  steps?: { body: string }[];
};

export async function createRecipe(userId: string, input: RecipeInput) {
  const title = input.title?.trim();
  if (!title) throw new ApiError("invalid", "Title is required", 400);
  const servings = input.sourceServings ?? 5;
  if (servings < 1) throw new ApiError("invalid", "Servings must be at least 1", 400);

  const db = await getDb();
  const id = newId();
  const now = nowIso();
  await db.insert(recipes).values({
    id,
    title,
    sourceUrl: input.sourceUrl ?? null,
    sourceKind: input.sourceKind ?? "manual",
    sourceServings: servings,
    timeMinutes: input.timeMinutes ?? null,
    notes: input.notes ?? null,
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
  });
  await replaceRecipeChildren(id, input);
  return id;
}

export async function updateRecipe(id: string, input: RecipeInput) {
  const title = input.title?.trim();
  if (!title) throw new ApiError("invalid", "Title is required", 400);
  const servings = input.sourceServings ?? 5;
  if (servings < 1) throw new ApiError("invalid", "Servings must be at least 1", 400);

  const db = await getDb();
  const existing = await db.select().from(recipes).where(eq(recipes.id, id)).limit(1);
  if (!existing[0]) throw new ApiError("not_found", "Recipe not found", 404);

  await db
    .update(recipes)
    .set({
      title,
      sourceUrl: input.sourceUrl ?? existing[0].sourceUrl,
      sourceKind: input.sourceKind ?? existing[0].sourceKind,
      sourceServings: servings,
      timeMinutes: input.timeMinutes ?? null,
      notes: input.notes ?? null,
      updatedAt: nowIso(),
    })
    .where(eq(recipes.id, id));
  await replaceRecipeChildren(id, input);
}

async function replaceRecipeChildren(recipeId: string, input: RecipeInput) {
  const db = await getDb();
  await db.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, recipeId));
  await db.delete(recipeSteps).where(eq(recipeSteps.recipeId, recipeId));
  await db.delete(recipeTags).where(eq(recipeTags.recipeId, recipeId));

  const ings = input.ingredients ?? [];
  if (ings.length) {
    await db.insert(recipeIngredients).values(
      ings
        .filter((i) => i.name?.trim())
        .map((ing, index) => ({
          id: newId(),
          recipeId,
          name: ing.name.trim(),
          nameNormalized: normalizeIngredientName(ing.name),
          amount: ing.amount ?? null,
          unit: canonicalUnit(ing.unit ?? null),
          sortOrder: index,
          aisle: (ing.aisle && isAisle(ing.aisle) ? ing.aisle : classifyAisle(ing.name)) as Aisle,
        })),
    );
  }

  const steps = input.steps ?? [];
  if (steps.length) {
    await db.insert(recipeSteps).values(
      steps
        .filter((s) => s.body?.trim())
        .map((step, index) => ({
          id: newId(),
          recipeId,
          sortOrder: index,
          body: step.body.trim(),
        })),
    );
  }

  for (const rawName of input.tags ?? []) {
    const name = rawName.trim().toLowerCase();
    if (!name) continue;
    let tag = (await db.select().from(tags).where(eq(tags.name, name)).limit(1))[0];
    if (!tag) {
      tag = { id: newId(), name };
      await db.insert(tags).values(tag);
    }
    await db.insert(recipeTags).values({ recipeId, tagId: tag.id });
  }
}

export async function recipeInProtectedWeek(recipeId: string): Promise<boolean> {
  const db = await getDb();
  const todaySunday = currentOrUpcomingSunday();
  const rows = await db
    .select({ id: weekSlots.id })
    .from(weekSlots)
    .innerJoin(weeks, eq(weekSlots.weekId, weeks.id))
    .where(
      and(
        eq(weekSlots.recipeId, recipeId),
        eq(weekSlots.kind, "dinner"),
        gte(weeks.startDate, todaySunday),
      ),
    )
    .limit(1);
  return rows.length > 0;
}
