import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { HEROES, SAMPLE_ROSTER, heroRarity } from "./heroes";
import { heroEffects } from "./effects";
import type { ScoutMode } from "./formation";
import { isOwnerIdentity } from "./owner";
import { DEFAULT_VP } from "./ranks";
import { ARCHETYPE_META, PRESET_DEFENSES, RECIPES } from "./recipes";
import { BATCH_MAX, PREFER_SLOTS, type HeroDraft } from "./ingest";
import type {
  ArchetypeId,
  DefensePreset,
  GuildMember,
  AdminLogRow,
  Hero,
  MatchLog,
  MemberRole,
  Recipe,
  RecipeSource,
  RecipeStat,
  RosterEntry,
  SlotNeed,
  StrategyIdea,
  StrategyIdeaStatus,
  UniqueEffect,
  WallStat,
  Notice,
  NoticeKind,
} from "./types";

export class ForbiddenError extends Error {
  readonly status = 403;
  constructor() {
    super("Forbidden");
    this.name = "ForbiddenError";
  }
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

function asStringList(value: unknown): string[] {
  return parseJson<string[]>(value, []).filter((x) => typeof x === "string");
}

function asUniqueEffects(value: unknown): UniqueEffect[] {
  const raw = parseJson<unknown[]>(value, []);
  const out: UniqueEffect[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const name = String(rec.name ?? "").trim();
    const text = String(rec.text ?? "").trim();
    if (!name) continue;
    out.push({ name, text });
  }
  return out;
}

function asCheckedAt(value: unknown): string | undefined {
  if (!value) return undefined;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const s = String(value);
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m?.[1];
}

function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

function heroFromRow(row: Record<string, unknown>): Hero {
  return {
    id: String(row.id),
    name: String(row.name),
    short: String(row.short),
    element: row.element as Hero["element"],
    class: row.class as Hero["class"],
    tier: row.tier as Hero["tier"],
    roles: asStringList(row.roles) as Hero["roles"],
    tags: asStringList(row.tags) as Hero["tags"],
    effects: asStringList(row.effects) as Hero["effects"],
    buffs: asStringList(row.buffs),
    debuffs: asStringList(row.debuffs),
    uniqueEffects: asUniqueEffects(row.unique_effects),
    kit: String(row.kit ?? ""),
    defense: Number(row.defense ?? 5),
    offense: Number(row.offense ?? 5),
    baseSpeed: (() => {
      const n = Number(row.base_speed);
      return Number.isFinite(n) ? n : undefined;
    })(),
    icon: String(row.icon ?? ""),
    verified: Boolean(row.verified),
    checkedAt: asCheckedAt(row.checked_at),
    rarity: asRarity(row.rarity),
  };
}

function asRarity(value: unknown): Hero["rarity"] {
  const n = Number(value);
  if (n === 3 || n === 4 || n === 5) return n;
  return 5;
}

function recipeFromRow(row: Record<string, unknown>): Recipe {
  const slotsRaw = parseJson<SlotNeed[]>(row.slots, []);
  const slots: Recipe["slots"] = [
    slotsRaw[0] ?? { label: "One" },
    slotsRaw[1] ?? { label: "Two" },
    slotsRaw[2] ?? { label: "Three" },
    slotsRaw[3] ?? { label: "Four" },
  ];
  return {
    id: String(row.id),
    name: String(row.name),
    vs: asStringList(row.vs) as ArchetypeId[],
    summary: String(row.summary ?? ""),
    wincon: String(row.wincon ?? ""),
    setup: String(row.setup ?? ""),
    pitfalls: asStringList(row.pitfalls),
    slots,
    createdBy: row.created_by ? String(row.created_by) : null,
    source: (row.source as RecipeSource) || "seed",
    author:
      String(row.author ?? "").trim() ||
      ((row.source as string) === "admin" ? "Admin" : (row.source as string) === "generated" ? "Generated" : "Catalog"),
  };
}

function presetFromRow(row: Record<string, unknown>): DefensePreset {
  const ids = asStringList(row.hero_ids);
  while (ids.length < 4) ids.push("");
  return {
    id: String(row.id),
    name: String(row.name),
    heroIds: ids.slice(0, 4),
    blurb: String(row.blurb ?? ""),
  };
}

function padFour(ids: string[]): string[] {
  const next = ["", "", "", ""];
  ids.slice(0, 4).forEach((id, i) => {
    next[i] = id ?? "";
  });
  return next;
}

function padThree(ids: string[]): string[] {
  const next = ["", "", ""];
  ids.slice(0, 3).forEach((id, i) => {
    next[i] = id ?? "";
  });
  return next;
}

type ScoutBlob = {
  v: 2 | 3;
  mode: ScoutMode;
  arena: string[];
  gw: string[];
  gw2?: string[];
  gwRound?: 1 | 2;
};

function packScout(
  mode: ScoutMode,
  arena: string[],
  gw: string[],
  gw2: string[] = [],
  gwRound: 1 | 2 = 1,
): ScoutBlob {
  return {
    v: 3,
    mode,
    arena: padFour(arena),
    gw: padFour(gw),
    gw2: padFour(gw2),
    gwRound,
  };
}

function unpackScout(raw: unknown): {
  mode: ScoutMode;
  arena: string[];
  gw: string[];
  gw2: string[];
  gwRound: 1 | 2;
} {
  const value = parseJson<unknown>(raw, raw);
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const blob = value as ScoutBlob;
    if (blob.v === 2 || blob.v === 3) {
      return {
        mode: blob.mode === "arena" ? "arena" : "gw",
        arena: padFour(asStringList(blob.arena)),
        gw: padFour(asStringList(blob.gw)),
        gw2: padFour(asStringList(blob.gw2)),
        gwRound: blob.gwRound === 2 ? 2 : 1,
      };
    }
  }
  const arr = asStringList(value);
  return { mode: "gw", arena: padFour(arr), gw: padFour([]), gw2: padFour([]), gwRound: 1 };
}

function defaultEnemy(): string[] {
  return ["", "", "", ""];
}

function defaultRoster(): Record<string, RosterEntry> {
  const next: Record<string, RosterEntry> = {};
  for (const id of SAMPLE_ROSTER) next[id] = { owned: true, built: true };
  return next;
}

