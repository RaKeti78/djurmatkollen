import { describe, expect, it } from "vitest";
import { loadTestFoods } from "../src/testdata.js";

const foods = loadTestFoods();

describe("testdata", () => {
  it("har både hund- och kattfoder", () => {
    expect(foods.filter((f) => f.species === "hund").length).toBeGreaterThanOrEqual(3);
    expect(foods.filter((f) => f.species === "katt").length).toBeGreaterThanOrEqual(3);
  });

  describe.each(foods)("$id", (food) => {
    it("har källa, ingredienser och analys", () => {
      expect(food.source).toMatch(/^https:\/\//);
      expect(food.source).not.toMatch(/[?&](utm_|gclid|gad_|gbraid)/);
      expect(food.ingredients.length).toBeGreaterThan(0);
      for (const key of ["protein", "fat", "ash"] as const) {
        expect(food.analysis[key]).toBeGreaterThan(0);
      }
    });

    it("har en analys som inte överstiger 100 %", () => {
      const { protein, fat, fibre, ash, moisture } = food.analysis;
      expect(protein + fat + (fibre ?? 0) + ash + (moisture ?? 0)).toBeLessThanOrEqual(100);
    });

    it("har facit för varningarna (U5)", () => {
      const { red, orange, yellow } = food.expected;
      expect([red, orange, yellow].every(Number.isInteger)).toBe(true);
    });
  });
});
