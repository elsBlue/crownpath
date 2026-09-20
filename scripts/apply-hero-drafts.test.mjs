import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  BATCH_MAX,
  applyDraftsToRoot,
  applyHeroObject,
  extractKitsDeterministic,
  formatHeroObject,
  matchHero,
  normalizeDraft,
  sanitizeDraft,
} from "./ingest-lib.mjs";

function miniRoot() {
  const root = mkdtempSync(join(tmpdir(), "e7-ingest-"));
  mkdirSync(join(root, "src/lib/e7"), { recursive: true });
  writeFileSync(
    join(root, "src/lib/e7/heroes.ts"),
    `export const HEROES = [
  {
    id: "cermia",
    name: "Cermia",
    short: "Cermia",
    element: "fire",
    class: "warrior",
    tier: "A",
    roles: ["dps"],
    tags: ["soulburn"],
    kit: "old",
    defense: 5,
    offense: 8,
    baseSpeed: 118,
    verified: false,
  },
  {
    id: "diene",
    name: "Diene",
    short: "Diene",
    element: "ice",
    class: "soulweaver",
    tier: "S",
    roles: ["healer", "cleanse"],
    tags: ["barrier"],
    kit: "cleanse",
    defense: 7,
    offense: 4,
    verified: true,
    checkedAt: "2026-09-01",
  },
];
`,
  );
  writeFileSync(
    join(root, "src/lib/e7/engine.ts"),
    `${"\n".repeat(1000)}function jobFor(hero, label) {
  const n = hero.name;
  switch (hero.id) {
    case "diene":
      return \`\${n} is cleanse and barrier.\`;
    default:
      break;
  }
  return n;
}
`,
  );
  writeFileSync(
    join(root, "src/lib/e7/threats.ts"),
    `${"\n".repeat(400)}export function wallThreats(heroes) {
  const add = () => {};
  const ids = new Set(heroes.map((h) => h.id));
  const rank: Record<string, number> = {
    speedcap: 0,
  };
  return [];
}
`,
  );
  writeFileSync(
    join(root, "src/lib/e7/recipes.ts"),
    `${"\n".repeat(200)}export const RECIPES = [
  {
    slots: [
      { label: "Strip", prefer: ["briar-witch-iseria"] },
      { label: "Control", prefer: ["sage-baal"] },
      { label: "Frontline", prefer: ["mort"] },
    ],
  },
];
`,
  );
  return root;
}

test("matchHero prefers exact name over a longer variant", () => {
  const catalog = [
    { id: "cermia", name: "Cermia", short: "Cermia" },
    { id: "lionheart-cermia", name: "Lionheart Cermia", short: "LHC" },
  ];
  assert.equal(matchHero("Cermia", catalog)?.id, "cermia");
  assert.equal(matchHero("Lionheart Cermia", catalog)?.id, "lionheart-cermia");
  assert.equal(matchHero("LHC", catalog)?.id, "lionheart-cermia");
});

test("sanitize drops seal when Cannot Buff, dual-attack on extra-attack, evade on self stealth", () => {
  const a = sanitizeDraft({
    roles: ["dps"],
    tags: ["seal", "dual-attack", "evade"],
    effects: ["dual-attack"],
    debuffs: ["Cannot Buff"],
    kit: "Extra attack is not Dual Attack. Self Stealth is not a miss nest.",
    flags: ["self-stealth-not-evade"],
  });
  assert.ok(!a.tags.includes("seal"));
  assert.ok(!a.tags.includes("dual-attack"));
  assert.ok(!a.tags.includes("evade"));
  const b = sanitizeDraft({
    roles: ["opener", "dps"],
    tags: ["extra-turn"],
    effects: [],
    debuffs: [],
    kit: "Extra turn is Soulburn only.",
    flags: [],
  });
  assert.ok(!b.roles.includes("opener"));
});

test("normalizeDraft matches catalog and keeps defense", () => {
  const catalog = [{ id: "cermia", name: "Cermia", short: "Cermia", element: "fire", class: "warrior", tier: "A", defense: 5, offense: 8, baseSpeed: 118 }];
  const d = normalizeDraft(
    { name: "Cermia", roles: ["dps"], tags: ["soulburn"], kit: "S1 hit.", jobFor: "Cermia is the execute.", baseSpeed: 118 },
    catalog,
    "2026-09-18",
  );
  assert.equal(d.id, "cermia");
  assert.equal(d.matched, true);
  assert.equal(d.defense, 5);
  assert.equal(d.checkedAt, "2026-09-18");
});