async function ensureCatalog() {
  const sql = await getSql();
  const meta = await sql<{ value: string }>`select value from app_meta where key = 'catalog_seeded'`;
  const seeded = meta[0]?.value === "1";

  for (let i = 0; i < HEROES.length; i++) {
    const h = HEROES[i]!;
    await sql`
      insert into heroes (id, name, short, element, class, tier, roles, tags, effects, buffs, debuffs, unique_effects, kit, defense, offense, base_speed, icon, sort_order, verified, checked_at, rarity)
      values (
        ${h.id}, ${h.name}, ${h.short}, ${h.element}, ${h.class}, ${h.tier},
        ${JSON.stringify(h.roles)}::jsonb, ${JSON.stringify(h.tags)}::jsonb,
        ${JSON.stringify(heroEffects(h))}::jsonb,
        ${JSON.stringify(h.buffs ?? [])}::jsonb,
        ${JSON.stringify(h.debuffs ?? [])}::jsonb,
        ${JSON.stringify(h.uniqueEffects ?? [])}::jsonb,
        ${h.kit}, ${h.defense}, ${h.offense}, ${h.baseSpeed ?? null}, ${h.icon ?? ""}, ${i}, ${h.verified ?? false},
        ${h.verified ? (h.checkedAt ?? todayStamp()) : null}, ${heroRarity(h)}
      )
      on conflict (id) do nothing
    `;
  }
  for (const h of HEROES) {
    await sql`update heroes set rarity = ${heroRarity(h)} where id = ${h.id}`;
  }
  for (const h of HEROES) {
    const effects = heroEffects(h);
    if (effects.length === 0) continue;
    await sql`
      update heroes
      set effects = ${JSON.stringify(effects)}::jsonb
      where id = ${h.id} and (effects is null or effects = '[]'::jsonb)
    `;
  }
  for (const hero of HEROES) {
    if (!hero.verified) continue;
    await sql`
      update heroes set
        roles = ${JSON.stringify(hero.roles)}::jsonb,
        tags = ${JSON.stringify(hero.tags)}::jsonb,
        effects = ${JSON.stringify(heroEffects(hero))}::jsonb,
        buffs = ${JSON.stringify(hero.buffs ?? [])}::jsonb,
        debuffs = ${JSON.stringify(hero.debuffs ?? [])}::jsonb,
        unique_effects = ${JSON.stringify(hero.uniqueEffects ?? [])}::jsonb,
        kit = ${hero.kit},
        defense = ${hero.defense},
        offense = ${hero.offense},
        base_speed = ${hero.baseSpeed ?? null},
        verified = true,
        checked_at = ${hero.checkedAt ?? todayStamp()}
      where id = ${hero.id}
        and (
          verified = false
          or checked_at is null
          or checked_at < ${hero.checkedAt ?? todayStamp()}
        )
    `;
  }
  for (const h of HEROES) {
    if (h.verified) continue;
    await sql`
      update heroes set
        short = ${h.short},
        roles = ${JSON.stringify(h.roles)}::jsonb,
        tags = ${JSON.stringify(h.tags)}::jsonb,
        effects = ${JSON.stringify(heroEffects(h))}::jsonb,
        buffs = ${JSON.stringify(h.buffs ?? [])}::jsonb,
        debuffs = ${JSON.stringify(h.debuffs ?? [])}::jsonb,
        unique_effects = ${JSON.stringify(h.uniqueEffects ?? [])}::jsonb,
        kit = ${h.kit},
        defense = ${h.defense},
        offense = ${h.offense},
        base_speed = ${h.baseSpeed ?? null},
        verified = false,
        checked_at = null
      where id = ${h.id} and verified = false
    `;
  }
  // Seed once. Never overwrite admin / generated recipes (source != seed).
  if (!seeded) {
    for (let i = 0; i < RECIPES.length; i++) {
      const r = RECIPES[i]!;
      await sql`
        insert into recipes (id, name, vs, summary, wincon, setup, pitfalls, slots, sort_order, source)
        values (
          ${r.id}, ${r.name},
          ${JSON.stringify(r.vs)}::jsonb, ${r.summary}, ${r.wincon}, ${r.setup},
          ${JSON.stringify(r.pitfalls)}::jsonb, ${JSON.stringify(r.slots)}::jsonb, ${i},
          'seed'
        )
        on conflict (id) do nothing
      `;
    }
    for (let i = 0; i < PRESET_DEFENSES.length; i++) {
      const p = PRESET_DEFENSES[i]!;
      await sql`
        insert into presets (id, name, hero_ids, blurb, sort_order)
        values (
          ${p.id}, ${p.name}, ${JSON.stringify(p.heroIds)}::jsonb, ${p.blurb}, ${i}
        )
        on conflict (id) do nothing
      `;
    }
    await sql`insert into app_meta (key, value) values ('catalog_seeded', '1') on conflict (key) do nothing`;
  }
  for (let i = 0; i < RECIPES.length; i++) {
    const r = RECIPES[i]!;
    await sql`
      update recipes set
        name = ${r.name},
        vs = ${JSON.stringify(r.vs)}::jsonb,
        summary = ${r.summary},
        wincon = ${r.wincon},
        setup = ${r.setup},
        pitfalls = ${JSON.stringify(r.pitfalls)}::jsonb,
        slots = ${JSON.stringify(r.slots)}::jsonb,
        sort_order = ${i}
      where id = ${r.id} and source = 'seed'
    `;
  }
  for (let i = 0; i < PRESET_DEFENSES.length; i++) {
    const p = PRESET_DEFENSES[i]!;
    await sql`
      insert into presets (id, name, hero_ids, blurb, sort_order)
      values (
        ${p.id}, ${p.name}, ${JSON.stringify(p.heroIds)}::jsonb, ${p.blurb}, ${i}
      )
      on conflict (id) do update set
        name = excluded.name,
        hero_ids = excluded.hero_ids,
        blurb = excluded.blurb,
        sort_order = excluded.sort_order
    `;
  }
  await sql`delete from presets where id = 'cleave-line'`;
}

async function loadOwnerIds(): Promise<string[]> {
  const sql = await getSql();
  const rows = await sql<{ value: string }>`select value from app_meta where key = 'owner_ids'`;
  return parseJson<string[]>(rows[0]?.value, []).filter((x) => typeof x === "string");
}

async function rememberOwnerId(userId: string) {
  const sql = await getSql();
  const ids = await loadOwnerIds();
  if (ids.includes(userId)) return;
  ids.push(userId);
  const value = JSON.stringify(ids);
  await sql`
    insert into app_meta (key, value) values ('owner_ids', ${value})
    on conflict (key) do update set value = excluded.value
  `;
}

async function identitiesFor(userId: string): Promise<string[]> {
  const sql = await getSql();
  const out: string[] = [userId];
  const users = await sql<Record<string, unknown>>`select * from "user" where id = ${userId}`;
  const row = users[0];
  if (row) {
    for (const value of Object.values(row)) {
      if (typeof value === "string" && value.length > 0 && value.length < 320) out.push(value);
    }
  }
  try {
    const accounts = await sql<{ accountId: string | null }>`
      select "accountId" from "account" where "userId" = ${userId}
    `;
    for (const a of accounts) if (a.accountId) out.push(a.accountId);
  } catch {
    /* account table missing in some previews */
  }
  return out;
}

async function isOwnerUserId(userId: string): Promise<boolean> {
  if ((await loadOwnerIds()).includes(userId)) return true;
  const hit = isOwnerIdentity(...(await identitiesFor(userId)));
  if (hit) await rememberOwnerId(userId);
  return hit;
}

async function isAdminUser(userId: string): Promise<boolean> {
  if (await isOwnerUserId(userId)) return true;
  const sql = await getSql();
  const rows = await sql<{ role: string }>`select role from profiles where user_id = ${userId}`;
  return rows[0]?.role === "admin";
}

