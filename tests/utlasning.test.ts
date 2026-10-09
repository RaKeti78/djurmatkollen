import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { Analysis, Food, FoodType, IngredientGroup, Species } from "../src/model.js";

// Instruktionen för utläsning (U3) ska beskriva varje fält i datamodellen,
// så att den inte blir inaktuell när modellen ändras.
const root = join(import.meta.dirname, "..");
const doc = readFileSync(join(root, "docs", "utlasning.md"), "utf8");
const scripts = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).scripts;

describe("instruktionen för utläsning", () => {
  it.each(Object.keys(Food.shape))("beskriver fältet %s", (field) => {
    expect(doc).toContain(`\`${field}\``);
  });

  it.each(Object.keys(Analysis.shape))("beskriver analysvärdet %s", (field) => {
    expect(doc).toContain(`\`${field}\``);
  });

  it.each([...Species.options, ...FoodType.options, ...IngredientGroup.options])(
    "beskriver värdet %s",
    (value) => {
      expect(doc).toContain(`\`${value}\``);
    },
  );

  it("hänvisar bara till kommandon som finns", () => {
    const used = [...doc.matchAll(/npm run (\w+)/g)].map((m) => m[1]);
    expect(used.length).toBeGreaterThan(0);
    for (const name of used) expect(scripts).toHaveProperty(name);
  });
});
