export const AISLES = [
  "produce",
  "meat_seafood",
  "dairy",
  "bakery",
  "pantry",
  "other",
] as const;

export type Aisle = (typeof AISLES)[number];

const UNIT_ALIASES: Record<string, string> = {
  tsp: "tsp",
  teaspoon: "tsp",
  teaspoons: "tsp",
  tbsp: "tbsp",
  tablespoon: "tbsp",
  tablespoons: "tbsp",
  g: "g",
  gram: "g",
  grams: "g",
  kg: "kg",
  kilogram: "kg",
  kilograms: "kg",
  oz: "oz",
  ounce: "oz",
  ounces: "oz",
  lb: "lb",
  lbs: "lb",
  pound: "lb",
  pounds: "lb",
  cup: "cup",
  cups: "cup",
  ml: "ml",
  milliliter: "ml",
  milliliters: "ml",
  millilitre: "ml",
  millilitres: "ml",
  l: "l",
  liter: "l",
  liters: "l",
  litre: "l",
  litres: "l",
  clove: "clove",
  cloves: "clove",
  piece: "piece",
  pieces: "piece",
  pinch: "pinch",
  pinches: "pinch",
  can: "can",
  cans: "can",
};

const PRODUCE = [
  "spinach",
  "cilantro",
  "onion",
  "garlic",
  "tomato",
  "lemon",
  "lime",
  "lettuce",
  "carrot",
  "celery",
  "potato",
  "avocado",
  "basil",
  "parsley",
  "kale",
  "broccoli",
  "zucchini",
  "cucumber",
  "apple",
  "berry",
  "mushroom",
  "pepper",
  "bell pepper",
  "jalapeno",
  "cabbage",
  "ginger",
  "scallion",
  "green onion",
  "shallot",
  "herb",
];

const MEAT = [
  "chicken",
  "beef",
  "pork",
  "turkey",
  "salmon",
  "shrimp",
  "fish",
  "steak",
  "bacon",
  "sausage",
  "tuna",
  "lamb",
  "cod",
  "tilapia",
];

const DAIRY = [
  "milk",
  "cheese",
  "butter",
  "yogurt",
  "cream",
  "sour cream",
  "mozzarella",
  "parmesan",
  "cheddar",
  "egg",
  "eggs",
];

const BAKERY = ["bread", "bun", "tortilla", "pita", "roll", "baguette", "naan"];

const PANTRY = [
  "rice",
  "pasta",
  "flour",
  "sugar",
  "oil",
  "vinegar",
  "soy",
  "broth",
  "stock",
  "bean",
  "lentil",
  "cumin",
  "paprika",
  "salt",
  "sauce",
  "canned",
  "noodle",
  "quinoa",
  "oat",
];

export function normalizeIngredientName(name: string): string {
  let s = name.toLowerCase().trim().replace(/\s+/g, " ");
  s = s.replace(/[.,/#!$%^&*;:{}=_`~()]/g, "");
  s = s.replace(/\s+/g, " ").trim();
  if (s.endsWith("ies") && s.length > 4) {
    s = `${s.slice(0, -3)}y`;
  } else if (s.endsWith("oes") && s.length > 4) {
    s = s.slice(0, -2);
  } else if (/(?:sh|ch|ss|x)es$/.test(s) && s.length > 4) {
    s = s.slice(0, -2);
  } else if (s.endsWith("s") && !s.endsWith("ss") && s.length > 3) {
    s = s.slice(0, -1);
  }
  return s;
}

export function canonicalUnit(unit: string | null | undefined): string | null {
  if (unit == null) return null;
  const key = unit.toLowerCase().trim().replace(/\.$/, "");
  if (!key) return null;
  return UNIT_ALIASES[key] ?? key;
}

function matchesAny(normalized: string, keywords: string[]): boolean {
  return keywords.some((k) => normalized.includes(k) || k.includes(normalized));
}

export function classifyAisle(name: string): Aisle {
  const n = normalizeIngredientName(name);
  if (!n) return "other";
  if (n.includes("black pepper") || n === "pepper") {
    return "pantry";
  }
  if (matchesAny(n, MEAT)) return "meat_seafood";
  if (matchesAny(n, PRODUCE)) return "produce";
  if (matchesAny(n, DAIRY)) return "dairy";
  if (matchesAny(n, BAKERY)) return "bakery";
  if (matchesAny(n, PANTRY)) return "pantry";
  return "other";
}

export function isAisle(value: string): value is Aisle {
  return (AISLES as readonly string[]).includes(value);
}