async function ensureProfile(userId: string) {
  const sql = await getSql();
  const users = await sql<{ name: string | null; email: string | null }>`
    select name, email from "user" where id = ${userId}
  `;
  const admin = await isOwnerUserId(userId);
  const role: MemberRole = admin ? "admin" : "member";
  const existing = await sql<{ user_id: string; role: string }>`
    select user_id, role from profiles where user_id = ${userId}
  `;
  const rosterJson = JSON.stringify(defaultRoster());
  const enemyJson = JSON.stringify(defaultEnemy());
  if (existing.length > 0) {
    if (admin && existing[0]?.role !== "admin") {
      await sql`update profiles set role = ${role} where user_id = ${userId}`;
    }
    await sql`insert into arena_state (user_id, roster, enemy) values (${userId}, ${rosterJson}::jsonb, ${enemyJson}::jsonb) on conflict (user_id) do nothing`;
    return;
  }
  await sql`
    insert into profiles (user_id, display_name, role)
    values (${userId}, ${users[0]?.name ?? null}, ${role})
  `;
  await sql`insert into arena_state (user_id, roster, enemy) values (${userId}, ${rosterJson}::jsonb, ${enemyJson}::jsonb) on conflict (user_id) do nothing`;
}

async function requireAdmin(userId: string) {
  await ensureProfile(userId);
  if (!(await isAdminUser(userId))) throw new ForbiddenError();
}

async function requireOwner(userId: string) {
  if (!(await isOwnerUserId(userId))) throw new ForbiddenError();
}

async function actorLabel(userId: string): Promise<string> {
  const sql = await getSql();
  const rows = await sql<{ ingame_name: string | null; display_name: string | null; email: string | null; name: string | null }>`
    select p.ingame_name, p.display_name, u.email, u.name
    from profiles p
    left join "user" u on u.id = p.user_id
    where p.user_id = ${userId}
  `;
  const r = rows[0];
  return r?.ingame_name || r?.display_name || r?.name || r?.email || "Admin";
}

type EventTarget = { id: string; name: string };

function compactNames(names: string[]): string {
  if (names.length <= 3) return names.join(", ");
  return `${names.slice(0, 3).join(", ")} +${names.length - 3}`;
}

function eventSummary(action: string, names: string[]): string {
  const list = compactNames(names);
  const many = names.length > 1;
  switch (action) {
    case "unit.create":
      return many ? `Added units · ${list}` : `Added unit · ${list}`;
    case "unit.update":
      return many ? `Updated units · ${list}` : `Updated unit · ${list}`;
    case "unit.icon":
      return many ? `Updated icons · ${list}` : `Updated icon · ${list}`;
    case "unit.delete":
      return many ? `Removed units · ${list}` : `Removed unit · ${list}`;
    case "recipe.save":
      return many ? `Updated strategies · ${list}` : `Updated strategy · ${list}`;
    case "recipe.delete":
      return many ? `Removed strategies · ${list}` : `Removed strategy · ${list}`;
    case "wall.save":
      return many ? `Updated walls · ${list}` : `Updated wall · ${list}`;
    case "wall.delete":
      return many ? `Removed walls · ${list}` : `Removed wall · ${list}`;
    case "member.role":
      return `Role · ${list}`;
    case "member.name":
      return `In-game name · ${list}`;
    case "idea.submit":
      return many ? `Logged ideas · ${list}` : `Logged idea · ${list}`;
    case "idea.status":
      return many ? `Reviewed ideas · ${list}` : `Reviewed idea · ${list}`;
    case "idea.delete":
      return many ? `Removed ideas · ${list}` : `Removed idea · ${list}`;
    case "notice.save":
      return many ? `Updated notices · ${list}` : `Updated notice · ${list}`;
    case "notice.delete":
      return many ? `Removed notices · ${list}` : `Removed notice · ${list}`;
    case "ingest.extract":
      return many ? `Extracted kits · ${list}` : `Extracted kit · ${list}`;
    case "ingest.apply":
      return many ? `Ingested units · ${list}` : `Ingested unit · ${list}`;
    default:
      return list || action;
  }
}

async function recordAdminEvent(actorId: string, action: string, target: EventTarget) {
  const sql = await getSql();
  const recent = await sql<{ id: string; targets: unknown }>`
    select id, targets from admin_events
    where actor_id = ${actorId} and action = ${action}
      and updated_at > now() - interval '15 minutes'
    order by updated_at desc
    limit 1
  `;
  if (recent[0]) {
    const prev = parseJson<EventTarget[]>(recent[0].targets, []);
    const map = new Map(prev.map((t) => [t.id, t]));
    map.set(target.id, target);
    await sql`
      update admin_events
      set targets = ${JSON.stringify([...map.values()])}::jsonb, updated_at = now()
      where id = ${recent[0].id}
    `;
    return;
  }
  await sql`
    insert into admin_events (id, actor_id, action, targets)
    values (${crypto.randomUUID()}, ${actorId}, ${action}, ${JSON.stringify([target])}::jsonb)
  `;
}

async function loadCatalog() {
  await ensureCatalog();
  const sql = await getSql();
  const heroRows = await sql<Record<string, unknown>>`select * from heroes order by sort_order, name`;
  const recipeRows = await sql<Record<string, unknown>>`
    select r.*,
      coalesce(nullif(p.ingame_name, ''), nullif(u.email, ''), nullif(u.name, ''), nullif(p.display_name, '')) as author
    from recipes r
    left join profiles p on p.user_id = r.created_by
    left join "user" u on u.id = r.created_by
    order by r.sort_order, r.name
  `;
  const presetRows = await sql<Record<string, unknown>>`select * from presets order by sort_order, name`;
  return {
    heroes: heroRows.map(heroFromRow),
    recipes: recipeRows.map(recipeFromRow),
    presets: presetRows.map(presetFromRow),
  };
}

async function loadMembers(): Promise<GuildMember[]> {
  const sql = await getSql();
  const rows = await sql<{
    user_id: string;
    display_name: string | null;
    ingame_name: string | null;
    role: MemberRole;
    email: string | null;
    name: string | null;
  }>`
    select p.user_id, p.display_name, p.ingame_name, p.role, u.email, u.name
    from profiles p
    left join "user" u on u.id = p.user_id
    order by p.role asc, coalesce(u.email, p.user_id) asc
  `;
  return rows.map((r) => ({
    userId: r.user_id,
    displayName: r.ingame_name || r.display_name || r.name,
    ingameName: r.ingame_name,
    email: r.email,
    role: isOwnerIdentity(r.email, r.display_name, r.name) ? "admin" : r.role,
  }));
}

export type ArenaPayload = {
  vp: number;
  restrictToRoster: boolean;
  enemy: string[];
  enemyArena: string[];
  enemyGw: string[];
  enemyGw2: string[];
  gwRound: 1 | 2;
  scoutMode: ScoutMode;
  lastTeam: string[];
  roster: Record<string, RosterEntry>;
  matches: MatchLog[];
  role: MemberRole;
  displayName: string | null;
  email: string | null;
};

export const getCatalog = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => loadCatalog());

