import { describe, expect, it } from "vitest";
import {
  canonicalUnit,
  classifyAisle,
  normalizeIngredientName,
} from "./ingredients";

describe("normalizeIngredientName", () => {
  it("lowercases, trims, and collapses space", () => {
    expect(normalizeIngredientName("  Chicken   Thighs ")).toBe("chicken thigh");
  });

  it("strips punctuation and singularizes lightly", () => {
    expect(normalizeIngredientName("tomatoes")).toBe("tomato");
    expect(normalizeIngredientName("berries")).toBe("berry");
    expect(normalizeIngredientName("garlic, minced")).toBe("garlic minced");
  });
});

describe("canonicalUnit", () => {
  it("maps aliases", () => {
    expect(canonicalUnit("teaspoon")).toBe("tsp");
    expect(canonicalUnit("Tbsp")).toBe("tbsp");
    expect(canonicalUnit("grams")).toBe("g");
    expect(canonicalUnit("pounds")).toBe("lb");
  });

  it("passes unknown units through", () => {
    expect(canonicalUnit("handful")).toBe("handful");
  });

  it("returns null for empty", () => {
    expect(canonicalUnit(null)).toBeNull();
    expect(canonicalUnit("  ")).toBeNull();
  });
});

describe("classifyAisle", () => {
  it("classifies known foods", () => {
    expect(classifyAisle("baby spinach")).toBe("produce");
    expect(classifyAisle("chicken thighs")).toBe("meat_seafood");
    expect(classifyAisle("parmesan cheese")).toBe("dairy");
    expect(classifyAisle("flour tortillas")).toBe("bakery");
    expect(classifyAisle("olive oil")).toBe("pantry");
  });

  it("unknowns become other", () => {
    expect(classifyAisle("mystery goo")).toBe("other");
  });
});
