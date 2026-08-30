import { describe, expect, it } from "vitest";
import { mergeShoppingLines, scaleFactor } from "./shopping";

describe("scaleFactor", () => {
  it("scales 4-serving recipes to 5", () => {
    expect(scaleFactor(5, 4)).toBeCloseTo(5 / 4);
  });

  it("scales 8-serving recipes to 5", () => {
    expect(scaleFactor(5, 8)).toBeCloseTo(5 / 8);
  });

  it("rejects sourceServings < 1", () => {
    expect(() => scaleFactor(5, 0)).toThrow(/sourceServings/);
  });
});

describe("mergeShoppingLines", () => {
  it("sums matching name + unit and keeps mismatched units separate", () => {
    const lines = mergeShoppingLines(
      [
        {
          sourceServings: 4,
          ingredients: [
            { name: "chicken", amount: 2, unit: "lb" },
            { name: "spinach", amount: 1, unit: "cup" },
          ],
        },
        {
          sourceServings: 5,
          ingredients: [
            { name: "chicken", amount: 1, unit: "lb" },
            { name: "spinach", amount: 4, unit: "oz" },
          ],
        },
      ],
      5,
      [],
    );
    const chicken = lines.filter((l) => l.nameNormalized === "chicken");
    expect(chicken).toHaveLength(1);
    expect(chicken[0].amount).toBeCloseTo(2 * (5 / 4) + 1);
    const spinach = lines.filter((l) => l.nameNormalized === "spinach");
    expect(spinach).toHaveLength(2);
  });

  it("does not invent an amount for to-taste lines", () => {
    const lines = mergeShoppingLines(
      [
        {
          sourceServings: 5,
          ingredients: [{ name: "salt", amount: null, unit: null }],
        },
      ],
      5,
      [],
    );
    expect(lines[0].amount).toBeNull();
  });

  it("omits staples and merges two recipes", () => {
    const lines = mergeShoppingLines(
      [
        {
          sourceServings: 5,
          ingredients: [
            { name: "olive oil", amount: 2, unit: "tbsp" },
            { name: "tomato", amount: 2, unit: null },
          ],
        },
        {
          sourceServings: 5,
          ingredients: [{ name: "tomato", amount: 1, unit: null }],
        },
      ],
      5,
      ["olive oil"],
    );
    expect(lines.map((l) => l.nameNormalized)).toEqual(["tomato"]);
    expect(lines[0].amount).toBe(3);
  });
});
