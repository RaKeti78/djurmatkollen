import { z } from "zod";
import { hasTrackingParams } from "./link.js";

// Datamodellen för ett foder (D2). Allt som regelmotorn och diagrammen läser
// kommer härifrån, så att utläsningen (U3) bara behöver fylla i ett format.

const percent = z.number().min(0).max(100);

export const Species = z.enum(["hund", "katt"]);

// torr = torrfoder, vat = våtfoder, farsk = färsk- eller frystfoder.
export const FoodType = z.enum(["torr", "vat", "farsk"]);

export const IngredientGroup = z.enum([
  "animaliskt",
  "spannmal",
  "kolhydrat",
  "baljvaxt",
  "fett",
  "tillsats",
  "ovrigt",
]);

export const Ingredient = z.object({
  name: z.string().min(1),
  percent: percent.nullable(),
  group: IngredientGroup,
});

// Analytiska beståndsdelar i procent, så som de står på sidan.
// Det som tillverkaren inte anger är null (D6).
export const Analysis = z
  .object({
    protein: percent,
    fat: percent,
    fibre: percent.nullable(),
    ash: percent,
    moisture: percent.nullable(),
    carbohydrates: percent.nullable().optional(),
    calcium: percent.nullable(),
    phosphorus: percent.nullable(),
  })
  .refine(
    (a) => a.protein + a.fat + (a.fibre ?? 0) + a.ash + (a.moisture ?? 0) <= 100.5,
    { message: "Protein, fett, fibrer, aska och vatten blir tillsammans mer än 100 %" },
  );

export const Additive = z.object({
  name: z.string().min(1),
  amount: z.number().nonnegative().nullable(),
  unit: z.string().nullable(),
  note: z.string().optional(),
});

// Två olika värden för samma sak på sidan (K7).
export const ConflictingValue = z.object({
  field: z.string().min(1),
  values: z.array(z.union([z.number(), z.string()])).min(2),
});

export const Price = z.object({
  sek: z.number().positive(),
  kg: z.number().positive(),
});

export const Food = z
  .object({
    name: z.string().min(1),
    brand: z.string().min(1),
    source: z
      .url({ protocol: /^https$/ })
      // Spårningsparametrar ska vara borttagna innan länken sparas (K1.2).
      .refine((u) => !hasTrackingParams(u), {
        message: "Länken innehåller spårningsparametrar (K1.2)",
      }),
    fetchedAt: z.iso.date(),
    species: Species,
    alsoFor: z.array(Species).optional(),
    foodType: FoodType,
    complementary: z.boolean().default(false),
    targetGroup: z.string(),
    ingredients: z.array(Ingredient).min(1),
    ingredientNotes: z.string().optional(),
    analysis: Analysis,
    analysisExtras: z.record(z.string(), percent).optional(),
    energyKcalPerKg: z.number().positive().nullable(),
    additives: z.array(Additive),
    claims: z.array(z.string()),
    claimedAnimalPercent: percent.optional(),
    conflictingValues: z.array(ConflictingValue).default([]),
    price: Price.nullable(),
  })
  .refine(
    (f) => f.ingredients.reduce((sum, i) => sum + (i.percent ?? 0), 0) <= 100.5,
    { message: "Ingrediensernas procent blir tillsammans mer än 100 %", path: ["ingredients"] },
  );

export type Species = z.infer<typeof Species>;
export type FoodType = z.infer<typeof FoodType>;
export type IngredientGroup = z.infer<typeof IngredientGroup>;
export type Ingredient = z.infer<typeof Ingredient>;
export type Analysis = z.infer<typeof Analysis>;
export type Food = z.infer<typeof Food>;

// Läser in och kontrollerar ett foder. Kastar ett fel som säger vad som är fel.
export function parseFood(data: unknown): Food {
  const result = Food.safeParse(data);
  if (!result.success) {
    throw new Error(`Ogiltigt foder: ${z.prettifyError(result.error)}`);
  }
  return result.data;
}
