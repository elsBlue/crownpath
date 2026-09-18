# Crownpath

Epic Seven arena scout. Product rules live with the code.

## Core files — never rewrite

`engine.ts` is accumulated match logic. A full-file write has already wiped
`recipes.ts` once. That is fatal. Do not let it happen to the engine.

**Never** replace any of these as a whole file (empty `old_string`, “rewrite
the file”, `cat >`, new contents from scratch):

- `src/lib/e7/engine.ts` — floor **1000** lines
- `src/lib/e7/recipes.ts` — floor **200** lines
- `src/lib/e7/threats.ts` — floor **400** lines
- `src/lib/e7/heroes.ts` — floor **3000** lines

Edits **must** be a targeted search-replace of a unique nearby block. If the
replace fails: re-read the function, shrink the patch, retry. Do not start
over. If `engine.ts` is ever shorter than 1000 lines, **stop** — it was
truncated; restore from git before doing anything else.

After touching those files, run `node scripts/guard-e7-core.mjs`.

## Ingest drafts (save SuperGrok usage)

Journal kits are extracted **outside** SuperGrok (Admin → Ingest, or Groq via
`scripts/extract-kits.mjs`). SuperGrok only reviews a draft JSON.

- Batch **max 10**.
- Drafts live in `drafts/YYYY-MM-DD.json`.
- New chat, same Crownpath project: `apply drafts/YYYY-MM-DD.json`. Do **not**
  dump Notion kits into chat. Do **not** rewrite `heroes.ts`.
- Watch / prefer stay off unless the owner ticked them.
- Do **not** publish a notice or Discord pin unless the user asks.

Script: `node scripts/apply-hero-drafts.mjs drafts/YYYY-MM-DD.json` then
`node scripts/guard-e7-core.mjs`. One grounded scout wall if Watch was applied.

## Verify a hero

**Before marking a unit in-game verified, or when the user sends Journal
screenshots / “next hero”,** read
[`src/lib/e7/VERIFY_HERO.md`](src/lib/e7/VERIFY_HERO.md) and run that
checklist. Do **not** audit the whole matcher. Wall types stay at eight.

Copy-grounding for Why / Setup / Breaks-if is still
[`src/lib/e7/SCOUT_AUDIT.md`](src/lib/e7/SCOUT_AUDIT.md) — on **one** wall
that includes the new hero, not the full catalog.

## Scout copy

**Before auditing Scout output, recipes, or Why / Setup / Breaks-if copy,**
read [`src/lib/e7/SCOUT_AUDIT.md`](src/lib/e7/SCOUT_AUDIT.md) and run the
checklist. The bug class is **ungrounded copy**: a sentence true of a kit
in isolation, false for this wall or this filled team.

Journal screenshots, research zips, and kit dumps stay **out of the repo**.
Verified kits live in `src/lib/e7/heroes.ts`. Do not re-copy attachments into
the tree.
