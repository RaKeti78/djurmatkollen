import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { Food } from "./model.js";

// Läser exempelfodren i testdata/foods och kontrollerar dem mot datamodellen (D2).
export const FOODS_DIR = join(import.meta.dirname, "..", "testdata", "foods");

const count = z.number().int().nonnegative();

// Facit för varningsreglerna (U5): hur många varningar av varje nivå fodret ska få.
export const ExpectedFlags = z.object({ red: count, orange: count, yellow: count });

const TestFood = Food.and(z.object({ expected: ExpectedFlags }));

export type ExpectedFlags = z.infer<typeof ExpectedFlags>;
export type TestFood = z.infer<typeof TestFood> & { id: string };

export function testFoodFiles(): string[] {
  return readdirSync(FOODS_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort();
}

export function loadTestFoods(): TestFood[] {
  return testFoodFiles().map((f) => ({
    id: f.replace(/\.json$/, ""),
    ...TestFood.parse(JSON.parse(readFileSync(join(FOODS_DIR, f), "utf8"))),
  }));
}
