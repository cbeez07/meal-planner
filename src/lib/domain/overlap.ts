import { normalizeIngredientName } from "./ingredients";

const NOISE = new Set([
  "water",
  "salt",
  "pepper",
  "black pepper",
  "oil",
  "olive oil",
  "vegetable oil",
  "canola oil",
  "cooking spray",
]);

const UPWEIGHT = [
  "chicken",
  "beef",
  "pork",
  "turkey",
  "salmon",
  "shrimp",
  "fish",
  "spinach",
  "cilantro",
  "tomato",
  "onion",
  "garlic",
  "lemon",
  "broccoli",
  "kale",
  "pepper",
  "avocado",
  "mushroom",
];

export type RankableRecipe = {
  id: string;
  title: string;
  ingredients: { name: string; nameNormalized?: string }[];
};

export type Suggestion = {
  recipeId: string;
  title: string;
  score: number;
  sharedIngredients: string[];
};

function weightFor(normalized: string): number {
  if (NOISE.has(normalized)) return 0.1;
  if (UPWEIGHT.some((k) => normalized.includes(k))) return 2;
  return 1;
}

export function plannedIngredientSet(
  recipes: RankableRecipe[],
): Set<string> {
  const set = new Set<string>();
  for (const recipe of recipes) {
    for (const ing of recipe.ingredients) {
      set.add(ing.nameNormalized ?? normalizeIngredientName(ing.name));
    }
  }
  return set;
}

export function rankByOverlap(
  plannedNames: Iterable<string>,
  candidates: RankableRecipe[],
): Suggestion[] {
  const planned = new Set(
    [...plannedNames].map((n) => normalizeIngredientName(n)).filter(Boolean),
  );

  const scored: Suggestion[] = candidates.map((recipe) => {
    const shared: string[] = [];
    let score = 0;
    const seen = new Set<string>();
    for (const ing of recipe.ingredients) {
      const key = ing.nameNormalized ?? normalizeIngredientName(ing.name);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      if (planned.has(key)) {
        score += weightFor(key);
        shared.push(ing.name);
      }
    }
    return {
      recipeId: recipe.id,
      title: recipe.title,
      score,
      sharedIngredients: shared,
    };
  });

  return scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.title.localeCompare(b.title);
  });
}