test("applyDraftsToRoot patches kit, jobFor, optional watch and prefer, never drops a unit", () => {
  const root = miniRoot();
  const draft = {
    id: "cermia",
    name: "Cermia",
    short: "Cermia",
    element: "fire",
    class: "warrior",
    tier: "A",
    roles: ["dps"],
    tags: ["unhealable", "soulburn", "extra-turn"],
    debuffs: ["Unhealable"],
    kit: "S2 extra turn. Extra turn is S2, not Soulburn.",
    jobFor: "Cermia is the execute after an extra turn.",
    watch: { key: "cermia-hot", label: "Cermia extra", note: "S2 extra turn is not Soulburn." },
    applyWatch: true,
    prefer: ["Strip"],
    defense: 5,
    offense: 8,
    baseSpeed: 118,
    verified: true,
    checkedAt: "2026-09-18",
  };
  const result = applyDraftsToRoot(root, { heroes: [draft] }, { floor: 1, engineFloor: 1, threatsFloor: 1, recipesFloor: 1 });
  assert.deepEqual(result.applied, ["cermia"]);
  const heroes = readFileSync(join(root, "src/lib/e7/heroes.ts"), "utf8");
  assert.match(heroes, /verified: true/);
  assert.match(heroes, /S2 extra turn/);
  assert.match(heroes, /id: "diene"/);
  const engine = readFileSync(join(root, "src/lib/e7/engine.ts"), "utf8");
  assert.match(engine, /case "cermia":/);
  const threats = readFileSync(join(root, "src/lib/e7/threats.ts"), "utf8");
  assert.match(threats, /cermia-hot/);
  const recipes = readFileSync(join(root, "src/lib/e7/recipes.ts"), "utf8");
  assert.match(recipes, /"cermia"/);
  assert.match(recipes, /prefer: \["mort"\]/);
});

test("batch max is 10 and apply inserts a missing id", () => {
  assert.equal(BATCH_MAX, 10);
  const root = miniRoot();
  const result = applyDraftsToRoot(
    root,
    {
      heroes: [
        {
          id: "haru",
          name: "Haru",
          short: "Haru",
          element: "ice",
          class: "warrior",
          tier: "A",
          roles: ["bruiser"],
          tags: ["barrier"],
          kit: "S1 barrier. Extra turn is not turn 1.",
          jobFor: "Haru is a max-HP bruiser.",
          defense: 7,
          offense: 6,
          baseSpeed: 102,
          verified: true,
          checkedAt: "2026-09-18",
        },
      ],
    },
    { floor: 1, engineFloor: 1, threatsFloor: 1, recipesFloor: 1 },
  );
  assert.deepEqual(result.applied, ["haru"]);
  const heroes = readFileSync(join(root, "src/lib/e7/heroes.ts"), "utf8");
  assert.match(heroes, /id: "haru"/);
  assert.match(heroes, /id: "diene"/);
  assert.match(heroes, /element: "ice"/);
});

test("normalizeDraft prefers paste element over a stub catalog row", () => {
  const catalog = [{ id: "haru", name: "Haru", short: "Haru", element: "fire", class: "warrior", tier: "S", defense: 5, offense: 5, baseSpeed: 100 }];
  const d = normalizeDraft(
    { name: "Haru", element: "ice", class: "warrior", kit: "S1.", jobFor: "x", baseSpeed: 102, defense: 7, offense: 6 },
    catalog,
    "2026-09-18",
  );
  assert.equal(d.element, "ice");
  assert.equal(d.defense, 7);
  assert.equal(d.baseSpeed, 102);
});

test("extractKitsDeterministic reads Name/Element/Speed and leaves Watch empty", () => {
  const text = `Name: Haru
Element: ice
Class: warrior
Speed: 102

S1 Power Anchor. Grants a barrier. This attack does not trigger a Dual Attack.

---

Name: Renoa
Element: dark
Class: ranger
Speed: 122

S3 increases Combat Readiness of all allies by 40%. Extra attack is not Dual Attack. Soulburn.
`;
  const result = extractKitsDeterministic(text, [], "2026-09-18");
  assert.equal(result.heroes.length, 2);
  assert.equal(result.heroes[0].id, "haru");
  assert.equal(result.heroes[0].element, "ice");
  assert.equal(result.heroes[0].baseSpeed, 102);
  assert.equal(result.heroes[0].applyWatch, false);
  assert.equal(result.heroes[0].jobFor, "");
  assert.ok(result.heroes[0].tags.includes("barrier"));
  assert.ok(!result.heroes[0].tags.includes("dual-attack"));
  assert.equal(result.heroes[1].element, "dark");
  assert.ok(result.heroes[1].tags.includes("cr-push"));
});

test("formatHeroObject is brace-replaceable", () => {
  const src = `export const HEROES = [
  {
    id: "cermia",
    name: "Cermia",
    short: "Cermia",
    kit: "old",
    defense: 5,
    offense: 8,
  },
];
`;
  const next = applyHeroObject(src, {
    id: "cermia",
    name: "Cermia",
    short: "Cermia",
    element: "fire",
    class: "warrior",
    tier: "A",
    roles: ["dps"],
    tags: [],
    kit: "new kit",
    defense: 5,
    offense: 8,
    verified: true,
    checkedAt: "2026-09-18",
  });
  assert.match(next, /new kit/);
  assert.equal(formatHeroObject({ id: "x", name: "X", short: "X", element: "fire", class: "warrior", tier: "A", roles: [], tags: [], kit: "k", defense: 1, offense: 1, verified: true, checkedAt: "2026-09-18" }).startsWith("  {"), true);
});