export const getArena = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<ArenaPayload> => {
    await ensureCatalog();
    await ensureProfile(context.userId);
    const sql = await getSql();
    const states = await sql<Record<string, unknown>>`
      select vp, restrict_to_roster, enemy, last_team, roster
      from arena_state where user_id = ${context.userId}
    `;
    const profiles = await sql<{ role: MemberRole; display_name: string | null; ingame_name: string | null }>`
      select role, display_name, ingame_name from profiles where user_id = ${context.userId}
    `;
    const mails = await sql<{ email: string | null; name: string | null }>`
      select email, name from "user" where id = ${context.userId}
    `;
    const owner = await isOwnerUserId(context.userId);
    if (owner && profiles[0]?.role !== "admin") {
      await sql`update profiles set role = 'admin' where user_id = ${context.userId}`;
    }
    const role: MemberRole = owner || profiles[0]?.role === "admin" ? "admin" : "member";
    const matchRows = await sql<Record<string, unknown>>`
      select id, enemy, team, won, vp_delta, note, recipe_id, recipe_name, archetype,
        (extract(epoch from created_at) * 1000)::bigint as at
      from matches
      where user_id = ${context.userId}
      order by created_at desc
      limit 80
    `;
    const row = states[0];
    const scout = unpackScout(row?.enemy);
    return {
      vp: Number(row?.vp ?? DEFAULT_VP),
      restrictToRoster: Boolean(row?.restrict_to_roster ?? false),
      enemy: scout.mode === "gw" ? (scout.gwRound === 2 ? scout.gw2 : scout.gw) : scout.arena,
      enemyArena: scout.arena,
      enemyGw: scout.gw,
      enemyGw2: scout.gw2,
      gwRound: scout.gwRound,
      scoutMode: scout.mode,
      lastTeam: padFour(asStringList(row?.last_team)),
      roster: parseJson<Record<string, RosterEntry>>(row?.roster, defaultRoster()),
      role,
      displayName: profiles[0]?.ingame_name || profiles[0]?.display_name || mails[0]?.name || null,
      email: mails[0]?.email ?? null,
      matches: matchRows.map((m) => ({
        id: String(m.id),
        at: Number(m.at ?? Date.now()),
        enemy: asStringList(m.enemy),
        team: asStringList(m.team),
        won: Boolean(m.won),
        vpDelta: Number(m.vp_delta ?? 0),
        note: String(m.note ?? ""),
        recipeId: m.recipe_id ? String(m.recipe_id) : undefined,
        recipeName: m.recipe_name ? String(m.recipe_name) : undefined,
        archetype: m.archetype ? (String(m.archetype) as ArchetypeId) : undefined,
      })),
    };
  });

const arenaStateSchema = z.object({
  vp: z.number().int().min(800).max(6000),
  restrictToRoster: z.boolean(),
  enemy: z.array(z.string()).max(4),
  lastTeam: z.array(z.string()).max(4),
  roster: z.record(z.string(), z.object({ owned: z.boolean(), built: z.boolean() })),
  scoutMode: z.enum(["gw", "arena"]).optional(),
  enemyGw: z.array(z.string()).max(4).optional(),
  enemyGw2: z.array(z.string()).max(4).optional(),
  gwRound: z.union([z.literal(1), z.literal(2)]).optional(),
});

export const saveArena = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(arenaStateSchema)
  .handler(async ({ context, data }) => {
    await ensureProfile(context.userId);
    const sql = await getSql();
    const mode: ScoutMode = data.scoutMode === "arena" ? "arena" : "gw";
    const packed = packScout(
      mode,
      data.enemy,
      data.enemyGw ?? [],
      data.enemyGw2 ?? [],
      data.gwRound === 2 ? 2 : 1,
    );
    await sql`
      insert into arena_state (user_id, vp, restrict_to_roster, enemy, last_team, roster, updated_at)
      values (
        ${context.userId}, ${data.vp}, ${data.restrictToRoster},
        ${JSON.stringify(packed)}::jsonb,
        ${JSON.stringify(padFour(data.lastTeam))}::jsonb,
        ${JSON.stringify(data.roster)}::jsonb,
        now()
      )
      on conflict (user_id) do update set
        vp = excluded.vp,
        restrict_to_roster = excluded.restrict_to_roster,
        enemy = excluded.enemy,
        last_team = excluded.last_team,
        roster = excluded.roster,
        updated_at = now()
    `;
    return { ok: true as const };
  });

const matchSchema = z.object({
  id: z.string().min(1),
  at: z.number().optional(),
  enemy: z.array(z.string()).max(4),
  team: z.array(z.string()).max(4),
  won: z.boolean(),
  vpDelta: z.number().int(),
  note: z.string().max(280).optional(),
  recipeId: z.string().optional(),
  recipeName: z.string().optional(),
  archetype: z.string().optional(),
});

export const saveMatch = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(matchSchema)
  .handler(async ({ context, data }) => {
    await ensureProfile(context.userId);
    const sql = await getSql();
    const at = new Date(data.at ?? Date.now()).toISOString();
    await sql`
      insert into matches (id, user_id, enemy, team, won, vp_delta, note, recipe_id, recipe_name, archetype, created_at)
      values (
        ${data.id}, ${context.userId},
        ${JSON.stringify(data.enemy)}::jsonb, ${JSON.stringify(data.team)}::jsonb,
        ${data.won}, ${data.vpDelta}, ${data.note ?? ""},
        ${data.recipeId ?? null}, ${data.recipeName ?? null}, ${data.archetype ?? null},
        ${at}
      )
      on conflict (id) do nothing
    `;
    if (data.recipeId) {
      const win = data.won ? 1 : 0;
      const loss = data.won ? 0 : 1;
      await sql`
        insert into recipe_stats (recipe_id, wins, losses, last_at)
        values (${data.recipeId}, ${win}, ${loss}, now())
        on conflict (recipe_id) do update set
          wins = recipe_stats.wins + excluded.wins,
          losses = recipe_stats.losses + excluded.losses,
          last_at = now()
      `;
    }
    if (data.archetype) {
      const win = data.won ? 1 : 0;
      const loss = data.won ? 0 : 1;
      await sql`
        insert into wall_stats (archetype, wins, losses, last_at)
        values (${data.archetype}, ${win}, ${loss}, now())
        on conflict (archetype) do update set
          wins = wall_stats.wins + excluded.wins,
          losses = wall_stats.losses + excluded.losses,
          last_at = now()
      `;
    }
    await sql`
      update arena_state
      set vp = greatest(800, least(6000, vp + ${data.vpDelta})),
          last_team = ${JSON.stringify(padFour(data.team))}::jsonb,
          updated_at = now()
      where user_id = ${context.userId}
    `;
    return { ok: true as const };
  });

export const removeMatch = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`delete from matches where id = ${data.id} and user_id = ${context.userId}`;
    return { ok: true as const };
  });

export const clearMatches = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await sql`delete from matches where user_id = ${context.userId}`;
    return { ok: true as const };
  });

