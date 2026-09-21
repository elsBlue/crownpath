import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";

const STALL = ["harsetti", "last-rider-krau", "belian", "dragon-bride-senya"];
const RGB = ["krau", "diene", "iseria", "ken", "lilias", "landy", "lidica", "lua"];

let vite;
let recommendCounters;
let SAMPLE_ROSTER;

before(async () => {
  vite = await createServer({ server: { middlewareMode: true }, logLevel: "error" });
  const engine = await vite.ssrLoadModule("/src/lib/e7/engine.ts");
  const heroes = await vite.ssrLoadModule("/src/lib/e7/heroes.ts");
  recommendCounters = engine.recommendCounters;
  SAMPLE_ROSTER = heroes.SAMPLE_ROSTER;
});

after(async () => {
  await vite?.close();
});

test("built-only does not leak catalog units", () => {
  const teams = recommendCounters(STALL, RGB, 4);
  assert.ok(teams.length > 0, "small verified roster still fills");
  for (const team of teams) {
    assert.equal(team.theorycraft, false);
    for (const id of team.heroIds) {
      assert.ok(RGB.includes(id), `leaked ${id}`);
    }
  }
});

test("built-only with two heroes returns empty, not the catalog", () => {
  const teams = recommendCounters(STALL, ["diene", "krau"], 4);
  assert.equal(teams.length, 0);
});

test("catalog mode still returns Catalog teams from the full list", () => {
  const teams = recommendCounters(STALL, null, 4);
  assert.ok(teams.length > 0);
  assert.ok(teams.every((t) => t.theorycraft));
});

test("sample roster vs stall stays on roster and does not name missing wincon units", () => {
  const pool = SAMPLE_ROSTER.filter((id) => id !== "harsetti" && id !== "belian");
  const teams = recommendCounters(STALL, pool, 4);
  assert.ok(teams.length > 0);
  for (const team of teams) {
    assert.equal(team.theorycraft, false);
    if (team.wincon.includes("Harsetti")) {
      assert.ok(team.heroIds.includes("harsetti"));
    }
    if (team.wincon.includes("Last Rider Krau")) {
      assert.ok(team.heroIds.includes("last-rider-krau"));
    }
  }
});

test("guild war three seats fill from three built units", () => {
  const teams = recommendCounters(
    ["harsetti", "belian", "dragon-bride-senya"],
    ["empyrean-ilynav", "mort", "briar-witch-iseria"],
    3,
  );
  assert.ok(teams.length > 0);
  for (const team of teams) {
    assert.equal(team.seats, 3);
    assert.equal(team.theorycraft, false);
    assert.ok(team.heroIds.length >= 3);
    for (const id of team.heroIds) {
      assert.ok(["empyrean-ilynav", "mort", "briar-witch-iseria"].includes(id));
    }
  }
});
