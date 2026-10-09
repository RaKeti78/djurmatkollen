import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { Food, parseFood } from "../src/model.js";
import { FOODS_DIR, testFoodFiles } from "../src/testdata.js";

const raw = (file: string) => JSON.parse(readFileSync(join(FOODS_DIR, file), "utf8"));
const base = raw("hund-royal-canin-medium-adult.json");

// Ett giltigt foder med en ändring, för att testa en regel i taget.
const withChange = (change: (f: any) => void) => {
  const f = structuredClone(base);
  change(f);
  return f;
};

describe("datamodellen (D2)", () => {
  it.each(testFoodFiles())("godkänner %s", (file) => {
    expect(() => parseFood(raw(file))).not.toThrow();
  });

  it("sätter helfoder och inga motstridiga värden som standard", () => {
    const f = parseFood(withChange((f) => {
      delete f.complementary;
      delete f.conflictingValues;
    }));
    expect(f.complementary).toBe(false);
    expect(f.conflictingValues).toEqual([]);
  });

  it("läser kompletteringsfoder", () => {
    expect(parseFood(raw("hund-smaak-raw-complementary-kyckling-ben.json")).complementary).toBe(true);
  });

  describe("avvisar", () => {
    const cases: [string, (f: any) => void][] = [
      ["länk med spårningsparametrar", (f) => (f.source += "&utm_source=google")],
      ["länk med gclid", (f) => (f.source += "&gclid=abc")],
      ["länk utan https", (f) => (f.source = "http://example.se/foder")],
      ["okänt djurslag", (f) => (f.species = "kanin")],
      ["okänd fodertyp", (f) => (f.foodType = "konserv")],
      ["okänd ingrediensgrupp", (f) => (f.ingredients[0].group = "socker")],
      ["procent över 100", (f) => (f.analysis.protein = 120)],
      ["negativ procent", (f) => (f.ingredients[0].percent = -1)],
      ["analys som blir mer än 100 %", (f) => (f.analysis.moisture = 60)],
      ["ingredienser som blir mer än 100 %", (f) => {
        f.ingredients[0].percent = 60;
        f.ingredients[1].percent = 50;
      }],
      ["inga ingredienser", (f) => (f.ingredients = [])],
      ["saknat protein", (f) => delete f.analysis.protein],
      ["ogiltigt datum", (f) => (f.fetchedAt = "8 okt 2026")],
      ["motstridigt värde med bara ett värde", (f) => (f.conflictingValues = [{ field: "ash", values: [8] }])],
    ];

    it.each(cases)("%s", (_, change) => {
      expect(Food.safeParse(withChange(change)).success).toBe(false);
    });
  });

  it("ger ett felmeddelande som säger vad som är fel", () => {
    expect(() => parseFood(withChange((f) => (f.source += "&utm_source=google")))).toThrow(
      /spårningsparametrar/,
    );
  });
});
