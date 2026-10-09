import { describe, expect, it } from "vitest";
import { compareFoods } from "../src/compare.js";
import { parseFood } from "../src/model.js";
import { loadTestFoods } from "../src/testdata.js";

// Royal Canin saknar vattenhalt och köttpåstående, vilket testerna nedan bygger på.
const facit = loadTestFoods().find((f) => f.id === "hund-royal-canin-medium-adult")!;
const extracted = (change: (f: any) => void = () => {}) => {
  const { id, expected, ...food } = structuredClone(facit);
  change(food);
  return parseFood(food);
};

describe("jämförelse med facit (U3)", () => {
  it("hittar inga skillnader när utläsningen stämmer", () => {
    expect(compareFoods(extracted(), facit)).toEqual({ differences: [], review: [] });
  });

  it("bryr sig inte om hämtdatum, stora bokstäver eller mellanslag", () => {
    const food = extracted((f) => {
      f.fetchedAt = "2030-01-01";
      f.ingredients[0].name = `  ${f.ingredients[0].name.toUpperCase()} `;
      f.ingredients[1].name = f.ingredients[1].name.replaceAll(" ", "");
    });
    expect(compareFoods(food, facit)).toEqual({ differences: [], review: [] });
  });

  it("räknar skillnader i fritext som något att granska, inte som fel", () => {
    const food = extracted((f) => {
      f.name = "Medium Adult";
      f.claims = ["Något annat"];
    });
    const { differences, review } = compareFoods(food, facit);
    expect(differences).toEqual([]);
    expect(review).toContain(`name: "Medium Adult", facit "${facit.name}"`);
    expect(review.some((d) => d.startsWith("claims"))).toBe(true);
  });

  it("visar varje värde som skiljer sig, med sökväg", () => {
    const food = extracted((f) => {
      f.analysis.protein += 1;
      f.ingredients[1].group = "ovrigt";
      f.analysis.moisture = 9;
    });
    expect(compareFoods(food, facit).differences).toEqual([
      `ingredients[1].group: "ovrigt", facit "${facit.ingredients[1].group}"`,
      `analysis.protein: ${facit.analysis.protein + 1}, facit ${facit.analysis.protein}`,
      "analysis.moisture: 9, facit null",
    ]);
  });

  it("säger till när ingredienser saknas eller fält har lagts till", () => {
    const food = extracted((f) => {
      f.ingredients.pop();
      f.claimedAnimalPercent = 50;
    });
    expect(compareFoods(food, facit).differences).toEqual([
      `ingredients: ${facit.ingredients.length - 1} st, facit ${facit.ingredients.length} st`,
      "claimedAnimalPercent: 50, facit saknas",
    ]);
  });
});
