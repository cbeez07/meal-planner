import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  recipeIngredients,
  recipes,
  settings,
  shoppingListItems,
  staples,
  weekSlots,
} from "@/lib/db/schema";
import { mergeShoppingLines } from "@/lib/domain/shopping";
import type { Aisle } from "@/lib/domain/ingredients";
import { newId } from "@/lib/ids";

export async function regenerateShoppingList(weekId: string) {
  const db = await getDb();
  const setting = (await db.select().from(settings).limit(1))[0];
  const householdServings = setting?.householdServings ?? 5;
  const stapleRows = await db.select().from(staples);
  const dinnerSlots = await db
    .select()
    .from(weekSlots)
    .where(and(eq(weekSlots.weekId, weekId), eq(weekSlots.kind, "dinner")));

  const recipeData = [];
  for (const slot of dinnerSlots) {
    if (!slot.recipeId) continue;
    const recipe = (await db.select().from(recipes).where(eq(recipes.id, slot.recipeId)).limit(1))[0];
    if (!recipe) continue;
    const ingredients = await db
      .select()
      .from(recipeIngredients)
      .where(eq(recipeIngredients.recipeId, recipe.id));
    recipeData.push({
      sourceServings: recipe.sourceServings,
      ingredients: ingredients.map((i) => ({
        name: i.name,
        nameNormalized: i.nameNormalized,
        amount: i.amount,
        unit: i.unit,
        aisle: i.aisle as Aisle,
      })),
    });
  }

  const merged = mergeShoppingLines(
    recipeData,
    householdServings,
    stapleRows.map((s) => s.nameNormalized),
  );

  const existing = await db
    .select()
    .from(shoppingListItems)
    .where(eq(shoppingListItems.weekId, weekId));
  const manuals = existing.filter((i) => i.source === "manual");
  const generated = existing.filter((i) => i.source === "generated");
  const checkedByKey = new Map(
    generated.map((i) => [`${i.nameNormalized}::${i.unit ?? ""}`, i.checked]),
  );

  for (const row of generated) {
    await db.delete(shoppingListItems).where(eq(shoppingListItems.id, row.id));
  }

  for (const line of merged) {
    const key = `${line.nameNormalized}::${line.unit ?? ""}`;
    await db.insert(shoppingListItems).values({
      id: newId(),
      weekId,
      name: line.name,
      nameNormalized: line.nameNormalized,
      amount: line.amount,
      unit: line.unit,
      aisle: line.aisle,
      checked: checkedByKey.get(key) ?? 0,
      source: "generated",
    });
  }

  const items = [
    ...(await db.select().from(shoppingListItems).where(eq(shoppingListItems.weekId, weekId))),
  ];
  // keep manuals that were already there
  void manuals;
  return items;
}

const AISLE_ORDER: Aisle[] = [
  "produce",
  "meat_seafood",
  "dairy",
  "bakery",
  "pantry",
  "other",
];

export function groupByAisle(items: Awaited<ReturnType<typeof regenerateShoppingList>>) {
  const groups = AISLE_ORDER.map((aisle) => ({
    aisle,
    items: items.filter((i) => i.aisle === aisle),
  }));
  return groups.filter((g) => g.items.length > 0);
}
