#!/usr/bin/env node
// @ts-nocheck
/**
 * Groq-extract Journal kit text into drafts/YYYY-MM-DD.json
 *
 *   node scripts/extract-kits.mjs --date 2026-09-18 kits.txt
 *   node scripts/extract-kits.mjs --date 2026-09-18   # stdin
 *
 * Needs GROQ_API_KEY in the environment or .grok/secrets.json.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BATCH_MAX,
  GROQ_MODELS,
  GROQ_SYSTEM_PROMPT,
  catalogFromHeroesSource,
  normalizeDraft,
  parseGroqJson,
  todayStamp,
} from "./ingest-lib.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

function readKey() {
  if (process.env.GROQ_API_KEY) return process.env.GROQ_API_KEY.trim();
  try {
    const raw = JSON.parse(readFileSync(join(root, ".grok/secrets.json"), "utf8"));
    return String(raw.GROQ_API_KEY || "").trim();
  } catch {
    return "";
  }
}

function parseArgs(argv) {
  const out = { date: todayStamp(), file: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--date") out.date = argv[++i];
    else if (!argv[i].startsWith("-")) out.file = argv[i];
  }
  return out;
}

export async function groqExtract(kitText, { key, date, catalog, model } = {}) {
  const models = model ? [model, ...GROQ_MODELS.filter((m) => m !== model)] : GROQ_MODELS;
  let lastErr = null;
  for (const id of models) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: id,
          temperature: 0,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: GROQ_SYSTEM_PROMPT },
            {
              role: "user",
              content: `Checked date: ${date}\nExtract these Journal kits. Max ${BATCH_MAX} heroes.\n\n${kitText}`,
            },
          ],
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        lastErr = new Error(body?.error?.message || `Groq ${res.status}`);
        if (res.status === 429 || res.status === 413 || res.status >= 500) continue;
        throw lastErr;
      }
      const content = body?.choices?.[0]?.message?.content;
      const parsed = parseGroqJson(content);
      const heroes = parsed.heroes.slice(0, BATCH_MAX).map((h) => normalizeDraft(h, catalog, date));
      return { model: id, checkedAt: date, heroes };
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error("Groq extract failed");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const key = readKey();
  if (!key) {
    console.error("Missing GROQ_API_KEY (env or .grok/secrets.json)");
    process.exit(1);
  }
  const input = args.file
    ? readFileSync(isAbsolute(args.file) ? args.file : join(root, args.file), "utf8")
    : readFileSync(0, "utf8");
  if (input.trim().length < 20) {
    console.error("kit text is empty");
    process.exit(1);
  }
  const catalog = catalogFromHeroesSource(readFileSync(join(root, "src/lib/e7/heroes.ts"), "utf8"));
  const result = await groqExtract(input, { key, date: args.date, catalog });
  const dir = join(root, "drafts");
  mkdirSync(dir, { recursive: true });
  const outPath = join(dir, `${args.date}.json`);
  writeFileSync(outPath, JSON.stringify(result, null, 2) + "\n");
  console.log(`wrote ${outPath} · ${result.heroes.length} · ${result.model}`);
  for (const h of result.heroes) {
    console.log(`  ${h.matched ? "ok" : "??"} ${h.id}  ${h.name}  spd ${h.baseSpeed ?? "?"}  ${h.roles.join(",")}`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