const heroSchema = z.object({
  id: z.string().min(1).max(64).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(80),
  short: z.string().min(1).max(24),
  element: z.enum(["fire", "ice", "earth", "light", "dark"]),
  class: z.enum(["knight", "warrior", "mage", "ranger", "thief", "soulweaver"]),
  tier: z.enum(["SS", "S", "A", "B"]),
  rarity: z.union([z.literal(3), z.literal(4), z.literal(5)]).optional().default(5),
  roles: z.array(z.string()).max(12),
  tags: z.array(z.string()).max(20),
  effects: z.array(z.string()).max(30).optional().default([]),
  buffs: z.array(z.string().max(48)).max(20).optional().default([]),
  debuffs: z.array(z.string().max(48)).max(20).optional().default([]),
  uniqueEffects: z
    .array(
      z.object({
        name: z.string().min(1).max(80),
        text: z.string().max(400),
      }),
    )
    .max(12)
    .optional()
    .default([]),
  kit: z.string().max(800),
  defense: z.number().int().min(0).max(10),
  offense: z.number().int().min(0).max(10),
  baseSpeed: z.number().int().min(70).max(160).optional(),
  icon: z
    .string()
    .max(180000)
    .refine(
      (v) => v === "" || v.startsWith("https://") || v.startsWith("http://") || v.startsWith("data:image/"),
      "Icon must be an image upload or URL",
    )
    .optional()
    .default(""),
  verified: z.boolean().optional().default(false),
  checkedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const saveHero = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(heroSchema)
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    const prev = await sql<{ name: string; short: string; kit: string; icon: string }>`
      select name, short, kit, icon from heroes where id = ${data.id}
    `;
    const checkedAt = data.verified ? todayStamp() : null;
    const rarity = data.rarity === 3 || data.rarity === 4 ? data.rarity : 5;
    await sql`
      insert into heroes (id, name, short, element, class, tier, roles, tags, effects, buffs, debuffs, unique_effects, kit, defense, offense, base_speed, icon, sort_order, verified, checked_at, rarity)
      values (
        ${data.id}, ${data.name}, ${data.short}, ${data.element}, ${data.class}, ${data.tier},
        ${JSON.stringify(data.roles)}::jsonb, ${JSON.stringify(data.tags)}::jsonb,
        ${JSON.stringify(data.effects ?? [])}::jsonb,
        ${JSON.stringify(data.buffs ?? [])}::jsonb,
        ${JSON.stringify(data.debuffs ?? [])}::jsonb,
        ${JSON.stringify(data.uniqueEffects ?? [])}::jsonb,
        ${data.kit}, ${data.defense}, ${data.offense}, ${data.baseSpeed ?? null}, ${""}, 0, ${data.verified ?? false},
        ${checkedAt}, ${rarity}
      )
      on conflict (id) do update set
        name = excluded.name,
        short = excluded.short,
        element = excluded.element,
        class = excluded.class,
        tier = excluded.tier,
        rarity = excluded.rarity,
        roles = excluded.roles,
        tags = excluded.tags,
        effects = excluded.effects,
        buffs = excluded.buffs,
        debuffs = excluded.debuffs,
        unique_effects = excluded.unique_effects,
        kit = excluded.kit,
        defense = excluded.defense,
        offense = excluded.offense,
        base_speed = excluded.base_speed,
        verified = excluded.verified,
        checked_at = excluded.checked_at
    `;
    const before = prev[0];
    const action = !before ? "unit.create" : "unit.update";
    await recordAdminEvent(context.userId, action, { id: data.id, name: data.short || data.name });
    return loadCatalog();
  });

export const saveHeroIcon = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      id: z.string().min(1).max(64),
      icon: z
        .string()
        .max(180000)
        .refine(
          (v) => v === "" || v.startsWith("https://") || v.startsWith("http://") || v.startsWith("data:image/"),
          "Icon must be an image upload or URL",
        ),
    }),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    const row = await sql<{ name: string; short: string }>`
      select name, short from heroes where id = ${data.id}
    `;
    if (!row[0]) throw new Error("Unit not found");
    await sql`update heroes set icon = ${data.icon} where id = ${data.id}`;
    await recordAdminEvent(context.userId, "unit.icon", { id: data.id, name: row[0].short || row[0].name });
    return loadCatalog();
  });

export const deleteHero = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    const row = await sql<{ name: string; short: string }>`select name, short from heroes where id = ${data.id}`;
    await sql`delete from heroes where id = ${data.id}`;
    const label = row[0]?.short || row[0]?.name || data.id;
    await recordAdminEvent(context.userId, "unit.delete", { id: data.id, name: label });
    return loadCatalog();
  });

const slotSchema = z.object({
  label: z.string().min(1).max(32),
  roles: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  prefer: z.array(z.string()).optional(),
});

const recipeSchema = z.object({
  id: z.string().min(1).max(64).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(80),
  vs: z.array(z.string()).max(12),
  summary: z.string().max(400),
  wincon: z.string().max(500),
  setup: z.string().max(500),
  pitfalls: z.array(z.string()).max(8),
  slots: z.array(slotSchema).min(4).max(4),
});

export const saveRecipe = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(recipeSchema)
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    await sql`
      insert into recipes (id, name, vs, summary, wincon, setup, pitfalls, slots, sort_order, created_by, updated_by, source)
      values (
        ${data.id}, ${data.name},
        ${JSON.stringify(data.vs)}::jsonb, ${data.summary}, ${data.wincon}, ${data.setup},
        ${JSON.stringify(data.pitfalls)}::jsonb, ${JSON.stringify(data.slots)}::jsonb, 0,
        ${context.userId}, ${context.userId}, 'admin'
      )
      on conflict (id) do update set
        name = excluded.name,
        vs = excluded.vs,
        summary = excluded.summary,
        wincon = excluded.wincon,
        setup = excluded.setup,
        pitfalls = excluded.pitfalls,
        slots = excluded.slots,
        updated_by = excluded.updated_by,
        source = 'admin',
        created_by = coalesce(recipes.created_by, excluded.created_by)
    `;
    await recordAdminEvent(context.userId, "recipe.save", { id: data.id, name: data.name });
    return loadCatalog();
  });

export const deleteRecipe = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    const row = await sql<{ name: string }>`select name from recipes where id = ${data.id}`;
    await sql`delete from recipes where id = ${data.id}`;
    await recordAdminEvent(context.userId, "recipe.delete", { id: data.id, name: row[0]?.name || data.id });
    return loadCatalog();
  });

const presetSchema = z.object({
  id: z.string().min(1).max(64).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(40),
  heroIds: z.array(z.string()).min(1).max(4),
  blurb: z.string().max(200),
});

export const savePreset = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(presetSchema)
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    await sql`
      insert into presets (id, name, hero_ids, blurb, sort_order)
      values (
        ${data.id}, ${data.name}, ${JSON.stringify(padFour(data.heroIds))}::jsonb, ${data.blurb}, 0
      )
      on conflict (id) do update set
        name = excluded.name,
        hero_ids = excluded.hero_ids,
        blurb = excluded.blurb
    `;
    await recordAdminEvent(context.userId, "wall.save", { id: data.id, name: data.name });
    return loadCatalog();
  });

