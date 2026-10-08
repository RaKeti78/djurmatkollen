import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Läser exempelfodren i testdata/foods. Formatet blir en riktig datamodell i U2 (D2).
export const FOODS_DIR = join(import.meta.dirname, "..", "testdata", "foods");

export type ExpectedFlags = { red: number; orange: number; yellow: number };

export type TestFood = {
  id: string;
  name: string;
  source: string;
  species: "hund" | "katt";
  foodType: "torr" | "vat";
  ingredients: { name: string; percent: number | null; group: string }[];
  analysis: {
    protein: number;
    fat: number;
    fibre: number;
    ash: number;
    moisture: number | null;
  };
  expected: ExpectedFlags;
};

export function loadTestFoods(): TestFood[] {
  return readdirSync(FOODS_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => ({
      id: f.replace(/\.json$/, ""),
      ...JSON.parse(readFileSync(join(FOODS_DIR, f), "utf8")),
    }));
}
