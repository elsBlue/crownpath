// @ts-nocheck
/**
 * Shared Notion→draft→catalog helpers. Used by apply-hero-drafts.mjs and
 * extract-kits.mjs. Never rewrite heroes.ts from scratch — brace-match only.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export const BATCH_MAX = 10;
export const DRAFTS_DIR = "drafts";

export const PREFER_SLOTS = [
  "Injury",
  "Frontline",
  "Tech",
  "Sustain",
  "Strip",
  "Control",
  "Lock",
  "Miss",
  "Cover",
  "Closer",
  "True",
  "Opener",
  "Cleave",
];

export const ROLE_IDS = [
  "opener",
  "strip",
  "cleanse",
  "bruiser",
  "cleave",
  "tank",
  "revive",
  "control",
  "soulblock",
  "speedcap",
  "dps",
  "healer",
  "evasion",
];

export const TAG_IDS = [
  "immunity",
  "injury",
  "cr-push",
  "cr-cut",
  "anti-revive",
  "aoe",
  "stun",
  "barrier",
  "counter",
  "dual-attack",
  "soulburn",
  "ignore-er",
  "seal",
  "unhealable",
  "defbreak",
  "extra-turn",
  "invincible",
  "provoke",
  "fixed-dmg",
  "evade",
  "strip",
  "silence",
  "barrier-break",
];

export const EFFECT_IDS = [
  "revive",
  "extinction",
  "increase-cr",
  "decrease-cr",
  "extra-turn",
  "ally-cd-decrease",
  "enemy-cd-increase",
  "increase-hit",
  "increase-evasion",
  "always-crit",
  "damage-reduction",
  "damage-sharing",
  "ignore-damage-sharing",
  "damage-received-limit",
  "increase-crit-resist",
  "increase-pen-resist",
  "soul-removal",
  "resource-reduction",
  "barrier-inversion",
  "buff-dispel",
  "debuff-dispel",
  "buff-duration-decrease",
  "debuff-duration-decrease",
  "dual-attack",
  "injury",
  "counterattack",
  "cannot-counterattack",
];

export const ELEMENT_IDS = ["fire", "ice", "earth", "light", "dark"];
export const CLASS_IDS = ["knight", "warrior", "mage", "ranger", "thief", "soulweaver"];
export const TIER_IDS = ["SS", "S", "A", "B"];

export const FLAG_IDS = [
  "self-stealth-not-evade",
  "self-evasion-not-miss-nest",
  "extra-attack-not-dual-attack",
  "extra-turn-soulburn-only",
  "buff-duration-minus-1-not-strip",
  "cannot-buff-not-seal",
  "skill-effect-nullifier-not-skill-nullifier",
  "cr-cut-not-speedcap",
  "self-skill-nullifier-not-fallen-cecilia",
];

export const GROQ_MODELS = ["openai/gpt-oss-20b", "qwen/qwen3.8-27b", "openai/gpt-oss-120b"];

export const GROQ_SYSTEM_PROMPT = `You extract Epic Seven Journal kits into Crownpath hero drafts.
Return ONLY a JSON object: {"heroes":[...]} with at most 10 heroes.
Do not invent mechanics. If the kit does not say it, omit it.

Each hero:
{
  "name": string,
  "short": string (abbrev like E.Ilynav, max 24 chars),
  "element": fire|ice|earth|light|dark,
  "class": knight|warrior|mage|ranger|thief|soulweaver,
  "tier": SS|S|A|B (PvP use, not star rarity),
  "rarity": 5|4|3,
  "baseSpeed": integer from the Journal (do not guess; omit if missing),
  "roles": draft jobs from [${ROLE_IDS.join(",")}],
  "tags": mechanics from [${TAG_IDS.join(",")}],
  "effects": optional extra engine effects from [${EFFECT_IDS.join(",")}] — omit unless a special case (always-crit, damage-sharing, ignore-damage-sharing, dual-attack, buff-dispel, enemy-cd-increase),
  "buffs": exact in-game buff names,
  "debuffs": exact in-game debuff names,
  "uniqueEffects": [{"name":"tooltip name","text":"short tooltip; self-only vs team-wide must be obvious"}],
  "kit": ONE paragraph, max 800 chars: S1 / S2 / S3, Soulburn, extra attack vs Dual Attack, first-fight cooldowns. Include the callout phrases below when they apply.
  "jobFor": who they are on OUR team. Two sentences max. No "if the wall has…".
  "watch": null, OR {"key":"kebab-id","label":"short","note":"how this changes play on a wall"} — only if the unique is play-changing (first-cycle extra-turn opener, miss-but-debuffs, team-wide unique, immortality window, redirected provoke, extra/counter/DA reaction). Skip imprint, self buff, 25% stun, flavor CR.
  "prefer": subset of [${PREFER_SLOTS.join(",")}] — only the slot they should win. Empty unless obvious. Never Frontline/Sustain unless they ARE that tank/reviver (do not steal Mort or Diene).
  "flags": subset of [${FLAG_IDS.join(",")}]
}

HARD RULES:
- Seal ≠ Cannot Buff. "Cannot Buff" is a debuff, not tag "seal".
- Extra attack ≠ Dual Attack. Do not tag dual-attack unless the kit says Dual Attack.
- Buff duration −1 ≠ strip. Tag strip / effect buff-dispel only when buffs are removed.
- Self evasion or self Stealth ≠ miss nest. Do not tag evade or role evasion unless allies also miss / team miss chance.
- Extra turn from Soulburn only ≠ opener. Role opener + tag extra-turn only when a SKILL grants extra turn (not Soulburn-only). If Soulburn-only, flag extra-turn-soulburn-only and write "Extra turn is Soulburn only" in kit.
- CR reduction ≠ Speed cap. Role speedcap only for a real cap (Harsetti-class).
- Self Skill Nullifier ≠ Fallen Cecilia / team Skill Nullifier.
- Skill Effect Nullifier ≠ Skill Nullifier.
- Do not add Watch for generic stun/sleep/seal/cannot-buff — those already fire.

Callouts to put in kit/unique text when true:
- "Extra attack is not Dual Attack"
- "Self evasion is not a miss nest" / "Self Stealth is not a miss nest"
- "Buff duration −1 is not a strip"
- "Extra turn is Soulburn only"
`;

export function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

export function todayStamp(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function normName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function matchHero(name, catalog) {
  const n = normName(name);
  if (!n) return null;
  const exact = catalog.find((h) => normName(h.name) === n);
  if (exact) return exact;
  const short = catalog.find((h) => normName(h.short) === n);
  if (short) return short;
  const slug = slugify(name);
  return catalog.find((h) => h.id === slug) ?? null;
}

function pickAllowed(list, allowed) {
  const set = new Set(allowed);
  const out = [];
  for (const raw of Array.isArray(list) ? list : []) {
    const v = String(raw).trim();
    if (set.has(v) && !out.includes(v)) out.push(v);
  }
  return out;
}

function asStringList(list, max = 24) {
  const out = [];
  for (const raw of Array.isArray(list) ? list : []) {
    const v = String(raw).trim().slice(0, max);
    if (v && !out.includes(v)) out.push(v);
  }
  return out;
}

export function sanitizeDraft(draft) {
  const kit = String(draft.kit || "");
  const flags = new Set(draft.flags || []);
  const roles = [...(draft.roles || [])];
  const tags = [...(draft.tags || [])];
  const effects = [...(draft.effects || [])];
  const debuffs = [...(draft.debuffs || [])];

  const hasCannotBuff = debuffs.some((d) => /cannot buff/i.test(d));
  if (hasCannotBuff) {
    const i = tags.indexOf("seal");
    if (i >= 0) tags.splice(i, 1);
    flags.add("cannot-buff-not-seal");
  }

  if (/extra attack is not dual attack/i.test(kit) || flags.has("extra-attack-not-dual-attack")) {
    const i = tags.indexOf("dual-attack");
    if (i >= 0) tags.splice(i, 1);
    const e = effects.indexOf("dual-attack");
    if (e >= 0) effects.splice(e, 1);
    flags.add("extra-attack-not-dual-attack");
  }

  if (
    /buff duration|duration −1|duration -1|shortens buff/i.test(kit) &&
    !/\bstrip\b|dispels? (all )?(buffs|one buff)/i.test(kit)
  ) {
    const i = tags.indexOf("strip");
    if (i >= 0) tags.splice(i, 1);
    const e = effects.indexOf("buff-dispel");
    if (e >= 0) effects.splice(e, 1);
    flags.add("buff-duration-minus-1-not-strip");
  }

  if (
    flags.has("self-stealth-not-evade") ||
    flags.has("self-evasion-not-miss-nest") ||
    /self (stealth|evasion) is not a miss nest/i.test(kit)
  ) {
    const i = tags.indexOf("evade");
    if (i >= 0) tags.splice(i, 1);
    const r = roles.indexOf("evasion");
    if (r >= 0) roles.splice(r, 1);
    const e = effects.indexOf("increase-evasion");
    if (e >= 0) effects.splice(e, 1);
  }

  if (flags.has("extra-turn-soulburn-only") || /extra turn is soulburn only/i.test(kit)) {
    const r = roles.indexOf("opener");
    if (r >= 0) roles.splice(r, 1);
    flags.add("extra-turn-soulburn-only");
  }

  if (flags.has("cr-cut-not-speedcap")) {
    const r = roles.indexOf("speedcap");
    if (r >= 0) roles.splice(r, 1);
  }

  draft.roles = roles;
  draft.tags = tags;
  draft.effects = effects;
  draft.flags = [...flags];
  return draft;
}

export function normalizeDraft(raw, catalog, checkedAt) {
  const name = String(raw?.name || "").trim();
  const matched = matchHero(name, catalog) || (raw?.id ? catalog.find((h) => h.id === raw.id) : null);
  const id = matched?.id || slugify(raw?.id || name);
  const element = ELEMENT_IDS.includes(raw?.element) ? raw.element : matched?.element || "fire";
  const klass = CLASS_IDS.includes(raw?.class) ? raw.class : matched?.class || "warrior";
  const tier = TIER_IDS.includes(raw?.tier) ? raw.tier : matched?.tier || "A";
  const rarity = raw?.rarity === 3 || raw?.rarity === 4 || raw?.rarity === 5 ? raw.rarity : matched?.rarity || 5;
  const speed = Number(raw?.baseSpeed ?? matched?.baseSpeed);
  const watch =
    raw?.watch && typeof raw.watch === "object" && String(raw.watch.key || "").trim()
      ? {
          key: slugify(raw.watch.key).slice(0, 40),
          label: String(raw.watch.label || "").trim().slice(0, 40),
          note: String(raw.watch.note || "").trim().slice(0, 280),
        }
      : null;

  const draft = sanitizeDraft({
    id,
    name: matched?.name || name.slice(0, 80),
    short: String(raw?.short || matched?.short || name.split(" ")[0] || name).slice(0, 24),
    element,
    class: klass,
    tier,
    rarity,
    roles: pickAllowed(raw?.roles, ROLE_IDS).slice(0, 8),
    tags: pickAllowed(raw?.tags, TAG_IDS).slice(0, 16),
    effects: pickAllowed(raw?.effects, EFFECT_IDS).slice(0, 16),
    buffs: asStringList(raw?.buffs, 48).slice(0, 16),
    debuffs: asStringList(raw?.debuffs, 48).slice(0, 16),
    uniqueEffects: Array.isArray(raw?.uniqueEffects)
      ? raw.uniqueEffects
          .map((u) => ({
            name: String(u?.name || "").trim().slice(0, 80),
            text: String(u?.text || "").trim().slice(0, 400),
          }))
          .filter((u) => u.name)
          .slice(0, 8)
      : [],
    kit: String(raw?.kit || "").trim().slice(0, 800),
    jobFor: String(raw?.jobFor || "").trim().slice(0, 400),
    watch,
    prefer: pickAllowed(raw?.prefer, PREFER_SLOTS).slice(0, 4),
    applyWatch: Boolean(raw?.applyWatch),
    flags: pickAllowed(raw?.flags, FLAG_IDS),
    sourceKit: String(raw?.sourceKit || "").trim().slice(0, 8000),
    baseSpeed: Number.isFinite(speed) && speed >= 70 && speed <= 160 ? Math.round(speed) : undefined,
    defense: Number.isFinite(Number(raw?.defense)) ? Number(raw.defense) : matched?.defense ?? 5,
    offense: Number.isFinite(Number(raw?.offense)) ? Number(raw.offense) : matched?.offense ?? 5,
    verified: true,
    checkedAt: /^\d{4}-\d{2}-\d{2}$/.test(String(raw?.checkedAt || ""))
      ? raw.checkedAt
      : checkedAt || todayStamp(),
    matched: Boolean(matched),
  });
  if (matched) {
    if (!Number.isFinite(Number(raw?.defense))) draft.defense = matched.defense;
    if (!Number.isFinite(Number(raw?.offense))) draft.offense = matched.offense;
    if (matched.icon) draft.icon = matched.icon;
  }
  return draft;
}

export function parseDraftPayload(text) {
  const raw = typeof text === "string" ? JSON.parse(text) : text;
  if (Array.isArray(raw)) return { checkedAt: todayStamp(), heroes: raw };
  if (raw && Array.isArray(raw.heroes)) {
    return { checkedAt: raw.checkedAt || todayStamp(), heroes: raw.heroes };
  }
  throw new Error("Draft JSON must be { heroes: [...] }");
}

const HEADER_RE = /^(name|id|element|class|speed|base\s*speed|tier|rarity)\s*[:\-]\s*(.+)$/i;

function headerMap(block) {
  const out = {};
  for (const line of String(block).split(/\n/)) {
    const m = line.trim().match(HEADER_RE);
    if (!m) continue;
    out[m[1].toLowerCase().replace(/\s+/g, "")] = m[2].trim();
  }
  return out;
}

function firstNameLine(block) {
  for (const line of String(block).split(/\n/)) {
    const t = line.trim();
    if (!t) continue;
    if (HEADER_RE.test(t)) continue;
    if (/^s[123]\b/i.test(t)) break;
    if (t.length <= 48 && !t.includes(":")) return t;
    break;
  }
  return "";
}

function kitParagraph(block) {
  return String(block)
    .replace(/\r/g, "")
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => l && !HEADER_RE.test(l))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 800);
}

function guessTags(kit) {
  const t = kit.toLowerCase();
  const tags = [];
  const add = (id, on) => {
    if (on && !tags.includes(id)) tags.push(id);
  };
  add("immunity", /\bimmunity\b/.test(t));
  add("injury", /\binjur/.test(t));
  add("cr-push", /combat readiness of all allies|combat readiness \+\d|increases combat readiness/.test(t));
  add("cr-cut", /combat readiness −|combat readiness -|decreases combat readiness|cuts combat readiness/.test(t));
  add("anti-revive", /\bextinction\b|\banti-revive\b/.test(t));
  add("aoe", /all enemies/.test(t));
  add("stun", /\bstun\b/.test(t));
  add("barrier", /\bbarrier\b/.test(t));
  add("counter", /\bcounterattack\b/.test(t));
  const dualDenied = /does not trigger a dual attack|not (a )?dual attack|extra attack is not dual attack/.test(t);
  add("dual-attack", /\bdual attack\b/.test(t) && !dualDenied);
  add("soulburn", /\bsoulburn\b/.test(t));
  add("ignore-er", /ignore(?:s)? effect resistance/.test(t));
  add("unhealable", /\bunhealable\b/.test(t));
  add("defbreak", /decrease defense/.test(t));
  add("extra-turn", /extra turn/.test(t) && !/extra turn is soulburn only/.test(t));
  add("invincible", /\binvincible\b/.test(t));
  add("provoke", /\bprovoke\b/.test(t));
  add("silence", /\bsilence\b/.test(t));
  add("strip", /\bstrip\b|dispels? (all )?(buffs|one buff)/.test(t));
  add("seal", /\bseal\b/.test(t) && !/cannot buff/.test(t));
  return tags;
}

function guessFlags(kit) {
  const t = kit.toLowerCase();
  const flags = [];
  if (/does not trigger a dual attack|extra attack is not dual attack/.test(t)) flags.push("extra-attack-not-dual-attack");
  if (/extra turn is soulburn only/.test(t) || (/soulburn[\s\S]{0,80}extra turn/.test(t) && !/skill[\s\S]{0,40}extra turn/.test(t))) {
    flags.push("extra-turn-soulburn-only");
  }
  if (/self (stealth|evasion) is not a miss nest/.test(t)) flags.push("self-stealth-not-evade");
  if (/cannot buff/.test(t)) flags.push("cannot-buff-not-seal");
  return flags;
}

function namedEffects(block, kind) {
  const names = [];
  const re =
    kind === "buff"
      ? /\b(Barrier|Immunity|Increase (?:Attack|Defense|Speed|Critical Hit Chance|Critical Hit Damage|Effect Resistance)|Invincible|Immortal|Stealth|Indomitable|Morale|Focus)\b/g
      : /\b(Stun|Sleep|Silence|Seal|Unhealable|Provoke|Cannot Buff|Decrease (?:Attack|Defense|Speed|Hit Chance)|Target|Unbuffable)\b/g;
  const text = String(block);
  let m;
  while ((m = re.exec(text))) {
    if (!names.includes(m[1])) names.push(m[1]);
  }
  return names.slice(0, 12);
}

function uniqueFromKit(block) {
  const out = [];
  const re = /^([A-Z][A-Za-z '&.-]{1,40}) \((Unique|Undispellable)\):\s*(.+)$/gm;
  let m;
  while ((m = re.exec(String(block)))) {
    out.push({ name: m[1].trim(), text: `${m[2]}. ${m[3].trim()}`.slice(0, 400) });
  }
  return out.slice(0, 8);
}

export function splitKitBlocks(text) {
  const raw = String(text || "").trim();
  if (!raw) return [];
  const dashed = raw.split(/\n-{3,}\n|\n={3,}\n/).map((s) => s.trim()).filter(Boolean);
  if (dashed.length > 1) return dashed.slice(0, BATCH_MAX);
  const parts = raw.split(/\n(?=(?:Name\s*[:\-]|[A-Z][A-Za-z0-9 '&.-]{1,40}\n(?:S1 |Speed\s*[:\-]|Element\s*[:\-])))/);
  return parts.map((s) => s.trim()).filter(Boolean).slice(0, BATCH_MAX);
}

export function extractKitsDeterministic(text, catalog, date) {
  const blocks = splitKitBlocks(text);
  const heroes = [];
  for (const block of blocks) {
    const headers = headerMap(block);
    const name = headers.name || firstNameLine(block);
    if (!name) continue;
    const kit = kitParagraph(block);
    const flags = guessFlags(kit + "\n" + block);
    const element = String(headers.element || "").toLowerCase();
    const klass = String(headers.class || "").toLowerCase().replace(/\s+/g, "");
    const speedRaw = headers.speed || headers.basespeed;
    const speed = speedRaw ? Number(String(speedRaw).replace(/[^\d.]/g, "")) : undefined;
    heroes.push(
      normalizeDraft(
        {
          name,
          id: headers.id || slugify(name),
          short: name.split(" ")[0],
          element: ELEMENT_IDS.includes(element) ? element : undefined,
          class: CLASS_IDS.includes(klass) ? klass : undefined,
          baseSpeed: speed,
          tags: guessTags(kit),
          buffs: namedEffects(block, "buff"),
          debuffs: namedEffects(block, "debuff"),
          uniqueEffects: uniqueFromKit(block),
          kit: kit || name,
          jobFor: "",
          watch: null,
          prefer: [],
          applyWatch: false,
          flags,
          sourceKit: block.slice(0, 8000),
          roles: [],
        },
        catalog,
        date,
      ),
    );
  }
  if (!heroes.length) throw new Error("No hero kits in that paste. Use SuperGrok JSON, or put Name / Element / Speed at the top of each kit.");
  return { checkedAt: date, heroes };
}

export function parseGroqJson(content) {
  let text = String(content || "").trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) text = fence[1].trim();
  const parsed = JSON.parse(text);
  return parseDraftPayload(parsed);
}

function braceRange(src, id) {
  const needle = `id: "${id}"`;
  const i = src.indexOf(needle);
  if (i < 0) return null;
  const start = src.lastIndexOf("{", i);
  if (start < 0) return null;
  let depth = 0;
  for (let j = start; j < src.length; j++) {
    const ch = src[j];
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        let end = j + 1;
        if (src[end] === ",") end += 1;
        return { start, end };
      }
    }
  }
  return null;
}

function indentOf(src, start) {
  const nl = src.lastIndexOf("\n", start - 1);
  return src.slice(nl + 1, start);
}

export function formatHeroObject(draft, indent = "  ") {
  const inner = indent + "  ";
  const lines = [`${indent}{`];
  const field = (key, value) => {
    lines.push(`${inner}${key}: ${value},`);
  };
  field("id", JSON.stringify(draft.id));
  field("name", JSON.stringify(draft.name));
  field("short", JSON.stringify(draft.short));
  field("element", JSON.stringify(draft.element));
  field("class", JSON.stringify(draft.class));
  field("tier", JSON.stringify(draft.tier));
  if (draft.rarity === 3 || draft.rarity === 4) field("rarity", String(draft.rarity));
  field("roles", JSON.stringify(draft.roles));
  field("tags", JSON.stringify(draft.tags));
  if (Array.isArray(draft.effects) && draft.effects.length) field("effects", JSON.stringify(draft.effects));
  if (draft.buffs?.length) field("buffs", JSON.stringify(draft.buffs));
  if (draft.debuffs?.length) field("debuffs", JSON.stringify(draft.debuffs));
  if (draft.uniqueEffects?.length) {
    lines.push(`${inner}uniqueEffects: [`);
    for (const u of draft.uniqueEffects) {
      lines.push(`${inner}  {`);
      lines.push(`${inner}    name: ${JSON.stringify(u.name)},`);
      lines.push(`${inner}    text: ${JSON.stringify(u.text)},`);
      lines.push(`${inner}  },`);
    }
    lines.push(`${inner}],`);
  }
  field("kit", JSON.stringify(draft.kit));
  field("defense", String(draft.defense ?? 5));
  field("offense", String(draft.offense ?? 5));
  if (Number.isFinite(draft.baseSpeed)) field("baseSpeed", String(draft.baseSpeed));
  if (draft.icon) field("icon", JSON.stringify(draft.icon));
  field("verified", "true");
  field("checkedAt", JSON.stringify(draft.checkedAt));
  lines.push(`${indent}},`);
  return lines.join("\n");
}

export function applyHeroObject(src, draft) {
  const range = braceRange(src, draft.id);
  if (!range) return insertHeroObject(src, draft);
  const indent = indentOf(src, range.start);
  const existing = src.slice(range.start, range.end);
  const icon = existing.match(/\bicon:\s*("[^"]*")/);
  if (icon && !draft.icon) draft.icon = JSON.parse(icon[1]);
  const next = formatHeroObject(draft, indent);
  return src.slice(0, range.start) + next + src.slice(range.end);
}

export function insertHeroObject(src, draft) {
  if (braceRange(src, draft.id)) return applyHeroObject(src, draft);
  const byId = src.indexOf("\nexport const HERO_BY_ID");
  const idx = byId >= 0 ? src.lastIndexOf("];", byId) : src.lastIndexOf("];");
  if (idx < 0) throw new Error("HEROES array close not found");
  const obj = formatHeroObject(draft, "  ");
  return `${src.slice(0, idx)}${obj}\n${src.slice(idx)}`;
}

export function applyJobFor(src, draft) {
  const id = draft.id;
  let text = String(draft.jobFor || "").trim();
  if (!text) return src;
  text = text.replaceAll("`", "\\`").replaceAll("${", "\\${");
  if (text.includes(draft.name)) text = text.replaceAll(draft.name, "${n}");
  else text = "${n} " + text;
  const body = `      return \`${text}\`;`;
  const caseRe = new RegExp(`    case "${id}":\\n      return [\\s\\S]*?;\\n`);
  if (caseRe.test(src)) return src.replace(caseRe, `    case "${id}":\n${body}\n`);
  const needle = "    default:\n      break;";
  const at = src.indexOf(needle);
  if (at < 0) throw new Error("jobFor default not found");
  return src.slice(0, at) + `    case "${id}":\n${body}\n` + src.slice(at);
}

export function applyWatch(src, draft) {
  if (!draft.applyWatch || !draft.watch?.key) return src;
  const { key, label, note } = draft.watch;
  if (src.includes(`key: "${key}"`) || src.includes(`"${key}":`)) return src;
  const detector = `  if (ids.has("${draft.id}")) {
    add({
      key: "${key}",
      label: ${JSON.stringify(label || draft.short || draft.name)},
      note: ${JSON.stringify(note)},
    });
  }

`;
  const rankNeedle = "  const rank: Record<string, number> = {";
  const at = src.indexOf(rankNeedle);
  if (at < 0) throw new Error("threats rank block not found");
  let next = src.slice(0, at) + detector + src.slice(at);
  if (!next.includes(`"${key}":`)) {
    next = next.replace(rankNeedle, `${rankNeedle}\n    ${JSON.stringify(key)}: 10,`);
  }
  return next;
}

export function applyPrefer(src, draft) {
  const slots = Array.isArray(draft.prefer) ? draft.prefer : [];
  if (!slots.length) return src;
  const id = draft.id;
  let out = src;
  for (const slot of slots) {
    const labelRe = new RegExp(`label: "${slot}"`, "g");
    let m;
    while ((m = labelRe.exec(out))) {
      const from = m.index;
      const preferAt = out.indexOf("prefer: [", from);
      const nextLabel = out.indexOf("label:", from + 1);
      if (preferAt < 0 || (nextLabel >= 0 && preferAt > nextLabel)) continue;
      const open = out.indexOf("[", preferAt);
      const close = out.indexOf("]", open);
      if (open < 0 || close < 0) continue;
      const inner = out.slice(open, close + 1);
      if (inner.includes(`"${id}"`)) continue;
      const nextInner = inner.replace(/\]$/, inner.trim() === "[]" ? `"${id}"]` : `, "${id}"]`);
      out = out.slice(0, open) + nextInner + out.slice(close + 1);
    }
  }
  return out;
}

export function catalogFromHeroesSource(src) {
  const out = [];
  const re = /\bid:\s*"([^"]+)"[\s\S]*?\bname:\s*"([^"]+)"[\s\S]*?\bshort:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(src))) out.push({ id: m[1], name: m[2], short: m[3] });
  return out;
}

export function applyDraftsToRoot(root, payload, opts = {}) {
  const heroesPath = join(root, "src/lib/e7/heroes.ts");
  const enginePath = join(root, "src/lib/e7/engine.ts");
  const threatsPath = join(root, "src/lib/e7/threats.ts");
  const recipesPath = join(root, "src/lib/e7/recipes.ts");
  const floor = opts.floor ?? 3000;
  let heroesSrc = readFileSync(heroesPath, "utf8");
  const startLines = heroesSrc.split("\n").length;
  if (startLines < floor) throw new Error(`heroes.ts is ${startLines} lines — abort`);
  const startCount = (heroesSrc.match(/\n    id: "/g) || []).length;

  const drafts = payload.heroes || [];
  if (drafts.length > BATCH_MAX) throw new Error(`batch max is ${BATCH_MAX}`);
  const applied = [];
  let inserted = 0;
  for (const draft of drafts) {
    if (!draft?.id) throw new Error("draft missing id");
    if (!braceRange(heroesSrc, draft.id)) {
      heroesSrc = insertHeroObject(heroesSrc, draft);
      inserted += 1;
    } else {
      heroesSrc = applyHeroObject(heroesSrc, draft);
    }
    applied.push(draft.id);
  }
  const endLines = heroesSrc.split("\n").length;
  if (endLines < floor) throw new Error(`after patch ${endLines} lines — abort write`);
  const endCount = (heroesSrc.match(/\n    id: "/g) || []).length;
  if (endCount !== startCount + inserted) throw new Error(`hero count ${endCount} != ${startCount + inserted}`);
  if (opts.expectCount && endCount !== opts.expectCount) {
    throw new Error(`hero count ${endCount} != ${opts.expectCount}`);
  }
  if (!opts.dryRun) writeFileSync(heroesPath, heroesSrc);

  let engineSrc = readFileSync(enginePath, "utf8");
  let threatsSrc = readFileSync(threatsPath, "utf8");
  let recipesSrc = readFileSync(recipesPath, "utf8");
  for (const draft of drafts) {
    engineSrc = applyJobFor(engineSrc, draft);
    threatsSrc = applyWatch(threatsSrc, draft);
    recipesSrc = applyPrefer(recipesSrc, draft);
  }
  if (engineSrc.split("\n").length < (opts.engineFloor ?? 1000)) throw new Error("engine.ts truncated");
  if (threatsSrc.split("\n").length < (opts.threatsFloor ?? 400)) throw new Error("threats.ts truncated");
  if (recipesSrc.split("\n").length < (opts.recipesFloor ?? 200)) throw new Error("recipes.ts truncated");
  if (!opts.dryRun) {
    writeFileSync(enginePath, engineSrc);
    writeFileSync(threatsPath, threatsSrc);
    writeFileSync(recipesPath, recipesSrc);
  }
  return { applied, lines: endLines, count: endCount };
}

export function parseCatalogIndex(heroesSrc) {
  return catalogFromHeroesSource(heroesSrc);
}