export const deletePreset = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    const row = await sql<{ name: string }>`select name from presets where id = ${data.id}`;
    await sql`delete from presets where id = ${data.id}`;
    await recordAdminEvent(context.userId, "wall.delete", { id: data.id, name: row[0]?.name || data.id });
    return loadCatalog();
  });

export const listMembers = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<GuildMember[]> => {
    await requireAdmin(context.userId);
    return loadMembers();
  });

export const setMemberRole = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ userId: z.string().min(1), role: z.enum(["member", "admin"]) }))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    if (data.role === "member") {
      if (await isOwnerUserId(data.userId)) {
        throw new Error("Cannot demote the owner.");
      }
      const admins = await sql<{ user_id: string }>`select user_id from profiles where role = 'admin'`;
      if (admins.length <= 1 && admins.some((a) => a.user_id === data.userId)) {
        throw new Error("Keep at least one admin.");
      }
    }
    await sql`update profiles set role = ${data.role} where user_id = ${data.userId}`;
    const named = await sql<{ ingame_name: string | null; display_name: string | null; email: string | null }>`
      select p.ingame_name, p.display_name, u.email
      from profiles p
      left join "user" u on u.id = p.user_id
      where p.user_id = ${data.userId}
    `;
    const who = named[0]?.ingame_name || named[0]?.display_name || named[0]?.email || data.userId;
    await recordAdminEvent(context.userId, "member.role", {
      id: data.userId,
      name: `${who} → ${data.role}`,
    });
    return loadMembers();
  });

export const setIngameName = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ userId: z.string().min(1), name: z.string().max(24) }))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    await requireOwner(context.userId);
    const sql = await getSql();
    const name = data.name.trim().slice(0, 24) || null;
    await sql`update profiles set ingame_name = ${name} where user_id = ${data.userId}`;
    const who = name || data.userId;
    await recordAdminEvent(context.userId, "member.name", { id: data.userId, name: who });
    return loadMembers();
  });

export const listAdminLog = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<AdminLogRow[]> => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      actor_id: string;
      action: string;
      targets: unknown;
      at: string | number | Date;
    }>`
      select id, actor_id, action, targets,
        (extract(epoch from updated_at) * 1000)::bigint as at
      from admin_events
      order by updated_at desc
      limit 80
    `;
    const actorIds = [...new Set(rows.map((r) => r.actor_id))];
    const labels = new Map<string, string>();
    for (const id of actorIds) labels.set(id, await actorLabel(id));
    return rows.map((r) => {
      const targets = parseJson<EventTarget[]>(r.targets, []);
      const names = targets.map((t) => t.name).filter(Boolean);
      return {
        id: r.id,
        at: Number(r.at ?? Date.now()),
        actor: labels.get(r.actor_id) || "Admin",
        summary: eventSummary(r.action, names),
      };
    });
  });

export const getAnalytics = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<{ recipes: RecipeStat[]; walls: WallStat[] }> => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    const catalog = await loadCatalog();
    const stats = await sql<{ recipe_id: string; wins: number; losses: number }>`
      select recipe_id, wins, losses from recipe_stats
    `;
    const byId = new Map(stats.map((s) => [s.recipe_id, s]));
    const recipes: RecipeStat[] = catalog.recipes
      .map((r) => ({
        id: r.id,
        name: r.name,
        author: r.author || "Catalog",
        source: r.source ?? "seed",
        wins: Number(byId.get(r.id)?.wins ?? 0),
        losses: Number(byId.get(r.id)?.losses ?? 0),
      }))
      .sort((a, b) => b.wins + b.losses - (a.wins + a.losses) || a.name.localeCompare(b.name));

    const wallsRaw = await sql<{ archetype: string; wins: number; losses: number }>`
      select archetype, wins, losses from wall_stats
    `;
    const walls: WallStat[] = (Object.keys(ARCHETYPE_META) as ArchetypeId[]).map((id) => {
      const row = wallsRaw.find((w) => w.archetype === id);
      return {
        archetype: id,
        title: ARCHETYPE_META[id].title,
        wins: Number(row?.wins ?? 0),
        losses: Number(row?.losses ?? 0),
      };
    });
    return { recipes, walls };
  });

const IDEA_STATUSES: StrategyIdeaStatus[] = ["inbox", "keep", "skip", "later"];

function ideaSnippet(body: string): string {
  const t = body.replace(/\s+/g, " ").trim();
  return t.length <= 48 ? t : `${t.slice(0, 45)}…`;
}

async function loadIdeas(): Promise<StrategyIdea[]> {
  const sql = await getSql();
  const rows = await sql<{
    id: string;
    body: string;
    about: string;
    status: string;
    verdict: string;
    created_by: string;
    at: string | number | Date;
  }>`
    select id, body, about, status, verdict, created_by,
      (extract(epoch from created_at) * 1000)::bigint as at
    from strategy_ideas
    order by
      case status when 'inbox' then 0 when 'later' then 1 when 'keep' then 2 else 3 end,
      created_at desc
  `;
  const labels = new Map<string, string>();
  for (const id of new Set(rows.map((r) => r.created_by))) {
    labels.set(id, await actorLabel(id));
  }
  return rows.map((r) => ({
    id: r.id,
    body: r.body,
    about: r.about ?? "",
    status: IDEA_STATUSES.includes(r.status as StrategyIdeaStatus)
      ? (r.status as StrategyIdeaStatus)
      : "inbox",
    verdict: r.verdict ?? "",
    author: labels.get(r.created_by) || "Admin",
    at: Number(r.at ?? Date.now()),
  }));
}

export const listStrategyIdeas = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<StrategyIdea[]> => {
    await requireAdmin(context.userId);
    return loadIdeas();
  });

export const saveStrategyIdea = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      body: z.string().trim().min(8).max(2000),
      about: z.string().trim().max(120).optional().default(""),
    }),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    const id = crypto.randomUUID();
    await sql`
      insert into strategy_ideas (id, body, about, created_by)
      values (${id}, ${data.body}, ${data.about ?? ""}, ${context.userId})
    `;
    await recordAdminEvent(context.userId, "idea.submit", {
      id,
      name: ideaSnippet(data.body),
    });
    return loadIdeas();
  });

export const setStrategyIdeaStatus = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      id: z.string().min(1).max(64),
      status: z.enum(["inbox", "keep", "skip", "later"]),
      verdict: z.string().trim().max(800).optional().default(""),
    }),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    const prev = await sql<{ body: string }>`
      select body from strategy_ideas where id = ${data.id}
    `;
    if (!prev[0]) throw new Error("Idea not found");
    await sql`
      update strategy_ideas
      set status = ${data.status},
          verdict = ${data.verdict ?? ""},
          updated_at = now()
      where id = ${data.id}
    `;
    await recordAdminEvent(context.userId, "idea.status", {
      id: data.id,
      name: ideaSnippet(prev[0].body),
    });
    return loadIdeas();
  });

export const deleteStrategyIdea = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string().min(1).max(64) }))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    const prev = await sql<{ body: string }>`
      select body from strategy_ideas where id = ${data.id}
    `;
    if (!prev[0]) throw new Error("Idea not found");
    await sql`delete from strategy_ideas where id = ${data.id}`;
    await recordAdminEvent(context.userId, "idea.delete", {
      id: data.id,
      name: ideaSnippet(prev[0].body),
    });
    return loadIdeas();
  });

