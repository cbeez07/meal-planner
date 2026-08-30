import { describe, expect, it } from "vitest";
import { rankByOverlap } from "./overlap";

describe("rankByOverlap", () => {
  it("ranks shared produce above a salt-only match", () => {
    const planned = ["spinach", "garlic", "salt"];
    const ranked = rankByOverlap(planned, [
      {
        id: "salt-only",
        title: "Salted water",
        ingredients: [{ name: "salt" }, { name: "water" }],
      },
      {
        id: "spinach",
        title: "Garlic spinach",
        ingredients: [{ name: "spinach" }, { name: "garlic" }, { name: "oil" }],
      },
    ]);
    expect(ranked[0].recipeId).toBe("spinach");
    expect(ranked[0].sharedIngredients).toEqual(
      expect.arrayContaining(["spinach", "garlic"]),
    );
    expect(ranked[0].score).toBeGreaterThan(ranked[1].score);
  });

  it("does not exclude ids — caller filters planned recipes", () => {
    const ranked = rankByOverlap(["chicken"], [
      { id: "already", title: "Already planned", ingredients: [{ name: "chicken" }] },
    ]);
    expect(ranked).toHaveLength(1);
    expect(ranked[0].recipeId).toBe("already");
  });
});
