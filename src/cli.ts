import { readFileSync } from "node:fs";
import { compareFoods } from "./compare.js";
import { cleanUrl } from "./link.js";
import { parseFood } from "./model.js";
import { loadTestFoods } from "./testdata.js";

// Verktyg för utläsningen (U3, docs/utlasning.md).
//   npm run rensa -- "<länk>"          skriver ut länken utan spårningsparametrar
//   npm run kontrollera -- <fil.json>  kontrollerar ett foder mot datamodellen och facit

function rensa(links: string[]): number {
  for (const link of links) console.log(cleanUrl(link));
  return 0;
}

function kontrollera(files: string[]): number {
  let failed = 0;
  for (const file of files) {
    let food;
    try {
      food = parseFood(JSON.parse(readFileSync(file, "utf8")));
    } catch (e) {
      console.log(`✗ ${file}\n${(e as Error).message}\n`);
      failed++;
      continue;
    }
    const facit = loadTestFoods().find((f) => f.source === food.source);
    if (!facit) {
      console.log(`✓ ${file} följer datamodellen. Länken finns inte i testdatan, så det finns inget facit.`);
      continue;
    }
    const { differences, review } = compareFoods(food, facit);
    if (differences.length === 0) {
      console.log(`✓ ${file} följer datamodellen och stämmer med facit (${facit.id}).`);
    } else {
      console.log(`✗ ${file} skiljer sig från facit (${facit.id}) på ${differences.length} punkter:`);
      for (const d of differences) console.log(`  - ${d}`);
      failed++;
    }
    if (review.length > 0) {
      console.log(`  Fritext som skiljer sig, att läsa igenom men inte fel:`);
      for (const d of review) console.log(`  - ${d}`);
    }
  }
  return failed > 0 ? 1 : 0;
}

const [command, ...args] = process.argv.slice(2);
const commands: Record<string, (args: string[]) => number> = { rensa, kontrollera };

if (!command || !commands[command] || args.length === 0) {
  console.error("Användning: npm run rensa -- <länk> | npm run kontrollera -- <fil.json>");
  process.exit(2);
}
try {
  process.exit(commands[command](args));
} catch (e) {
  console.error((e as Error).message);
  process.exit(1);
}