const NOTICE_KINDS: NoticeKind[] = ["catalog", "scout", "app"];

function noticeKind(value: unknown): NoticeKind {
  const s = String(value);
  return NOTICE_KINDS.includes(s as NoticeKind) ? (s as NoticeKind) : "catalog";
}

function noticeFromRow(
  row: {
    id: string;
    kind: unknown;
    title: string;
    body: string;
    published: unknown;
    author_id: string;
    at: string | number | Date;
    read?: unknown;
  },
  author: string,
): Notice {
  return {
    id: row.id,
    kind: noticeKind(row.kind),
    title: row.title,
    body: row.body ?? "",
    published: Boolean(row.published),
    author,
    at: Number(row.at ?? Date.now()),
    read: Number(row.read) === 1,
  };
}

async function loadLiveNotices(userId: string): Promise<Notice[]> {
  const sql = await getSql();
  const rows = await sql<{
    id: string;
    kind: string;
    title: string;
    body: string;
    published: boolean;
    author_id: string;
    at: string | number | Date;
    read: number;
  }>`
    select n.id, n.kind, n.title, n.body, n.published, n.author_id,
      (extract(epoch from n.created_at) * 1000)::bigint as at,
      case when r.user_id is not null then 1 else 0 end as read
    from notices n
    left join notice_reads r on r.notice_id = n.id and r.user_id = ${userId}
    where n.published = true
    order by n.created_at desc
    limit 40
  `;
  const labels = new Map<string, string>();
  for (const id of new Set(rows.map((r) => r.author_id))) {
    labels.set(id, await actorLabel(id));
  }
  return rows.map((r) => noticeFromRow(r, labels.get(r.author_id) || "Admin"));
}

async function loadAdminNotices(): Promise<Notice[]> {
  const sql = await getSql();
  const rows = await sql<{
    id: string;
    kind: string;
    title: string;
    body: string;
    published: boolean;
    author_id: string;
    at: string | number | Date;
  }>`
    select id, kind, title, body, published, author_id,
      (extract(epoch from created_at) * 1000)::bigint as at
    from notices
    order by created_at desc
    limit 40
  `;
  const labels = new Map<string, string>();
  for (const id of new Set(rows.map((r) => r.author_id))) {
    labels.set(id, await actorLabel(id));
  }
  return rows.map((r) => noticeFromRow({ ...r, read: true }, labels.get(r.author_id) || "Admin"));
}

export const listNotices = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<Notice[]> => {
    await ensureProfile(context.userId);
    return loadLiveNotices(context.userId);
  });

export const markNoticeRead = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string().min(1).max(64) }))
  .handler(async ({ context, data }) => {
    await ensureProfile(context.userId);
    const sql = await getSql();
    await sql`
      insert into notice_reads (notice_id, user_id)
      select id, ${context.userId} from notices
      where id = ${data.id} and published = true
      on conflict do nothing
    `;
    return loadLiveNotices(context.userId);
  });

export const markAllNoticesRead = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await ensureProfile(context.userId);
    const sql = await getSql();
    await sql`
      insert into notice_reads (notice_id, user_id)
      select id, ${context.userId} from notices where published = true
      on conflict do nothing
    `;
    return loadLiveNotices(context.userId);
  });

export const listAdminNotices = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<Notice[]> => {
    await requireAdmin(context.userId);
    return loadAdminNotices();
  });

export const saveNotice = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      id: z.string().max(64).optional(),
      kind: z.enum(["catalog", "scout", "app"]),
      title: z.string().trim().min(3).max(80),
      body: z.string().trim().min(8).max(2000),
      published: z.boolean(),
    }),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    const id = data.id?.trim() || crypto.randomUUID();
    const existing = await sql<{ id: string }>`select id from notices where id = ${id}`;
    if (existing[0]) {
      await sql`
        update notices
        set kind = ${data.kind},
            title = ${data.title},
            body = ${data.body},
            published = ${data.published},
            updated_at = now()
        where id = ${id}
      `;
    } else {
      await sql`
        insert into notices (id, author_id, kind, title, body, published)
        values (${id}, ${context.userId}, ${data.kind}, ${data.title}, ${data.body}, ${data.published})
      `;
    }
    await recordAdminEvent(context.userId, "notice.save", { id, name: data.title });
    return loadAdminNotices();
  });

export const deleteNotice = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string().min(1).max(64) }))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    const prev = await sql<{ title: string }>`select title from notices where id = ${data.id}`;
    if (!prev[0]) throw new Error("Notice not found");
    await sql`delete from notice_reads where notice_id = ${data.id}`;
    await sql`delete from notices where id = ${data.id}`;
    await recordAdminEvent(context.userId, "notice.delete", {
      id: data.id,
      name: prev[0].title,
    });
    return loadAdminNotices();
  });

export const draftNoticeFromLog = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<string> => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    const rows = await sql<{ action: string; targets: unknown }>`
      select action, targets from admin_events
      where updated_at > now() - interval '24 hours'
        and action in (
          'unit.create', 'unit.update', 'unit.delete',
          'recipe.save', 'recipe.delete',
          'wall.save', 'wall.delete'
        )
      order by updated_at desc
      limit 20
    `;
    const lines: string[] = [];
    const seen = new Set<string>();
    for (const r of rows) {
      const names = parseJson<EventTarget[]>(r.targets, [])
        .map((t) => t.name)
        .filter(Boolean);
      const line = eventSummary(r.action, names);
      if (!line || seen.has(line)) continue;
      seen.add(line);
      lines.push(line);
    }
    return lines.join("\n");
  });

const GROQ_SETTING = "groq_api_key";

async function readGroqKey(): Promise<string> {
  const { readLocalGroqKey } = await import("./ingest-groq.server");
  const local = readLocalGroqKey();
  if (local) return local;
  const sql = await getSql();
  const rows = await sql<{ value: string }>`select value from owner_settings where key = ${GROQ_SETTING}`;
  return rows[0]?.value?.trim() || "";
}

function draftId(batchDate: string, heroId: string) {
  return `${batchDate}:${heroId}`;
}

const draftSchema = z.object({
  id: z.string().min(1).max(64).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(80),
  short: z.string().min(1).max(24),
  element: z.enum(["fire", "ice", "earth", "light", "dark"]),
  class: z.enum(["knight", "warrior", "mage", "ranger", "thief", "soulweaver"]),
  tier: z.enum(["SS", "S", "A", "B"]),
  rarity: z.union([z.literal(3), z.literal(4), z.literal(5)]),
  roles: z.array(z.string()).max(12),
  tags: z.array(z.string()).max(20),
  effects: z.array(z.string()).max(30),
  buffs: z.array(z.string().max(48)).max(20),
  debuffs: z.array(z.string().max(48)).max(20),
  uniqueEffects: z.array(z.object({ name: z.string().min(1).max(80), text: z.string().max(400) })).max(12),
  kit: z.string().min(1).max(800),
  jobFor: z.string().max(400),
  watch: z.object({ key: z.string().min(1).max(40), label: z.string().max(40), note: z.string().max(280) }).nullable(),
  prefer: z.array(z.enum(PREFER_SLOTS)).max(4),
  applyWatch: z.boolean(),
  flags: z.array(z.string()).max(12),
  sourceKit: z.string().max(8000),
  baseSpeed: z.number().int().min(70).max(160).optional(),
  defense: z.number().int().min(0).max(10),
  offense: z.number().int().min(0).max(10),
  verified: z.literal(true),
  checkedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  matched: z.boolean(),
});

