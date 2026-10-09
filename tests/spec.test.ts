import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Spårbarhet i spec driven development: varje krav ska täckas av minst en uppgift.
const spec = readFileSync(join(import.meta.dirname, "..", "docs", "spec.md"), "utf8");
const tasksSection = spec.slice(spec.indexOf("## Uppgifter"));
const requirements = [...new Set([...spec.matchAll(/\*\*(K\d+) /g)].map((m) => m[1]))];

describe("specen", () => {
  it("har krav K1–K8", () => {
    expect(requirements).toEqual(["K1", "K2", "K3", "K4", "K5", "K6", "K7", "K8"]);
  });

  // Intervall som "K2–K5" räknas som K2, K3, K4 och K5.
  const covered = new Set<string>();
  for (const m of tasksSection.matchAll(/K(\d+)(?:\.\d+)?(?:–K(\d+))?/g)) {
    const from = Number(m[1]);
    const to = m[2] ? Number(m[2]) : from;
    for (let n = from; n <= to; n++) covered.add(`K${n}`);
  }

  it.each(requirements)("%s täcks av minst en uppgift", (k) => {
    expect(covered.has(k)).toBe(true);
  });
});
