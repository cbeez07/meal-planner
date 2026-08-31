import { canonicalUnit, classifyAisle, normalizeIngredientName, type Aisle } from "./ingredients";

export type RecipeLine = {
  name: string;
  nameNormalized?: string;
  amount: number | null;
  unit: string | null;
  aisle?: Aisle;
};

export type MergedLine = {
  name: string;
  nameNormalized: string;
  amount: number | null;
  unit: string | null;
  aisle: Aisle;
};

export function scaleFactor(householdServings: number, sourceServings: number): number {
  if (sourceServings < 1) {
    throw new Error("sourceServings must be >= 1");
  }
  if (householdServings < 1) {
    throw new Error("householdServings must be >= 1");
  }
  return householdServings / sourceServings;
}

export function mergeShoppingLines(
  recipes: { sourceServings: number; ingredients: RecipeLine[] }[],
  householdServings: number,
  stapleNormalized: Iterable<string>,
): MergedLine[] {
  const staples = new Set(
    [...stapleNormalized].map((s) => normalizeIngredientName(s)),
  );
  const map = new Map<string, MergedLine>();

  for (const recipe of recipes) {
    const factor = scaleFactor(householdServings, recipe.sourceServings);
    for (const ing of recipe.ingredients) {
      const nameNormalized = ing.nameNormalized ?? normalizeIngredientName(ing.name);
      if (!nameNormalized || staples.has(nameNormalized)) continue;
      const unit = canonicalUnit(ing.unit);
      const key = `${nameNormalized}::${unit ?? ""}`;
      const scaledAmount = ing.amount == null ? null : ing.amount * factor;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          name: ing.name,
          nameNormalized,
          amount: scaledAmount,
          unit,
          aisle: ing.aisle ?? classifyAisle(ing.name),
        });
        continue;
      }
      if (existing.amount != null && scaledAmount != null) {
        existing.amount += scaledAmount;
      } else if (existing.amount == null && scaledAmount != null) {
        existing.amount = scaledAmount;
      }
    }
  }

  return [...map.values()];
}
