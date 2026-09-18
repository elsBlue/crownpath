#!/usr/bin/env node
// @ts-nocheck
/**
 * Apply a Crownpath ingest draft JSON onto catalog source.
 *
 *   node scripts/apply-hero-drafts.mjs drafts/2026-09-18.json
 *   node scripts/apply-hero-drafts.mjs --dry-run drafts/2026-09-18.json
 *
 * Batch max 10. Brace-matched patches only. Then run `npm run check:e7`.
 */
import { readFileSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";
import { applyDraftsToRoot, parseDraftPayload, BATCH_MAX } from "./ingest-lib.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

function parseArgs(argv) {
  const out = { dryRun: false, file: null };
  for (const arg of argv) {
    if (arg === "--dry-run") out.dryRun = true;
    else if (!arg.startsWith("-")) out.file = arg;
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.file) {
    console.error("usage: node scripts/apply-hero-drafts.mjs [--dry-run] drafts/YYYY-MM-DD.json");
    process.exit(2);
  }
  const file = isAbsolute(args.file) ? args.file : join(root, args.file);
  const payload = parseDraftPayload(readFileSync(file, "utf8"));
  if (!payload.heroes.length) {
    console.error("no heroes in draft");
    process.exit(1);
  }
  if (payload.heroes.length > BATCH_MAX) {
    console.error(`batch max is ${BATCH_MAX}, got ${payload.heroes.length}`);
    process.exit(1);
  }
  const result = applyDraftsToRoot(root, payload, {
    dryRun: args.dryRun,
    floor: Number(process.env.APPLY_FLOOR || 3000),
    expectCount: process.env.APPLY_EXPECT_COUNT ? Number(process.env.APPLY_EXPECT_COUNT) : 0,
  });
  console.log(
    `${args.dryRun ? "dry-run" : "applied"} ${result.applied.join(", ")} · ${result.count} units · ${result.lines} lines`,
  );
}

main();