export const ingestKeyStatus = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    const key = await readGroqKey();
    return { configured: key.length > 0 };
  });

export const setIngestKey = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ key: z.string().max(200) }))
  .handler(async ({ context, data }) => {
    await requireOwner(context.userId);
    const key = data.key.trim();
    if (key && !key.startsWith("gsk_")) throw new Error("Groq keys start with gsk_");
    const sql = await getSql();
    if (key) {
      await sql`
        insert into owner_settings (key, value, updated_at)
        values (${GROQ_SETTING}, ${key}, now())
        on conflict (key) do update set value = excluded.value, updated_at = now()
      `;
    } else {
      await sql`delete from owner_settings where key = ${GROQ_SETTING}`;
    }
    const { writeLocalGroqKey } = await import("./ingest-groq.server");
    try {
      writeLocalGroqKey(key);
    } catch {
      /* sandbox snapshot may be read-only; DB is enough */
    }
    return { configured: Boolean(key) };
  });

export const listDrafts = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<HeroDraft[]> => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    const rows = await sql<{ payload: unknown }>`
      select payload from hero_drafts where status = 'pending' order by updated_at desc limit 20
    `;
    return rows.map((r) => r.payload as HeroDraft);
  });

export const extractKits = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      text: z.string().min(20).max(40000),
      checkedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      mode: z.enum(["kit", "json"]).default("kit"),
    }),
  )
  .handler(async ({ context, data }): Promise<{ heroes: HeroDraft[]; model?: string; checkedAt: string }> => {
    await requireAdmin(context.userId);
    const checkedAt = data.checkedAt || todayStamp();
    const { catalogIndex } = await import("./ingest-groq.server");
    const { normalizeDraft, parseDraftPayload } = await import("../../../scripts/ingest-lib.mjs");
    const catalog = catalogIndex();
    let heroes: HeroDraft[];
    let model: string | undefined;
    if (data.mode === "json") {
      const parsed = parseDraftPayload(data.text);
      heroes = parsed.heroes.slice(0, BATCH_MAX).map((h: unknown) => normalizeDraft(h, catalog, checkedAt));
    } else {
      const key = await readGroqKey();
      if (!key) throw new Error("Add a Groq API key on this tab first.");
      const { extractKitsWithGroq } = await import("./ingest-groq.server");
      const result = await extractKitsWithGroq(data.text, checkedAt, key);
      heroes = result.heroes;
      model = result.model;
    }
    if (!heroes.length) throw new Error("No heroes in that paste.");
    const sql = await getSql();
    for (const hero of heroes) {
      const id = draftId(hero.checkedAt, hero.id || "unmatched");
      await sql`
        insert into hero_drafts (id, batch_date, hero_id, payload, status, updated_at)
        values (${id}, ${hero.checkedAt}, ${hero.id || "unmatched"}, ${JSON.stringify(hero)}::jsonb, 'pending', now())
        on conflict (id) do update set payload = excluded.payload, status = 'pending', updated_at = now()
      `;
    }
    await recordAdminEvent(context.userId, "ingest.extract", {
      id: checkedAt,
      name: heroes.map((h) => h.short || h.name).join(", "),
    });
    return { heroes, model, checkedAt };
  });

export const applyDrafts = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ heroes: z.array(draftSchema).min(1).max(BATCH_MAX) }))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const unmatched = data.heroes.filter((h) => !h.matched || !h.id);
    if (unmatched.length) {
      throw new Error(`Match these names to a catalog id first: ${unmatched.map((h) => h.name).join(", ")}`);
    }
    const sql = await getSql();
    const { applyDraftsToRoot } = await import("../../../scripts/ingest-lib.mjs");
    const { mkdirSync, writeFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const checkedAt = data.heroes[0]!.checkedAt;
    const dir = join(process.cwd(), "drafts");
    try {
      mkdirSync(dir, { recursive: true });
      writeFileSync(
        join(dir, `${checkedAt}.json`),
        JSON.stringify({ checkedAt, heroes: data.heroes }, null, 2) + "\n",
      );
    } catch {
      /* deployed FS is read-only; DB + catalog upsert still run */
    }
    let sourceError = "";
    try {
      applyDraftsToRoot(process.cwd(), { heroes: data.heroes }, {});
    } catch (err) {
      sourceError = err instanceof Error ? err.message : "Source apply failed";
    }
    for (const hero of data.heroes) {
      await sql`
        insert into heroes (id, name, short, element, class, tier, roles, tags, effects, buffs, debuffs, unique_effects, kit, defense, offense, base_speed, icon, sort_order, verified, checked_at, rarity)
        values (
          ${hero.id}, ${hero.name}, ${hero.short}, ${hero.element}, ${hero.class}, ${hero.tier},
          ${JSON.stringify(hero.roles)}::jsonb, ${JSON.stringify(hero.tags)}::jsonb,
          ${JSON.stringify(hero.effects ?? [])}::jsonb,
          ${JSON.stringify(hero.buffs ?? [])}::jsonb,
          ${JSON.stringify(hero.debuffs ?? [])}::jsonb,
          ${JSON.stringify(hero.uniqueEffects ?? [])}::jsonb,
          ${hero.kit}, ${hero.defense}, ${hero.offense}, ${hero.baseSpeed ?? null}, ${""}, 0, true,
          ${hero.checkedAt}, ${hero.rarity}
        )
        on conflict (id) do update set
          name = excluded.name,
          short = excluded.short,
          element = excluded.element,
          class = excluded.class,
          tier = excluded.tier,
          rarity = excluded.rarity,
          roles = excluded.roles,
          tags = excluded.tags,
          effects = excluded.effects,
          buffs = excluded.buffs,
          debuffs = excluded.debuffs,
          unique_effects = excluded.unique_effects,
          kit = excluded.kit,
          defense = excluded.defense,
          offense = excluded.offense,
          base_speed = excluded.base_speed,
          verified = true,
          checked_at = excluded.checked_at
      `;
      const id = draftId(hero.checkedAt, hero.id);
      await sql`
        insert into hero_drafts (id, batch_date, hero_id, payload, status, updated_at)
        values (${id}, ${hero.checkedAt}, ${hero.id}, ${JSON.stringify(hero)}::jsonb, 'applied', now())
        on conflict (id) do update set payload = excluded.payload, status = 'applied', updated_at = now()
      `;
      await recordAdminEvent(context.userId, "ingest.apply", { id: hero.id, name: hero.short || hero.name });
    }
    const catalog = await loadCatalog();
    return { catalog, sourceError: sourceError || null, applied: data.heroes.map((h) => h.id) };
  });

