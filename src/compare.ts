import type { Food } from "./model.js";

// Jämför en utläsning med facit i testdatan (U3) och listar alla skillnader.
// Hämtdatum och facit för varningarna (expected) jämförs inte.
const IGNORED = new Set(["fetchedAt", "expected", "id"]);

// Fritext som bara visas för läsaren och inte används av beräkningar eller
// varningsregler. Den kan formuleras olika från gång till gång, så skillnader
// där ska granskas men räknas inte som fel.
const FREE_TEXT = new Set(["name", "targetGroup", "claims", "ingredientNotes"]);

export type Comparison = {
  // Skillnader i värden som beräkningar och varningsregler använder.
  differences: string[];
  // Skillnader i fritext, att läsa igenom.
  review: string[];
};

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

const show = (v: Json | undefined) => (v === undefined ? "saknas" : JSON.stringify(v));

// Text jämförs utan hänsyn till stora och små bokstäver och mellanslag,
// så att "500g" och "500 g" räknas som samma sak.
const normalize = (s: string) => s.replace(/\s+/g, "").toLowerCase();
const sameText = (a: string, b: string) => normalize(a) === normalize(b);

function diff(actual: Json | undefined, facit: Json | undefined, path: string, out: string[]) {
  if (typeof actual === "number" && typeof facit === "number") {
    if (Math.abs(actual - facit) > 1e-9) out.push(`${path}: ${actual}, facit ${facit}`);
    return;
  }
  if (typeof actual === "string" && typeof facit === "string") {
    if (!sameText(actual, facit)) out.push(`${path}: ${show(actual)}, facit ${show(facit)}`);
    return;
  }
  if (Array.isArray(actual) && Array.isArray(facit)) {
    if (actual.length !== facit.length) {
      out.push(`${path}: ${actual.length} st, facit ${facit.length} st`);
    }
    for (let i = 0; i < Math.min(actual.length, facit.length); i++) {
      diff(actual[i], facit[i], `${path}[${i}]`, out);
    }
    return;
  }
  if (isObject(actual) && isObject(facit)) {
    for (const key of new Set([...Object.keys(facit), ...Object.keys(actual)])) {
      if (path === "" && IGNORED.has(key)) continue;
      diff(actual[key], facit[key], path ? `${path}.${key}` : key, out);
    }
    return;
  }
  if (actual !== facit) out.push(`${path}: ${show(actual)}, facit ${show(facit)}`);
}

const isObject = (v: Json | undefined): v is { [key: string]: Json } =>
  typeof v === "object" && v !== null && !Array.isArray(v);

export function compareFoods(actual: Food, facit: Food): Comparison {
  const all: string[] = [];
  diff(actual as unknown as Json, facit as unknown as Json, "", all);
  const isFreeText = (d: string) => FREE_TEXT.has(d.split(/[.[:]/)[0]);
  return { differences: all.filter((d) => !isFreeText(d)), review: all.filter(isFreeText) };
}
