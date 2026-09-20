#!/usr/bin/env node
// @ts-nocheck
/**
 * Mechanical kit parse → drafts/YYYY-MM-DD.json
 * Watch / prefer / tier / jobFor stay empty. SuperGrok fills those.
 *
 *   node scripts/extract-kits.mjs --date 2026-09-18 kits.txt
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  catalogFromHeroesSource,
  extractKitsDeterministic,
  todayStamp,
} from "./ingest-lib.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

function parseArgs(argv) {
  const out = { date: todayStamp(), file: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--date") out.date = argv[++i];
    else if (!argv[i].startsWith("-")) out.file = argv[i];
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const input = args.file
    ? readFileSync(isAbsolute(args.file) ? args.file : join(root, args.file), "utf8")
    : readFileSync(0, "utf8");
  if (input.trim().length < 20) {
    console.error("kit text is empty");
    process.exit(1);
  }
  const catalog = catalogFromHeroesSource(readFileSync(join(root, "src/lib/e7/heroes.ts"), "utf8"));
  const result = extractKitsDeterministic(input, catalog, args.date);
  const dir = join(root, "drafts");
  mkdirSync(dir, { recursive: true });
  const outPath = join(dir, `${args.date}.json`);
  writeFileSync(outPath, JSON.stringify({ checkedAt: result.checkedAt, heroes: result.heroes }, null, 2) + "\n");
  console.log(`wrote ${outPath} · ${result.heroes.length} mechanical drafts (Watch/prefer/jobFor empty)`);
  for (const h of result.heroes) {
    console.log(`  ${h.matched ? "ok" : "new"} ${h.id}  ${h.name}  ${h.element} ${h.class}  spd ${h.baseSpeed ?? "?"}`);
  }
}

const isCli = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isCli) void main();
