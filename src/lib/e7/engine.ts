/**
 * Crownpath scout matcher. Accumulated — never rewrite this file as a whole.
 * Targeted search-replace of a unique nearby block only.
 * If a replace fails, re-read the function and retry a smaller patch.
 * Floor: stay above 1000 lines. Shorter means truncated — restore from git.
 */
import { allHeroes, allRecipes, getHero } from "./catalog";
import { heroEffects } from "./effects";
import { TIER_ORDER } from "./heroes";
import { ARCHETYPE_META } from "./recipes";
import { hitsEvenOnMiss, isFirstCycleOpener, unansweredThreats, wallThreats } from "./threats";
import type {
  ArchetypeId,
  CounterTeam,
  DefenseRead,
  Hero,
  Recipe,
  SlotNeed,
} from "./types";

export function heroesOf(ids: string[]): Hero[] {
  return ids
    .map((id) => getHero(id))
    .filter((h): h is Hero => Boolean(h));
}
function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}
function isReviveUnique(name: string) {
  return /fragment of life|time reversal|sacred covenant|spirit gate|soul exchange|dark contract|vip treatment|spirit lord|superhumanization|it's time to be reborn/i.test(
    name,
  );
}
export function classifyDefense(ids: string[]): DefenseRead | null {
  const heroes = heroesOf(ids);
  if (heroes.length === 0) return null;
  const trusted = heroes.filter((h) => h.verified);
  const unverifiedIds = heroes.filter((h) => !h.verified).map((h) => h.id);
  const tags = unique(trusted.flatMap((h) => h.tags));
  const roles = unique(trusted.flatMap((h) => h.roles));
  const effects = unique(
    trusted.flatMap((h) => heroEffects(h)),
  );
  const buffs = unique(trusted.flatMap((h) => h.buffs ?? []));
  const debuffs = unique(trusted.flatMap((h) => h.debuffs ?? []));
  const uniqueEffects = trusted.flatMap((h) =>
    (h.uniqueEffects ?? []).map((u) => ({ ...u, heroId: h.id })),
  );
  const idSet = new Set(trusted.map((h) => h.id));
  const scores: Record<ArchetypeId, number> = {
    "speed-cleave": 0,
    "harsetti-stall": 0,
    "revive-wall": 0,
    "injury-grind": 0,
    "evasion-counter": 0,
    "turn2-control": 0,
    "immunity-soul": 0,
    "bruiser-mix": 1,
  };
  if (trusted.length > 0) {
    if (idSet.has("harsetti") || roles.includes("speedcap"))
      scores["harsetti-stall"] += 8;
    if (uniqueEffects.some((u) => /skuggiheim/i.test(u.name)))
      scores["harsetti-stall"] += 4;
    const revivers = trusted.filter((h) => h.roles.includes("revive")).length;
    if (revivers > 0) scores["revive-wall"] += 4 + (revivers > 1 ? 3 : 0);
    if (roles.includes("tank") && revivers > 0) scores["revive-wall"] += 2;
    if (
      idSet.has("lisette") ||
      idSet.has("spirit-eye-celine") ||
      idSet.has("apocalypse-ravi") ||
      uniqueEffects.some((u) => isReviveUnique(u.name))
    ) {
      scores["revive-wall"] += 3;
    }
    const injuryCores = trusted.filter(
      (h) =>
        h.id === "empyrean-ilynav" ||
        h.id === "new-moon-luna" ||
        h.id === "urban-shadow-choux" ||
        h.id === "zahhak" ||
        h.id === "lone-crescent-bellona" ||
        h.id === "twisted-eidolon-kayron" ||
        h.id === "monarch-of-the-sword-iseria" ||
        h.id === "disciplinary-prefect-aria" ||
        h.id === "death-dealer-ray" ||
        h.id === "alencia" ||
        h.id === "abigail",
    ).length;
    const injuryN = trusted.filter(
      (h) =>
        h.tags.includes("injury") || (h.effects ?? []).includes("injury"),
    ).length;
    if (injuryN >= 2) scores["injury-grind"] += 5 + injuryN * 2;
    else if (
      injuryCores > 0 &&
      trusted.some(
        (h) => h.roles.includes("tank") || h.roles.includes("bruiser"),
      )
    ) {
      scores["injury-grind"] += 6;
    }
    const evadeCore = trusted.filter(
      (h) =>
        h.id === "setsuka" ||
        h.id === "remnant-violet" ||
        uniqueEffects.some(
          (u) =>
            u.heroId === h.id &&
            /suppressed desire|concentration|demon blade/i.test(u.name),
        ),
    ).length;
    const evadeN = trusted.filter(
      (h) =>
        (h.tags.includes("evade") || h.roles.includes("evasion")) &&
        h.id !== "lone-crescent-bellona" &&
        h.id !== "lone-wolf-peira" &&
        h.id !== "rhianna-and-luciella" &&
        h.id !== "violet" &&
        h.id !== "ae-winter" &&
        h.id !== "festive-eda" &&
        h.id !== "afternoon-soak-flan",
    ).length;
    if (evadeCore > 0)
      scores["evasion-counter"] += 6 + (evadeCore > 1 ? 3 : 0);
    else if (evadeN >= 2) scores["evasion-counter"] += 5;
    if (tags.includes("counter") && evadeCore > 0)
      scores["evasion-counter"] += 2;
    const openers = trusted.filter((h) => h.roles.includes("opener"));
    const distinctCleave = trusted.some(
      (h) =>
        h.roles.includes("cleave") && !openers.some((o) => o.id === h.id),
    );
    if (openers.length > 0 && distinctCleave) scores["speed-cleave"] += 6;
    const aoeCloser = trusted.some(
      (h) =>
        h.tags.includes("aoe") &&
        (h.roles.includes("dps") || h.roles.includes("cleave")) &&
        !h.roles.includes("opener"),
    );
    if (openers.length > 0 && aoeCloser) scores["speed-cleave"] += 4;
    if (
      trusted.some(
        (h) =>
          h.roles.includes("control") &&
          (h.tags.includes("cr-cut") || h.tags.includes("cr-push")),
      )
    ) {
      scores["turn2-control"] += 4;
    }
    if (
      idSet.has("rinak") ||
      idSet.has("lady-of-the-scales") ||
      idSet.has("frieren") ||
      idSet.has("solitaria") ||
      idSet.has("angel-of-light-angelica") ||
      idSet.has("politis") ||
      idSet.has("ambitious-tywin") ||
      idSet.has("sage-baal") ||
      idSet.has("architect-laika") ||
      idSet.has("successor-taeyou") ||
      idSet.has("witch-of-the-mere-tenebria") ||
      idSet.has("abyssal-yufine") ||
      idSet.has("requiem-roana")
    ) {
      scores["turn2-control"] += 3;
    }
    if (
      idSet.has("ainz-ooal-gown") ||
      idSet.has("specter-tenebria") ||
      uniqueEffects.some((u) =>
        /illusion|death sentence|boundless obsession/i.test(u.name),
      )
    ) {
      scores["turn2-control"] += 5;
      scores["speed-cleave"] -= 3;
    }
    if (
      idSet.has("last-rider-krau") &&
      !idSet.has("belian") &&
      trusted.some(
        (h) => h.roles.includes("control") || h.roles.includes("opener"),
      )
    ) {
      scores["turn2-control"] += 4;
    }
    if (idSet.has("belian") || roles.includes("soulblock"))
      scores["immunity-soul"] += 6;
    if (idSet.has("last-rider-krau") && idSet.has("belian"))
      scores["immunity-soul"] += 3;
    if (roles.includes("bruiser") && roles.includes("tank"))
      scores["bruiser-mix"] += 2;
    if (
      idSet.has("notos") ||
      uniqueEffects.some((u) =>
        /god of battle|sanctuary of battle/i.test(u.name),
      )
    ) {
      scores["bruiser-mix"] += 6;
    }
  }
  const archetypePriority: Record<ArchetypeId, number> = {
    "harsetti-stall": 0,
    "evasion-counter": 1,
    "injury-grind": 2,
    "revive-wall": 3,
    "immunity-soul": 4,
    "turn2-control": 5,
    "speed-cleave": 6,
    "bruiser-mix": 7,
  };
  const archetype = (Object.entries(scores) as [ArchetypeId, number][]).sort(
    (a, b) =>
      b[1] - a[1] || archetypePriority[a[0]] - archetypePriority[b[0]],
  )[0]![0];
  const threats = heroes
    .map((h) => ({
      heroId: h.id,
      text: h.verified
        ? h.kit
        : "This kit has not been checked against the in-game journal. Scout ignores it.",
      severity: (h.verified && h.defense >= 9
          ? 3
          : h.verified && h.defense >= 7
            ? 2
            : 1) as 1 | 2 | 3,
    }))
    .sort((a, b) => b.severity - a.severity);
  const watch = wallThreats(trusted);
  if (unverifiedIds.length > 0) {
    const names = unverifiedIds
      .map((id) => getHero(id)?.short ?? id)
      .join(", ");
    watch.unshift({
      key: "unverified",
      label: "Unverified kit",
      note:
        unverifiedIds.length === 1
          ? `${names} has not been checked against the in-game journal. Scout ignores that kit.`
          : `${names} have not been checked against the in-game journal. Scout ignores those kits.`,
    });
  }
  const notes = watch.map((t) => t.note);
  const meta = ARCHETYPE_META[archetype];
  const headline =
    archetype === "evasion-counter" &&
    idSet.has("setsuka") &&
    !idSet.has("remnant-violet")
      ? "Setsuka gives the wall +30% Evasion and counters when an ally evades. That is not Remnant Violet."
      : meta.blurb;
  return {
    archetype,
    title: meta.title,
    headline,
    threats,
    notes,
    watch,
    tags,
    roles,
    effects,
    buffs,
    debuffs,
    uniqueEffects,
    unverifiedIds,
  };
}
function slotScore(
  hero: Hero,
  need: SlotNeed,
  wall?: { offering?: boolean; ferocious?: boolean },
  used?: Set<string>,
): number {
  let score = 0;
  if (!hero.verified) score -= 20;
  if (need.prefer?.includes(hero.id)) score += 8;
  if (need.roles?.some((r) => hero.roles.includes(r))) score += 4;
  if (need.tags?.some((t) => hero.tags.includes(t))) score += 3;
  if (need.avoidRoles?.some((r) => hero.roles.includes(r))) score -= 6;
  if (
    wall?.offering &&
    (hero.effects ?? []).includes("ignore-damage-sharing") &&
    (need.label === "Tech" ||
      need.label === "Cover" ||
      need.label === "Closer" ||
      need.label === "Wincon")
  ) {
    score += 8;
  }
  if (wall?.ferocious && need.tags?.includes("injury")) {
    if (hero.id === "urban-shadow-choux") score += 10;
    else if (hero.id === "new-moon-luna") score += 8;
    else if (hero.tags.includes("aoe") && hero.tags.includes("injury")) score += 6;
  }
  const curse = new Set(["briar-witch-iseria", "hecate"]);
  const revive = new Set([
    "ruele-of-light",
    "school-nurse-yulha",
    "maid-chloe",
    "arbiter-vildred",
    "lisette",
    "spirit-eye-celine",
    "apocalypse-ravi",
    "blood-moon-haste",
    "destina",
    "roana",
  ]);
  const picked = used ?? new Set<string>();
  const curseOn =
    curse.has(hero.id) || [...picked].some((id) => curse.has(id));
  const reviveOn =
    revive.has(hero.id) || [...picked].some((id) => revive.has(id));
  if (curseOn && reviveOn && (curse.has(hero.id) || revive.has(hero.id))) {
    score -= 14;
  }
  score += TIER_ORDER[hero.tier];
  score += hero.offense * 0.15;
  return score;
}
function fillRecipe(
  recipe: Recipe,
  pool: Hero[],
  enemyIds: string[],
  seats: 3 | 4 = 4,
): {
  picks: { label: string; hero: Hero }[];
  heroIds: string[];
  missing: string[];
  coverage: number;
} {
  const used = new Set<string>();
  const enemy = new Set(enemyIds);
  const picks: { label: string; hero: Hero }[] = [];
  const missing: string[] = [];
  const wallHeroes = heroesOf(enemyIds).filter((h) => h.verified);
  const offering = wallHeroes.some((h) =>
    (h.uniqueEffects ?? []).some((u) =>
      /offering|scales of equity/i.test(u.name),
    ),
  );
  const ferocious = wallHeroes.some((h) =>
    (h.uniqueEffects ?? []).some((u) => /ferocious stand/i.test(u.name)),
  );
  for (const need of recipe.slots.slice(0, seats)) {
    let best: Hero | null = null;
    let bestScore = 0;
    for (const hero of pool) {
      if (used.has(hero.id) || enemy.has(hero.id)) continue;
      const s = slotScore(hero, need, { offering, ferocious }, used);
      if (s > bestScore) {
        best = hero;
        bestScore = s;
      }
    }
    if (!best) {
      missing.push(need.label);
      continue;
    }
    const preferHit = Boolean(need.prefer?.includes(best.id));
    const roleHit =
      !need.roles?.length || need.roles.some((r) => best.roles.includes(r));
    const tagHit =
      !need.tags?.length || need.tags.some((t) => best.tags.includes(t));
    const matched =
      bestScore >= 4 &&
      (preferHit ||
        (roleHit &&
          tagHit &&
          Boolean(need.roles?.length || need.tags?.length)));
    if (matched) {
      used.add(best.id);
      picks.push({ label: need.label, hero: best });
    } else {
      missing.push(need.label);
    }
  }
  return {
    picks,
    heroIds: picks.map((p) => p.hero.id),
    missing,
    coverage: (seats - missing.length) / seats,
  };
}
function jobFor(
  hero: Hero,
  label: string,
  ctx?: {
    sanctuary?: boolean;
    wallRevive?: boolean;
    wallCounters?: boolean;
    wallSoulblock?: boolean;
  },
): string {
  const n = hero.name;
  switch (hero.id) {
    case "urban-shadow-choux":
      return `${n} applies injury to every enemy after each of her attacks, so you do not have to choose a single target.`;
    case "empyrean-ilynav":
      return `${n} is the injury core. She also cleanses and can hold the front.`;
    case "lone-crescent-bellona":
      return `${n} injuries everyone once Fighting Spirit is full. Her evasion applies only to herself.`;
    case "twisted-eidolon-kayron":
      return `${n} injuries on his basic attack, and his counters become area injury. Mort turns those counters off; the additional damage on his third skill still lands on a miss.`;
    case "monarch-of-the-sword-iseria":
      return `${n} injuries on Sword of Duty (her counter) and on Dawnbreaker. Fracture stacks Attack on her. Doubled counters also fire the foremost ally.`;
    case "zahhak":
      return `${n} is single-target injury after an extra turn.`;
    case "new-moon-luna":
      return `${n} is area injury and a strip. She starts with Skill Effect Nullifier: one effect from the first skill into her is cancelled. That is not Fallen Cecilia.`;
    case "last-rider-krau":
      return ctx?.sanctuary
        ? `${n} holds the front.`
        : `${n} holds the front and can grant the team Immunity.`;
    case "crimson-armin":
      return `${n} grants the team Immunity and Invincible for one cycle. She does not cleanse. Provoke is her basic attack.`;
    case "dragon-bride-senya":
      return `${n} holds the front. Oath of Punishment does not strip off.`;
    case "notos":
      return `${n} holds the front. God's Might doubles all of his stats and puts Sanctuary of Battle on the field: nobody can be buffed or debuffed. That third skill starts the first fight on cooldown.`;
    case "mort":
      return ctx && ctx.wallCounters === false
        ? `${n} holds the front.`
        : `${n} holds the front and prevents every other hero from countering.`;
    case "dark-corvus":
      return `${n} holds the front. Hits feed his third skill, which ignores damage sharing and applies Extinction if it kills.`;
    case "ruele-of-light":
      return `${n} is the reset if a cycle goes badly.`;
    case "school-nurse-yulha":
      return `${n} revives an ally at full Health with Superhumanization: undispellable +100% max Health and Speed. She also cleanses and heals at the start of every ally turn.`;
    case "maid-chloe":
      return `${n} revives the dead and places Revive on the living.`;
    case "diene":
      return `${n} is cleanse and barrier. She does not grant team Immunity.`;
    case "blood-moon-haste":
      return `${n} is sustain and a strip. Moon Slash only revives if that third skill gets a kill — a clutch, not a reset wall.`;
    case "briar-witch-iseria":
      if (ctx?.sanctuary) {
        return ctx.wallRevive
          ? `${n} is Witch's Curse: nobody revives while she lives. Strip does not land during Sanctuary of Battle.`
          : `${n} is the area strip. Strip does not land during Sanctuary of Battle.`;
      }
      if (ctx?.wallSoulblock) {
        return ctx.wallRevive
          ? `${n} is Witch's Curse: nobody revives while she lives. Cursed Thorn still strips; Soulburn cannot ignore Effect Resistance.`
          : `${n} is the area strip. Cursed Thorn still strips; Soulburn cannot ignore Effect Resistance.`;
      }
      if (ctx?.wallRevive) {
        return `${n} is Witch's Curse: nobody revives while she lives. Soulburn Cursed Thorn is the area strip and ignores Effect Resistance.`;
      }
      return `${n} is the area strip. Soulburn ignores Effect Resistance.`;
    case "hecate":
      return ctx?.wallRevive
        ? `${n} is Death's Dominion: nobody revives, and Immortal does not apply. Her third skill ignores damage sharing. That skill starts the first fight on cooldown.`
        : `${n} ignores damage sharing on her third skill. That skill starts the first fight on cooldown; the passive is the point.`;
    case "belian":
      return `${n} removes soul gain. Play the rest of this draft without Soulburn.`;
    case "beehoo":
      return `${n} strips two, then Cannot Buff and Burn. Incinerate detonates Burn on his turn and cannot Dual Attack — Soulburn is cooldown, not an extra turn.`;
    case "baal-and-sezan":
      return `${n} Poisons two, then Dark Cloud scales with debuff count and resets Last Requiem on a kill. Last Requiem is Unhealable, Decrease Defense, and Decrease Speed.`;
    case "baiken":
      return `${n} stacks Bleed; Tsurane puts three (one ignores Effect Resistance) and extra-turns on a crit. Garyo Tensei detonates Bleeds at end of turn and Combat-Readiness pushes the team on a crit.`;
    case "basar":
      return `${n} is the area strip: Sandstorm dispels all buffs, then Cannot Buff for two turns and cuts Combat Readiness 30%. Soulburn ignores Effect Resistance.`;
    case "bellona":
      return `${n} is area Decrease Defense. At 5 Focus, Windbreak Fan consumes Focus and casts Razorwind Fan — that extra attack is not Dual Attack. Soulburn is an extra turn.`;
    case "benimaru":
      return `${n} Decrease-Defenses, then Hell Flare at full Fighting Spirit — 30% penetrate, 60% with Multilayer Barrier. An enemy extra turn cleanses him, grants Multilayer Barrier, and pushes Combat Readiness 25%.`;
    case "bomb-model-kanna":
      return `${n} strips one, then Increase Speed on all allies and Increase Attack on herself. Shelling Stance is +40% Effectiveness while Full Bombardment is ready.`;
    case "cecilia":
      return `${n} Decrease-Attacks and strips one, then Provokes and grants team Immunity. Barrier and damage scale with her max Health.`;
    case "birgitta":
      return `${n} strips all, then Bind and Block 2 turns. Soulburn ignores Effect Resistance. Subterfuge cleanses two, Swift Attack, Combat Readiness +35%, extra turn. Block is not Seal and not Cannot Buff.`;
    case "blooming-lidica":
      return `${n} Thorned Vine after an ally hits a debuffed target: buff duration −1 and Cannot Buff 2 turns — not a strip. Fruit of Ecstasy grants Skill Nullifier once to all allies. Penetrate 50%, up to 100% if faster. Cannot crit.`;
    case "brieg":
      return `${n} grants team Barrier and undispellable Perception, then extra-turns. Limitless Sword Arts strips all, Decrease Defense and Decrease Speed. Full Fighting Spirit after S1 extra-attacks that — extra attack, not Dual Attack.`;
    case "byblis":
      return `${n} A Larunda's Hospitality is buff duration −1, Decrease Hit Chance, and 10 Soul Removal — not a strip. When an ally is counterattacked, I'm Warning You cuts two buff durations.`;
    case "celine":
      return `${n} Blink after an enemy non-attack skill: cleanse, +10 Soul, Combat Readiness +30%. Thunderclap ignores damage sharing. Stealth and Evasion are only on herself.`;
    case "cerise":
      return `${n} Luminous Explosion is Stun and Cannot Buff. Frost Storm Restricts Combat Readiness other than Speed, Decrease-Speeds, then Invincible 1 turn. Soulburn ignores Effect Resistance.`;
    case "charles":
      return `${n} Slash 65% dispels one, then 50% extra-attacks Smash (100% with three or more buffs) — extra attack, not Dual Attack. Faithful Strike is team Increase Attack, Increase Defense, and Counterattack on himself.`;
    case "charlotte":
      return `${n} Dual Swords always crits. If she has a buff and it is not a Dual Attack, it hits everyone. Vortex is Unhealable and penetrates the highest Defense. While buffed, +50% damage and 50% damage reduction.`;
    case "cermia":
      return `${n} Hot Streak grants Increase Attack (Greater), resets All-In, extra turn. All-In penetrates 50%. Extra turn is S2, not Soulburn.`;
    case "chloe":
      return `${n} Magic Bolt is Increase Attack, Magic Nail, Combat Readiness +50%, and ignores Effect Resistance. Hyper Strike Stuns; ignores Effect Resistance if the target is nailed.`;
    case "choux":
      return `${n} Fwoooosh! penetrates 70%. At 5 Focus it consumes Focus, deals more, and resets. Extra turn is Soulburn only.`;
    case "command-model-laika":
      return `${n} Strike Order is Target, Increase Attack (Greater) on the highest-Attack ally, Dual Attack. Volley Fire is Decrease Speed and Sleep, then team Immunity.`;
    case "destina":
      return `${n} Destina's Grace revives all dead to 30% Health and full-cleanses the living. Spirit's Blessing is self-only undispellable Effect Resistance +60%.`;
    case "dizzy":
      return `${n} Emotional Gamma Ray misses the hit but still inflicts Decrease Speed, Decrease Attack, and Decrease Hit Chance. Extra turn is Soulburn only.`;
    case "eda":
      return `${n} Cold Snap strips two, cuts Combat Readiness, and grants Skill Nullifier once on herself. Extra turn is Soulburn only.`;
    case "edward-elric":
      return `${n} Rise! after you hit him while he has a debuff: strip one, a random debuff, Combat Readiness +20%. His third skill ignores damage sharing vs non-boss.`;
    case "elena":
      return `${n} Consecrated Ground heals everyone after an area attack. Eternally Shining Comet cleanses one, Invincible 1 turn, Increase Effect Resistance 2 turns.`;
    case "eligos":
      return `${n} Cloak and Trigger is resource −60%, strip two, Target and Decrease Defense, Combat Readiness −35%. Soulburn ignores Effect Resistance.`;
    case "elphelt":
      return `${n} Magnum Wedding strips two, Sleep and Decrease Defense, then extra-turns. Barrage is Cannot Buff, not Seal.`;
    case "elvira":
      return `${n} Capturing Sacrifice strips all, Unhealable and Decrease Defense, Immortality 3 turns, and ignores cooldown manip. Extra turn is Soulburn only.`;
    case "emilia":
      return `${n} Spirit's Blessing cleanses two, Increase Attack, Combat Readiness +40% on an ally. Divine Protection cleanses two from everyone, heals, Barrier.`;
    case "ervalen":
      return `${n} Heir to the Throne is Counterattack and Barrier; a kill extra-turns and extends buffs. Extra turn is on a kill, not turn 1.`;
    case "estelle":
      return `${n} injuries on Shield Strike and Dazzling Strike, always crits. Protective Nature is 30% share; she is not the default tank.`;
    case "eye-of-the-abyss-fumyr":
      return `${n} Blue Despair strips two and extra-turns. Eye of the Abyss Detains the foremost Hero and ignores Effect Resistance.`;
    case "fairytale-tenebria":
      return `${n} Tea Party strips one, Cannot Buff, Redirected Provoke. Extra turn is Soulburn only.`;
    case "fenne":
      return `${n} injures herself, not the enemy, then heals the team. Love=Pain is a once-per-battle self-revive to 30% Health. That is not team revive.`;
    case "fenris":
      return `${n} Soaring Arrow after an ally extra attack, counter, or Dual Attack: hits everyone, cleanses two, Combat Readiness +30%. Strike of Fate is Increase Attack (Greater) and team Combat Readiness +30%.`;
    case "fern":
      return `${n} Release penetrates 70% and Speed-scales. That third skill starts the first battle on full cooldown. Self evasion is not a miss nest.`;
    case "festive-eda":
      return `${n} Let Me Give It a Try strips two, Decrease Defense, Silence. If Stealth is off at turn start she cleanses and Expected Outcome cuts Combat Readiness 50%. Self Stealth is not a miss nest.`;
    case "flan":
      return `${n} Advantageous Deal is skill cooldown +1, Decrease Defense, Combat Readiness −15%. Data Monopoly is Increase Attack, Increase Critical Hit Damage, Combat Readiness +30%. Extra turn is Soulburn only.`;
    case "frida":
      return `${n} Oasis All-Ride Pass: her first Soulburn and the foremost ally's first Soulburn cost 0. Oasis Land cleanses one, Combat Readiness +15%, Increase Attack.`;
    case "fumyr":
      return `${n} Fruit of Knowledge at full Focus: full strip, Sleep, Decrease Defense. Sensory Dissection strips two, cooldown +1, Combat Readiness −40%. Extra turn is Soulburn only.`;
    case "shepherd-diene":
      return `${n} strips when anyone Soulburns.`;
    case "architect-laika":
      return `${n} strips, inflicts Target, and takes an extra turn into her third skill if Target lands.`;
    case "ran":
      return `${n} grants team Immunity, then extra-turns into a strip. Frostbite turns damage sharing off.`;
    case "faithless-lidica":
      return `${n} strips two, applies Laceration, and takes an extra turn. Hits after that become injury.`;
    case "rinak":
      return `${n} strips, cuts Combat Readiness, and takes an extra turn. Stay on Pickpocketing unless the fight is over.`;
    case "straze":
      return `${n} is the area wipe. His second skill strips all and cannot be countered.`;
    case "judge-kise":
      return `${n} strips all, cannot be countered, and Soulburn ignores Effect Resistance.`;
    case "successor-taeyou":
      return `${n} is the area strip of two. Soulburn ignores Effect Resistance. With Possession, Azure Phantom extra-turns. Possession also counters on a critical hit. Roaring Spiritfall does not Dual Attack.`;
    case "arbiter-vildred":
      return `${n} is the area wipe. Dark Contract is a self-revive; anti-revive still shuts it.`;
    case "navy-captain-landy":
      return `${n} is extra-attack area damage. She is immune to Stun, Sleep, and Fear.`;
    case "little-queen-charlotte":
      return `${n} is the closer. Soulburn on her third skill cannot miss. Extinction applies only if that skill kills.`;
    case "specimen-sez":
      return `${n} stuns, then Extinction-kills if Light Storm gets the last hit.`;
    case "setsuka":
      return `${n} is the miss core. She buffs team evasion and counters when an ally is missed.`;
    case "remnant-violet":
      return `${n} is the miss magnet. Massacre charges on Focus; Solitaria turns that off.`;
    case "conqueror-lilias":
      return `${n} Dual Attacks without Soulburn, which bypasses evasion.`;
    case "sea-phantom-politis":
      return `${n} Dual Attacks while Enraged and cuts enemy resources. She is not a soul lock.`;
    case "solitaria":
      return `${n} sets enemy Focus gain to zero and locks the next cycle after the strip.`;
    case "sage-baal":
      return `${n} strips into Sleep. Sleep is ignored by Mort, Little Queen Charlotte, Dark Corvus, and Navy Captain Landy.`;
    case "frieren":
      return `${n} is strip and control. At four Soul, Defensive Magic nullifies a skill; Belian keeps her under that.`;
    case "lone-wolf-peira":
      return `${n} is the extra-turn opener. Her evasion is only on herself.`;
    case "harsetti":
      return `${n} caps enemy Speed. Do not bring a Combat Readiness stack as the win condition.`;
    case "genesis-ras":
      return `${n} covers himself with Sacred Covenant, a self-only revive. That is not team Immunity.`;
    case "fallen-cecilia":
      return `${n} holds a Skill Nullifier. Do not lead with the only strip into her.`;
    case "angel-of-light-angelica":
      return `${n} is Stun-immune. Guardian Angel can grant Skill Nullifier when she is hit by area attacks.`;
    case "lionheart-cermia":
      return `${n} extra-turns after her third skill. Dual Attacks and extra attacks into an ally reset that skill \u2014 do not give it to her.`;
    case "witch-of-the-mere-tenebria":
      return `${n} strips two, then applies Block so the wall cannot buff or cleanse. Soulburn is an extra turn. While Mirror of the Abyss is on cooldown, her basic attack Dual Attacks. Stealth is only on herself.`;
    case "dragon-king-sharun":
      return `${n} cleanses Stun, Sleep, and Fear from allies and grants Cascade: the next attack deals 4,000 extra damage. Is It Going to Rain? is Cannot Buff and a class debuff, not a strip.`;
    case "astromancer-elena":
      return `${n} turns enemy counters off while she has Star's Blessing. Enraged Star's Retribution is Unhealable and Restrict, not a strip. Soulburn ignores Effect Resistance.`;
    case "commander-pavel":
      return `${n} ignores damage sharing on his third skill. Begone is area damage after ally crits, then a full Combat Readiness bar. Extra attacks, counters, and Dual Attacks do not charge it.`;
    case "silver-blade-aramintha":
      return `${n} stuns everyone on Meteor Fall and applies two Burns. Flame Release is an extra attack that detonates Burn, not Dual Attack. Attack scales from Effectiveness at the start of the first fight.`;
    case "sylvan-sage-vivian":
      return `${n} starts immune to debuffs at full Focus. Hits of 30% max Health spend Focus for damage reduction. Nature's Judgment cuts ally cooldowns by one. Soulburn is area and does not Dual Attack.`;
    case "desert-jewel-basar":
      return `${n} cleanses everyone and grants Immunity. Desert Storm strips two and inverts Barrier into damage. Extra turn only if a target has Barrier.`;
    case "bystander-hwayoung":
      return `${n} is immune to buffs and debuffs. That is not the Immunity buff — strip does not apply. Sura ignores damage sharing and damage reduction on heroes, and Extinction if it kills.`;
    case "disciplinary-prefect-aria":
      return `${n} injuries on Disciplinary Action while Purge is on cooldown. That extra attack always crits. Enemy Soulburn costs double — this is not Belian.`;
    case "martial-artist-ken":
      return `${n} counters when an ally is crit, and Dragon Flame when he is crit. Mort and Star's Blessing turn those counters off. The Coming of Asura is area Decrease Defense.`;
    case "salome":
      return `${n} grants herself Skill Nullifier, clones a target, then takes an extra turn. Corrupted Divinity Dual Attacks from the highest Attack ally. Collapse is not injury.`;
    case "abyssal-yufine":
      return `${n} is the area strip. Frenzied Strike ignores Effect Resistance and cuts Combat Readiness by 50%. Trauma is on herself. Inner Abyss is not a Speed cap.`;
    case "rhianna-and-luciella":
      return `${n} strip two, Bind, then extra turn into the other sister. Pursuit of Death is area strip, Fear, and ignore damage sharing. Afterdream is 70% evasion after the third skill.`;
    case "hellion-lua":
      return `${n} grants Challenge to everyone. A Hero hitting her makes those allies counter and pushes Combat Readiness. Lua's Challenge is not a strip. Mort turns the counters off.`;
    case "operator-sigret":
      return `${n} is the area Combat Readiness cut. Obliterate is buff duration −1, not a strip. Extra turn only if Annihilation kills. Bonus damage if the target has Barrier.`;
    case "pirate-captain-flan":
      return `${n} steals a buff. Hunt fires after an ally hits a target with no buffs: Swift Attack and Combat Readiness. Full Burst is area steal, then Bomb. Bomb stun is delayed.`;
    case "ainz-ooal-gown":
      return `${n} strips every buff, then Silence. Death Sentence is 50,000 at the 12th turn and ignores damage sharing — it falls off if he dies. Extra turn is Soulburn only.`;
    case "archdemons-shadow":
      return `${n} seals passives. Burst is an extra area attack after a sealed S1, not Dual Attack. Dissolution is extra turn and does not trigger counters.`;
    case "eternal-wanderer-ludwig":
      return `${n} grants himself Skill Nullifier. Any Soulburn pushes his Combat Readiness and stacks penetrate. Extra turn is Soulburn only.`;
    case "requiem-roana":
      return `${n} is the area strip. Eternal Lament also increases cooldowns and cuts Combat Readiness. Boundless Obsession is not a Speed cap.`;
    case "specter-tenebria":
      return `${n} cannot be selected while an ally lives. Endless Nightmare is a guaranteed stun. Poison Blast does not trigger counters. Extra turn is Soulburn only.`;
    case "tidal-rift-elvira":
      return `${n} seals, then can extra-attack with Twisted Strike. Engulf is Crit Hit Resistance, not Immunity. Lethal damage on her grants Cascade to her team. Extra attack is not Dual Attack.`;
    case "top-model-luluca":
      return `${n} extra-turns after a team Combat Readiness push. Demolish is extinction only if it kills. Extra attack on Energy Blast is not Dual Attack. Ignores damage sharing versus Heroes.`;
    case "zio":
      return `${n} strips two, then Silence. Deify is extra attack on S1 and 50% damage reduction when hit. Extra attack is not Dual Attack. Supreme Authority is not a Speed cap.`;
    case "mediator-kawerik":
      return `${n} strips every buff, then a team Barrier. Nature Restoration is the team cleanse and Immunity. Barrier is not Barrier Inversion.`;
    case "death-dealer-ray":
      return `${n} is the area strip and extra turn. Pestilence makes allies apply Venom, then detonate it — Venom is the injury. Clinical Trial does not trigger Dual Attack.`;
    case "boss-arunka":
      return `${n} holds the front. Ferocious Stand forces single-target skills onto her. Area attacks ignore that.`;
    case "lady-of-the-scales":
      return `${n} puts Offering on the front: seventy percent of damage is shared there. When that ally dies, the team heals. Combat Readiness you push, she steals.`;
    case "ambitious-tywin":
      return `${n} is area Stun and soul removal. He does not strip. Rage makes Stun ignore Effect Resistance.`;
    case "apocalypse-ravi":
      return `${n} is a bruiser with injury on her basic attack. A kill with Soul Exchange revives one ally — anti-revive shuts that. This is not a Ruele reset.`;
    case "spirit-eye-celine":
      return `${n} revives all dead allies with Spirit Gate. One hit cannot exceed 70% Health. Anti-revive shuts the revive. She is not an evasion unit.`;
    case "closer-charles":
      return `${n} starts with evasion for one turn. After an ally hits a unit under 40% Health, he pushes Combat Readiness. Descent does not trigger counters.`;
    case "politis":
      return `${n} cuts Combat Readiness gain by half and clips buff duration when they use a non-attack skill. Starfall is Cannot Buff. She is not a soul lock.`;
    case "uncharted-pioneer-politis":
      return `${n} is the area strip, then cooldown +1. Additional damage still lands if the attack misses. Extra turn is after the mission, not turn 1.`;
    case "lisette":
      return `${n} is the reset. Dead allies return as Fragment of Life; Time Reversal rolls the fight back. Anti-revive shuts both.`;
    case "designer-lilibet":
      return `${n} converts your debuffs into Fighting Spirit, then self-cleanses and grants herself Immunity. Model Disqualification is area penetrate, not injury.`;
    case "abigail":
      return `${n} is the injury strip. Scarlet Garden strips then injures; Blood Banquet Immortality-saves the back row.`;
    case "adventurer-ras":
      return `${n} is the Dual Attack after Command Strike. Purifying Flame is Increase Defense on the team, not a strip.`;
    case "ae-giselle":
      return `${n} is the Frame of Light kill extra turn. Linguistic Wisdom is self Combat Readiness amplify, not a team opener.`;
    case "ae-karina":
      return `${n} is the Defense-scale punch. Rocket Punch barriers the team when an ally drops to half.`;
    case "ae-ningning":
      return `${n} is the barrier inversion strip. System Hacking turns barriers into damage.`;
    case "ae-winter":
      return `${n} is the Black Out stun; extra damage on crit grows each use. Stealth is on herself, not a miss nest.`;
    case "afternoon-soak-flan":
      return `${n} Dual Attacks from Focus; her own-turn basic hits everyone and always crits. Self evasion is not a miss nest.`;
    case "aki":
      return `${n} is the burn detonate strip. Soulburn spends Health for an extra turn, not turn 1.`;
    case "albedo":
      return `${n} is the Bicorn counter after an ally crit. Rage of Nazarick is Cannot Buff, not Seal.`;
    case "alencia":
      return `${n} is area injury while Mind's Eye is up. Trample is an extra attack, not Dual Attack; Genesis strips then grants Defense Up.`;
    case "amid":
      return `${n} is the Forest Blessing extra turn; Skill Nullifier is once on the whole team. Touch of Hope is Swift Attack, not an opener.`;
    case "aram":
      return `${n} is Rapid Rescue Combat Readiness; that skill ignores cooldown manip. Warming Up is after an area attack, not turn 1.`;
    case "aramintha":
      return `${n} is the area strip and Unhealable. Fire Pillar stuns; Soulburn ignores Effect Resistance.`;
    case "argent-waves-hwayoung":
      return `${n} Swallow Kicks after an ally non-attack; with Vigor she extra-turns. Lightning Kicks strips one. Extra turn is not turn 1.`;
    case "aria":
      return `${n} puts Stealth and Barrier on allies, Counterattack on herself. Dark Shadow Phantom strips two and cuts Combat Readiness when Focus is full. Extra turn is Soulburn only.`;
    case "arunka":
      return `${n} is the barrier check. Expose is an extra attack, not Dual Attack. Thrashing Extinction applies only if that skill kills.`;
    case "aubade-ludwig":
      return `${n} strips two, then Block and Silence. With Dawn, Light of Condemnation is 1,000–25,000 additional on everyone from Souls spent. Extra attack is not Dual Attack.`;
    case "aube":
      return `${n} grants Cascade and Skill Nullifier, then extra-turns. Eternal Moment strips two, then Immobilize and Restrict. Concealment is not Illusion — area skills still hit her.`;
    default:
      break;
  }
  switch (label) {
    case "Injury":
      return `${n} is the injury. Cutting maximum Health is how this draft wins a long fight.`;
    case "Frontline":
    case "Tank":
    case "Hold":
      return `${n} holds the front while the rest of the plan plays out.`;
    case "Sustain":
    case "Support":
      return `${n} keeps the draft alive if a cycle goes badly.`;
    case "Anti-revive":
      return `${n} turns revive off. That only holds while they are alive.`;
    case "Tech":
    case "Cover":
      return `${n} covers the plan \u2014 strip, anti-revive, or soul lock.`;
    case "Opener":
      return `${n} takes the first turn and sets up the rest of the cycle.`;
    case "Strip":
      return `${n} removes the wall's buffs so the rest of the draft can land.`;
    case "Cleave":
    case "AoE":
      return `${n} is the area damage that has to end the fight on that cycle.`;
    case "Closer":
    case "Wincon":
      return `${n} is the unit that has to win the fight.`;
    case "Control":
    case "Lock":
      return `${n} takes the next cycle after you survive the opener.`;
    case "Miss":
      return `${n} is the miss core. Single-target skills into this unit will fail often.`;
    case "Force":
    case "True":
      return `${n} deals hits that do not care about evasion.`;
    case "Cap":
      return `${n} caps enemy Speed.`;
    case "Soul lock":
      return `${n} removes soul gain.`;
    default:
      return `${n} fills the ${label.toLowerCase()} role in this draft.`;
  }
}
function setupFor(
  picks: { label: string; hero: Hero }[],
  read: DefenseRead,
): string {
  const sanctuary = read.uniqueEffects.some((u) =>
    /sanctuary of battle|god of battle/i.test(u.name),
  );
  const wallRevive =
    read.roles.includes("revive") ||
    read.uniqueEffects.some((u) => isReviveUnique(u.name));
  const wallCounters =
    read.tags.includes("counter") ||
    read.watch.some((t) => t.key === "evade" || t.key === "no-counter") ||
    read.uniqueEffects.some((u) =>
      /elbris's successor|sword of duty|possession|spirit invocation/i.test(
        u.name,
      ),
    );
  const wallSoulblock =
    read.roles.includes("soulblock") ||
    read.watch.some((t) => t.key === "soulblock");
  return picks
    .map((p) =>
      jobFor(p.hero, p.label, {
        sanctuary,
        wallRevive,
        wallCounters,
        wallSoulblock,
      }),
    )
    .join(" ");
}
function pitfallsFor(picks: { label: string; hero: Hero }[], read: DefenseRead): string[] {
  const filled = picks.map((p) => p.hero);
  const names = new Set(filled.map((h) => h.id));
  const ranked: { prio: number; line: string }[] = [];
  const push = (prio: number, line: string) => ranked.push({ prio, line });
  const uniq = (re: RegExp) => read.uniqueEffects.some((u) => re.test(u.name));
  const stripper = filled.find(
    (h) => h.tags.includes("strip") || h.roles.includes("strip") || h.tags.includes("anti-revive"),
  );
  const sanctuary = uniq(/sanctuary of battle|god of battle/i);
  const injury = filled.some((h) => h.tags.includes("injury"));

  if (read.watch.some((t) => t.key === "first-cycle")) {
    push(
      0,
      read.roles.includes("revive")
        ? "They extra-turn on the first cycle. A slow tank draft dies before anti-revive matters. Contest the opener, miss the cycle, or live it."
        : "They extra-turn on the first cycle. A slow tank draft dies before the rest of the wall matters. Contest the opener, miss the cycle, or live it.",
    );
  }
  if (read.watch.some((t) => t.key === "cannot-miss")) {
    push(
      0,
      "The extra-turn third skill hits everyone even on miss. Evasion does not save you. If a second DPS follows, the fight is over.",
    );
  }
  if (read.watch.some((t) => t.key === "aubade")) {
    push(
      1,
      "Light of Condemnation is 1,000–25,000 additional on everyone from Souls spent. Stun that turn or kill him before Dawn stacks Souls.",
    );
  }
  if (read.watch.some((t) => t.key === "benimaru")) {
    push(
      1,
      filled.some(
        (h) =>
          h.tags.includes("extra-turn") ||
          (h.effects ?? []).includes("extra-turn") ||
          h.roles.includes("opener"),
      )
        ? "Your extra turn cleanses Benimaru, grants Multilayer Barrier, and pushes Combat Readiness 25%. Do not extra-turn into him."
        : "An extra turn on your side cleanses him and grants Multilayer Barrier. Hell Flare then penetrates 60%.",
    );
  }
  if (read.watch.some((t) => t.key === "celine")) {
    push(1, "A non-attack skill into Celine Blink-cleanses her and Combat-Readiness pushes 30%. Open with an attack.");
  }
  if (read.watch.some((t) => t.key === "byblis") && filled.some((h) => h.tags.includes("counter"))) {
    push(
      1,
      "Your counters fire I'm Warning You: buff duration −2 and Decrease Defense on you. That is not a strip.",
    );
  }

  if (sanctuary) {
    push(
      0,
      injury
        ? "Sanctuary of Battle turns buffs and debuffs off for both sides. Stay on injury. Strip, stun, and Immunity will not land while it is up."
        : "Sanctuary of Battle turns buffs and debuffs off for both sides. Strip and stun will not land. Kill him before God's Might, or bring injury.",
    );
  }
  if (!sanctuary && (uniq(/^block$/i) || read.debuffs.includes("Block"))) {
    push(
      1,
      "Block: Immunity will not land, and other heroes cannot dispel your debuffs. That is not Seal — passives still run.",
    );
  }
  if (
    !sanctuary &&
    uniq(/mirror of the abyss/i) &&
    names.has("lionheart-cermia")
  ) {
    push(
      6,
      "Witch of the Mere Dual Attacks while her third skill is on cooldown. A Dual Attack into Lionheart Cermia resets her third skill.",
    );
  }
  if (
    !sanctuary &&
    uniq(/lullaby for waves/i) &&
    filled.some(
      (h) =>
        h.tags.includes("stun") ||
        (h.debuffs ?? []).includes("Stun") ||
        (h.debuffs ?? []).includes("Sleep") ||
        (h.debuffs ?? []).includes("Fear"),
    )
  ) {
    push(
      5,
      "Do not Stun, Sleep, or Fear this wall. Lullaby for Waves cleanses that lock and grants Cascade: 4,000 extra damage on their next attack.",
    );
  }
  if (read.roles.includes("speedcap")) {
    push(
      1,
      injury
        ? "This wall caps Speed. Stay on injury; a cleave will not work."
        : "This wall caps Speed. You cannot outrun the first cycle.",
    );
  }
  if (
    !sanctuary &&
    (read.roles.includes("soulblock") || uniq(/shackles of suppression/i)) &&
    names.has("briar-witch-iseria")
  ) {
    push(
      2,
      "Belian turns Soulburn off. Cursed Thorn still strips; it just has to pass Effect Resistance.",
    );
  }
  if (uniq(/offering|scales of equity/i) && !filled.some((h) => (h.effects ?? []).includes("ignore-damage-sharing"))) {
    push(
      2,
      "Offering still shares seventy percent of damage onto the front. Do not spend the closer into the back while the front is alive.",
    );
  }
  if (read.roles.includes("revive")) {
    const anti = filled.find((h) => h.tags.includes("anti-revive"));
    const ourRevive = [
      "ruele-of-light",
      "school-nurse-yulha",
      "maid-chloe",
      "arbiter-vildred",
      "lisette",
      "spirit-eye-celine",
      "apocalypse-ravi",
      "blood-moon-haste",
    ];
    const clashCovered =
      (names.has("briar-witch-iseria") || names.has("hecate")) &&
      ourRevive.some((id) => names.has(id));
    if (!clashCovered) {
      push(
        3,
        anti
          ? `Revive on this wall is off only while ${anti.name} is alive.`
          : "This wall can reset. Injury you have already stacked is lost unless anti-revive or Extinction lands.",
      );
    }
  }
  if (names.has("briar-witch-iseria") && names.has("ruele-of-light")) {
    push(
      4,
      sanctuary
        ? "Witch's Curse turns Ruele's revive off. During Sanctuary her Barrier does not apply either — she is heals only."
        : "Witch's Curse turns Ruele's revive off as well. She is heals and Barrier only while Briar Witch Iseria is alive.",
    );
  }
  if (names.has("briar-witch-iseria") && names.has("school-nurse-yulha")) {
    push(
      4,
      "Witch's Curse turns School Nurse Yulha's revive off as well. She is still the per-turn cleanse and heal.",
    );
  }
  if (names.has("hecate") && (names.has("ruele-of-light") || names.has("school-nurse-yulha") || names.has("maid-chloe") || names.has("lisette") || names.has("arbiter-vildred") || names.has("spirit-eye-celine") || names.has("apocalypse-ravi") || names.has("blood-moon-haste"))) {
    push(4, "Death's Dominion turns your revive off as well while Hecate is alive.");
  }
  if (names.has("briar-witch-iseria") && names.has("maid-chloe")) {
    push(4, "Witch's Curse turns Maid Chloe's revive off. VIP Treatment does not land while she lives.");
  }
  if (names.has("briar-witch-iseria")) {
    const silenced = filled.filter((h) =>
      ["lisette", "arbiter-vildred", "spirit-eye-celine", "apocalypse-ravi", "blood-moon-haste"].includes(h.id),
    );
    if (silenced.length) {
      push(
        4,
        `Witch's Curse turns ${silenced.map((h) => h.name).join(" / ")} revive off while she lives.`,
      );
    }
  }
  if (names.has("belian")) {
    const soulWin = filled.find(
      (h) =>
        h.id !== "belian" &&
        (h.id === "briar-witch-iseria" ||
          /soulburn 20:\s*extra turn/i.test(h.kit ?? "")),
    );
    if (soulWin) {
      push(
        4,
        `Belian on this draft turns Soulburn off. ${soulWin.name}'s Soulburn does not exist.`,
      );
    }
  }
  if (names.has("mort") && filled.some((h) => h.id !== "mort" && h.tags.includes("counter"))) {
    push(4, "Mort on this draft turns your other counters off. Non-counter skills still play.");
  }
  if (uniq(/ferocious stand/i)) {
    const aoeInjury = filled.some((h) => h.tags.includes("injury") && h.tags.includes("aoe"));
    if (aoeInjury) {
      push(
        5,
        "Ferocious Stand only blocks single-target skills. The injury in this draft hits everyone, so you do not have to attack Arunka.",
      );
    } else if (names.has("zahhak") || names.has("empyrean-ilynav")) {
      push(5, "Ferocious Stand forces single-target injury onto Arunka. You have to accept hitting her.");
    }
  }
  if (
    stripper &&
    !sanctuary &&
    read.uniqueEffects.some(
      (u) =>
        /guardian angel|forest blessing|hysteria/i.test(u.name) ||
        (/^skill nullifier$/i.test(u.name) &&
          (u.heroId === "fallen-cecilia" ||
            u.heroId === "angel-of-light-angelica")),
    )
  ) {
    push(6, `Skill Nullifier eats the first skill. Do not open with ${stripper.name}.`);
  }
  if (uniq(/^clone$/i) && stripper) {
    push(6, `Clone copies a kit for one turn. Dispelling it also removes unique effects she copied. Nullifier still eats the first skill — do not open with ${stripper.name}.`);
  }
  if (
    uniq(/^bind$/i) &&
    filled.some(
      (h) =>
        h.id !== "mort" &&
        (h.tags.includes("dual-attack") ||
          h.tags.includes("extra-turn") ||
          h.tags.includes("counter")),
    )
  ) {
    push(
      5,
      "Bind turns extra skills, counters, and Dual Attacks off on that hero while it is not their turn.",
    );
  }
  if (uniq(/insight/i) && stripper) {
    push(
      5,
      "Insight is Focus, not an Immunity buff. Strip does not turn it off. Hit 30% of max Health to spend Focus.",
    );
  }
  if (uniq(/divine vessel/i) && stripper) {
    push(
      5,
      "Divine Vessel is immune to buffs and debuffs. Strip does not apply to her.",
    );
  }
  if (
    uniq(/barrier inversion|desert storm/i) &&
    filled.some((h) => h.tags.includes("barrier"))
  ) {
    push(
      5,
      "Do not put Barrier on this wall. Desert Storm inverts it into damage and takes an extra turn.",
    );
  }
  if (uniq(/dark moon|noias/i) && filled.some((h) => h.tags.includes("soulburn"))) {
    push(6, "Any Soulburn on this wall triggers Dark Moon and strips your team. Do not Soulburn.");
  }
  if (uniq(/can you handle this/i) && filled.some((h) => h.tags.includes("soulburn"))) {
    push(6, "Any Soulburn on this wall pushes Eternal Wanderer Ludwig and stacks penetrate. Do not Soulburn.");
  }
  if (sanctuary && names.has("death-dealer-ray")) {
    push(
      5,
      "Pestilence needs Venom. Sanctuary turns debuffs off — Venom will not land while it is up. Injury that does not need a debuff still stacks.",
    );
  }
  if (
    uniq(/it's far from over/i) &&
    filled.some(
      (h) =>
        h.tags.includes("dual-attack") ||
        h.tags.includes("counter") ||
        h.id === "silver-blade-aramintha" ||
        h.id === "navy-captain-landy" ||
        h.id === "hecate" ||
        h.id === "sylvan-sage-vivian" ||
        h.id === "bystander-hwayoung" ||
        h.id === "disciplinary-prefect-aria" ||
        h.id === "rhianna-and-luciella" ||
        h.id === "archdemons-shadow" ||
        h.id === "tidal-rift-elvira" ||
        h.id === "top-model-luluca" ||
        h.id === "zio" ||
        h.id === "salome",
    )
  ) {
    push(
      6,
      "A Dual Attack or extra attack into Lionheart Cermia resets her third skill. Do not give it to her.",
    );
  }
  if (read.watch.some((t) => t.key === "evade") && names.has("little-queen-charlotte")) {
    push(6, "Little Queen Charlotte still misses without Soulburn. Belian on their side turns that Soulburn off.");
  }
  if (uniq(/demon blade/i)) {
    push(6, "During Demon Blade Unleashed, Setsuka cannot die. Wait it out, or strip first.");
  }
  if (uniq(/absolute dignity/i) && filled.some((h) => h.tags.includes("counter"))) {
    push(6, "Mort prevents every other hero from countering. Counter plans do not work into him.");
  }
  if (
    !sanctuary &&
    !uniq(/absolute dignity/i) &&
    uniq(/star's blessing|disciple of the stars/i) &&
    filled.some((h) => h.tags.includes("counter"))
  ) {
    push(
      6,
      "Star's Blessing turns your counters off while it is up. She starts the fight with it for one turn. This is not Mort.",
    );
  }
  if (names.has("rinak")) {
    push(7, "Rinak stuns herself on her third skill. Stay on Pickpocketing unless the fight is over.");
  }

  const seen = new Set<string>();
  const cap = sanctuary ? 4 : 3;
  return ranked
    .sort((a, b) => a.prio - b.prio)
    .map((x) => x.line)
    .filter((line) => {
      if (seen.has(line)) return false;
      seen.add(line);
      return true;
    })
    .slice(0, cap);
}
function whyFor(recipe: Recipe, read: DefenseRead, filled: Hero[]): string[] {
  const why: string[] = [];
  const names = new Set(filled.map((h) => h.id));
  const sanctuary = read.uniqueEffects.some((u) =>
    /sanctuary of battle|god of battle/i.test(u.name),
  );
  if (sanctuary && filled.some((h) => h.tags.includes("injury"))) {
    why.push(
      "Sanctuary of Battle turns buffs and debuffs off for both sides. Injury still stacks.",
    );
  }
  const blocked =
    !sanctuary &&
    (read.debuffs.includes("Block") ||
      read.uniqueEffects.some((u) => /^block$/i.test(u.name)));
  if (blocked) {
    why.push(
      filled.some((h) => h.tags.includes("injury"))
        ? "Block after the strip: you cannot receive buffs, and other heroes cannot cleanse you. Injury still stacks."
        : "Block after the strip: you cannot receive buffs, and other heroes cannot cleanse you. Do not plan Immunity through it.",
    );
  }
  if (
    read.roles.includes("speedcap") &&
    filled.some((h) => h.tags.includes("injury"))
  ) {
    why.push(
      "Injury ignores the speed cap. You are playing the long fight this wall wants, on better terms.",
    );
  }
  if (read.watch.some((t) => t.key === "first-cycle")) {
    why.push(
      read.watch.some((t) => t.key === "cannot-miss")
        ? "They extra-turn into a third skill that hits even on miss. If a second DPS follows, slow units do not get a turn."
        : "They extra-turn on the first cycle. Survive or contest that before the rest of the wall matters.",
    );
  }
  if (read.watch.some((t) => t.key === "benimaru")) {
    why.push(
      filled.some(
        (h) =>
          h.tags.includes("extra-turn") ||
          (h.effects ?? []).includes("extra-turn") ||
          h.roles.includes("opener"),
      )
        ? "Your extra turn cleanses Benimaru and grants Multilayer Barrier. Do not extra-turn into him."
        : "An extra turn on your side cleanses him, grants Multilayer Barrier, and Hell Flare at full Fighting Spirit penetrates 60% with it.",
    );
  }
  if (read.watch.some((t) => t.key === "celine")) {
    why.push("A non-attack skill into Celine Blink-cleanses her. Open with an attack.");
  }
  if (read.watch.some((t) => t.key === "byblis") && filled.some((h) => h.tags.includes("counter"))) {
    why.push("Your counters fire I'm Warning You. Buff duration −2 is not a strip.");
  }
  if (
    names.has("harsetti") &&
    (read.roles.includes("opener") ||
      read.archetype === "speed-cleave" ||
      read.watch.some((t) => t.key === "cleave"))
  ) {
    why.push(
      "Harsetti caps their Speed so the opener does not take the first cycle.",
    );
  }
  if (
    read.roles.includes("revive") &&
    filled.some((h) => h.tags.includes("anti-revive")) &&
    !names.has("briar-witch-iseria") &&
    !names.has("hecate")
  ) {
    why.push(
      "Anti-revive stops the reset, so the wall cannot stall forever.",
    );
  }
  if (
    read.watch.some((t) => t.key === "evade") &&
    filled.some(
      (h) =>
        h.tags.includes("aoe") ||
        h.tags.includes("dual-attack") ||
        h.tags.includes("injury"),
    )
  ) {
    const violet = read.uniqueEffects.some((u) => u.heroId === "remnant-violet") ||
      read.threats.some((t) => t.heroId === "remnant-violet");
    why.push(
      violet
        ? "Area attacks, Dual Attacks, and injury do not miss the way a single-target third skill into Violet does."
        : "Area attacks still hit everyone. The miss chance is +30% Evasion from Setsuka, not a Violet-style nest. Single-target injury still has to pass that roll.",
    );
  }
  if (read.watch.some((t) => t.key === "spec-tene")) {
    why.push(
      "Specter Tenebria cannot be selected while an ally lives. Area attacks still hit her.",
    );
  }
  if (
    read.roles.includes("soulblock") &&
    !filled.some((h) => h.tags.includes("soulburn"))
  ) {
    why.push(
      "This draft does not need souls, so Belian is only a bulky knight.",
    );
  }
  if (names.has("briar-witch-iseria")) {
    const reviveOnWall =
      read.roles.includes("revive") ||
      read.uniqueEffects.some((u) => isReviveUnique(u.name));
    const soulblock = read.roles.includes("soulblock");
    if (reviveOnWall) {
      why.push(
        sanctuary
          ? "Witch's Curse turns revive off while she lives. Strip does not land during Sanctuary of Battle."
          : soulblock
            ? "Witch's Curse turns revive off while she lives. Cursed Thorn still strips; Soulburn cannot ignore Effect Resistance."
            : "Soulburn Cursed Thorn strips through Effect Resistance. Revive is off while she lives.",
      );
    } else if (!sanctuary && soulblock) {
      why.push(
        "Cursed Thorn still strips. Soulburn cannot ignore Effect Resistance on this wall.",
      );
    } else if (
      !sanctuary &&
      (read.tags.includes("immunity") || read.roles.includes("strip"))
    ) {
      why.push(
        "Soulburn Cursed Thorn is an area strip that ignores Effect Resistance.",
      );
    }
  }
  if (names.has("hecate")) {
    const wallRevives =
      read.roles.includes("revive") ||
      read.uniqueEffects.some((u) => isReviveUnique(u.name));
    if (wallRevives) {
      why.push(
        "Death's Dominion: no revive, no Immortal. Her third skill ignores damage sharing.",
      );
    } else if (
      read.uniqueEffects.some((u) => /offering|scales of equity/i.test(u.name))
    ) {
      why.push(
        "Her third skill ignores damage sharing on heroes. Do not spend it into the front unless the share is already down.",
      );
    }
  }
  if (
    names.has("commander-pavel") &&
    read.uniqueEffects.some((u) => /offering|scales of equity/i.test(u.name))
  ) {
    why.push(
      "Die, You Fly ignores damage sharing on heroes. Do not spend it into the front unless the share is already down.",
    );
  }
  if (
    read.uniqueEffects.some((u) => /insight/i.test(u.name)) &&
    filled.some((h) => h.tags.includes("injury"))
  ) {
    why.push(
      "A hit of 30% max Health spends Focus. Injury is how you drop her below three and make debuffs stick.",
    );
  }
  if (
    names.has("desert-jewel-basar") &&
    (read.tags.includes("barrier") ||
      read.uniqueEffects.some((u) => /barrier/i.test(u.name)))
  ) {
    why.push(
      "Desert Storm inverts Barrier into damage and takes an extra turn. The inversion ignores Effect Resistance.",
    );
  }
  if (
    names.has("bystander-hwayoung") &&
    (read.roles.includes("revive") ||
      read.uniqueEffects.some((u) => /offering|scales of equity/i.test(u.name)))
  ) {
    why.push(
      "Sura ignores damage sharing on heroes. A kill inflicts Extinction.",
    );
  }
  if (
    read.uniqueEffects.some((u) => /ferocious stand/i.test(u.name)) &&
    filled.some((h) => h.tags.includes("aoe"))
  ) {
    const stInjury = filled.some(
      (h) => h.tags.includes("injury") && !h.tags.includes("aoe"),
    );
    why.push(
      stInjury
        ? "Area attacks ignore Ferocious Stand. Single-target injury still has to hit Arunka."
        : "Area attacks ignore Ferocious Stand. You do not have to attack Arunka.",
    );
  }
  if (names.has("conqueror-lilias") && read.watch.some((t) => t.key === "evade")) {
    why.push(
      "Conqueror Lilias Dual Attacks without Soulburn, which bypasses Concentration.",
    );
  }
  if (names.has("sea-phantom-politis") && read.watch.some((t) => t.key === "evade")) {
    why.push(
      "Sea Phantom Politis Dual Attacks while Enraged, with no Soulburn required.",
    );
  }
  if (
    names.has("mort") &&
    (read.tags.includes("counter") ||
      read.watch.some((t) => t.key === "evade"))
  ) {
    if (
      read.uniqueEffects.some((u) =>
        /elbris's successor|sword of duty/i.test(u.name),
      )
    ) {
      why.push(
        "Mort turns her doubled counters off. Dawnbreaker still injures.",
      );
    } else if (read.watch.some((t) => t.key === "evade")) {
      why.push("Mort: nobody else can counter. Setsuka bounce is off.");
    } else {
      why.push("Mort: nobody else can counter.");
    }
  }
  if (
    names.has("rinak") &&
    (read.tags.includes("immunity") ||
      read.roles.includes("strip") ||
      read.roles.includes("control"))
  ) {
    why.push(
      "Pickpocketing strips, cuts Combat Readiness, and grants an extra turn. Do not use the third skill unless the fight ends.",
    );
  }
  if (
    read.uniqueEffects.some((u) => /defensive magic/i.test(u.name)) &&
    filled.some((h) => h.roles.includes("soulblock"))
  ) {
    why.push(
      "Belian keeps Frieren from gaining Soul on her turns, so Defensive Magic stays off even if the fight goes long.",
    );
  }
  if (
    read.uniqueEffects.some((u) => /tranquility|astral guide/i.test(u.name))
  ) {
    why.push(
      "Do not recast Immunity or heals into Politis \u2014 Tranquility clips buff duration and she takes the cycle.",
    );
  }
  if (
    read.uniqueEffects.some((u) => /sacred covenant/i.test(u.name)) &&
    filled.some((h) => h.tags.includes("anti-revive"))
  ) {
    why.push(
      "Anti-revive shuts the Covenant revive. After five turns he is only a knight.",
    );
  }
  if (names.has("frieren") && filled.some((h) => h.tags.includes("evade"))) {
    why.push(
      "Frieren's extra Focus and Fighting Spirit charges Massacre and Demon Blade faster.",
    );
  }
  if (names.has("solitaria") && read.watch.some((t) => t.key === "evade")) {
    why.push(
      "Solitaria sets their Focus gain to zero. Massacre never comes up.",
    );
  }
  if (
    read.uniqueEffects.some((u) => /dark moon|noias/i.test(u.name)) &&
    filled.some((h) => h.tags.includes("soulburn"))
  ) {
    why.push(
      "Do not Soulburn into Shepherd of the Dark Diene \u2014 Dark Moon strips two from everyone.",
    );
  }
  if (
    names.has("lone-wolf-peira") &&
    (read.roles.includes("opener") ||
      read.archetype === "speed-cleave" ||
      read.archetype === "turn2-control")
  ) {
    why.push(
      "Peira extra turn plus Swift Attack is the opener. She is not a stripper.",
    );
  }
  if (names.has("archdemons-shadow") && read.tags.includes("counter")) {
    why.push("Dissolution does not trigger a counterattack.");
  }
  if (names.has("specter-tenebria") && read.tags.includes("counter")) {
    why.push("Poison Blast does not trigger a counterattack.");
  }
  if (names.has("death-dealer-ray") && read.tags.includes("dual-attack")) {
    why.push("Clinical Trial does not trigger Dual Attack.");
  }
  if (
    names.has("zio") &&
    (read.uniqueEffects.some((u) => /inner abyss|boundless obsession/i.test(u.name)) ||
      read.watch.some((t) => t.key === "restrict"))
  ) {
    why.push(
      "Supreme Authority ignores effects that reduce Combat Readiness increases.",
    );
  }
  if (
    names.has("death-dealer-ray") &&
    (read.roles.includes("speedcap") ||
      read.archetype === "harsetti-stall" ||
      read.archetype === "injury-grind")
  ) {
    why.push(
      "Pestilence makes every ally apply Venom, then detonate it. That is the injury. The cap does not stop it.",
    );
  }
  if (
    names.has("mediator-kawerik") &&
    (read.tags.includes("immunity") || read.roles.includes("strip"))
  ) {
    why.push(
      "Balance of Power strips every buff, then a team Barrier. Nature Restoration is the cleanse and Immunity.",
    );
  }
  if (
    names.has("archdemons-shadow") &&
    (read.roles.includes("speedcap") ||
      read.roles.includes("soulblock") ||
      read.watch.some((t) =>
        ["speedcap", "soulblock", "ss-vivian", "b-hwayoung"].includes(t.key),
      ))
  ) {
    why.push("Seal turns those passives off. Burst is the extra area attack after a sealed S1.");
  }
  if (
    names.has("urban-shadow-choux") &&
    (read.roles.includes("speedcap") ||
      read.uniqueEffects.some((u) => /ferocious stand/i.test(u.name)))
  ) {
    why.push(
      "Bzzt! injuries everyone after each attack. Ferocious Stand does not eat it.",
    );
  }
  if (
    names.has("straze") &&
    (read.tags.includes("immunity") ||
      read.tags.includes("evade") ||
      read.roles.includes("strip"))
  ) {
    why.push(
      "Straze's second skill strips all and ignores Effect Resistance against lower Attack.",
    );
  }
  if (
    names.has("zahhak") &&
    read.uniqueEffects.some((u) => /ferocious stand/i.test(u.name))
  ) {
    why.push("Zahhak has to attack Arunka. Bring area injury if you can.");
  }
  if (
    names.has("zahhak") &&
    (read.roles.includes("speedcap") || read.archetype === "harsetti-stall")
  ) {
    why.push(
      "Execute is 35% injury after an extra turn. The cap does not stop it.",
    );
  }
  if (
    names.has("ambitious-tywin") &&
    (read.roles.includes("soulblock") || read.tags.includes("immunity"))
  ) {
    why.push(
      "Flash is area Stun and Decrease Defense. He does not strip \u2014 bring a real stripper.",
    );
  }
  if (
    names.has("ran") &&
    read.uniqueEffects.some((u) => /offering|scales of equity/i.test(u.name))
  ) {
    why.push(
      "Frostbite turns Offering off \u2014 damage sharing and damage reduction do not apply.",
    );
  }
  if (
    names.has("ran") &&
    (read.tags.includes("immunity") || read.roles.includes("strip"))
  ) {
    why.push(
      "Her second skill extra-turns into Instant Blade. Soulburn ignores Effect Resistance.",
    );
  }
  if (
    names.has("judge-kise") &&
    (read.tags.includes("immunity") ||
      read.tags.includes("evade") ||
      read.tags.includes("counter"))
  ) {
    why.push(
      "End of Evil strips all and cannot be countered. Soulburn ignores Effect Resistance.",
    );
  }
  if (
    names.has("lone-crescent-bellona") &&
    (read.roles.includes("speedcap") ||
      read.uniqueEffects.some((u) => /ferocious stand/i.test(u.name)))
  ) {
    why.push(
      "All Eyes on Me injuries everyone at full Fighting Spirit. Ferocious Stand does not eat the area hit.",
    );
  }
  if (
    names.has("dark-corvus") &&
    (read.roles.includes("revive") ||
      read.uniqueEffects.some((u) =>
        /offering|scales of equity/i.test(u.name),
      ))
  ) {
    why.push(
      "Devil's Descent ignores Offering and Extinction-kills. The first fight starts that skill on cooldown.",
    );
  }
  if (
    names.has("closer-charles") &&
    (read.tags.includes("injury") || read.archetype === "injury-grind")
  ) {
    why.push(
      "Demolition scales with lost Health. Injury walls feed him the execute.",
    );
  }
  if (
    names.has("little-queen-charlotte") &&
    read.watch.some((t) => t.key === "evade")
  ) {
    why.push(
      "Soulburn on her third skill is +100% Hit Chance. Aim Violet as the main target.",
    );
  }
  if (names.has("little-queen-charlotte") && read.roles.includes("revive")) {
    why.push("Extinction only applies if that third skill kills.");
  }
  if (
    names.has("designer-lilibet") &&
    (read.roles.includes("control") || read.tags.includes("stun"))
  ) {
    why.push(
      "Do not stack debuffs into Emergency Stitching \u2014 that is her Combat Readiness and Immunity.",
    );
  }
  if (
    names.has("faithless-lidica") &&
    (read.tags.includes("immunity") || read.roles.includes("tank"))
  ) {
    why.push(
      "Larkspur strips two, applies Laceration, and extra-turns. Hits after that become injury.",
    );
  }
  if (
    names.has("maid-chloe") &&
    filled.some((h) => h.tags.includes("anti-revive"))
  ) {
    why.push(
      "Anti-revive shuts VIP Treatment. The Revive buff on the living is still a revive.",
    );
  }
  if (
    filled.some((h) => h.tags.includes("anti-revive")) &&
    read.uniqueEffects.some((u) =>
      /superhumanization|it's time to be reborn/i.test(u.name),
    )
  ) {
    why.push(
      "Anti-revive shuts It's Time to Be Reborn. Superhumanization never comes up.",
    );
  }
  if (
    names.has("specimen-sez") &&
    (read.roles.includes("revive") || read.tags.includes("stun"))
  ) {
    why.push(
      "Stun first. Light Storm fully penetrates a stunned target and applies Extinction if it kills.",
    );
  }
  if (
    names.has("arbiter-vildred") &&
    filled.some((h) => h.tags.includes("anti-revive"))
  ) {
    why.push(
      "Anti-revive shuts Dark Contract. Without it he returns at 70% Health with a full bar.",
    );
  }
  if (
    names.has("twisted-eidolon-kayron") &&
    (read.tags.includes("evade") || read.roles.includes("evasion"))
  ) {
    why.push(
      "Sword of Requiem additional damage hits even on a miss. Injury on his first skill also applies on a miss.",
    );
  }
  if (
    read.uniqueEffects.some((u) => /it's far from over/i.test(u.name)) &&
    filled.some((h) => h.tags.includes("dual-attack"))
  ) {
    why.push("Do not Dual Attack into Lionheart Cermia. That resets her third skill.");
  }
  if (
    names.has("architect-laika") &&
    (read.tags.includes("evade") ||
      read.roles.includes("evasion") ||
      read.roles.includes("revive"))
  ) {
    why.push(
      "Target reduces Evasion by 50%. The extra turn into her third skill Extinction-kills if it gets the last hit.",
    );
  }
  if (
    names.has("sage-baal") &&
    !read.uniqueEffects.some((u) =>
      /absolute dignity|queen's dignity|ruin's advent|ruler of the sea/i.test(
        u.name,
      ),
    )
  ) {
    why.push(
      "Sleep reduces Evasion to zero until they take a hit. Do not splash before Eye of Death.",
    );
  }
  if (why.length === 0) {
    const fromWatch: Record<string, string> = {
      "spec-tene":
        "Area attacks still hit Specter Tenebria. Single-target skills cannot select her while an ally lives.",
      ainz: "Death Sentence is 50,000 at the twelfth turn and falls off if he dies.",
      aubade:
        "With Dawn, Light of Condemnation is 1,000–25,000 additional on everyone. Kill him before the dump, or stun that turn.",
      "rq-roana":
        "Combat Readiness from Speed is halved. Do not win this as a Speed race.",
      seal: "Seal turns passives off. Do not lean on a buffed opener.",
      cleave: "They want the first cycle. Cap Speed, or survive into the next one.",
      "first-cycle":
        "They extra-turn on the first cycle. Anti-revive waits until you survive that.",
      "ew-ludwig":
        "Any Soulburn pushes Eternal Wanderer Ludwig. Do not Soulburn.",
      "dark-moon": "Any Soulburn triggers Dark Moon. Do not Soulburn.",
      "tr-elvira":
        "Engulf is Crit Hit Resistance, not Immunity. Lethal damage on her grants her team extra damage on their next attack.",
      zio: "Strip two, then Silence. Supreme Authority is not a Speed cap.",
    };
    for (const t of read.watch) {
      const line = fromWatch[t.key];
      if (line && !why.includes(line)) why.push(line);
      if (why.length >= 2) break;
    }
    if (why.length === 0 && read.watch[0]) why.push(read.watch[0].note);
  }
  return why.slice(0, 3);
}
function requirePool() {
  return allHeroes()
    .filter((h) => h.verified)
    .map((h) => h.id);
}
function recipesFor(read: DefenseRead): Recipe[] {
  const all = allRecipes();
  let hit = all.filter(
    (r) => r.vs.includes(read.archetype) || r.vs.length === 0,
  );
  const sanctuary = read.uniqueEffects.some((u) =>
    /sanctuary of battle|god of battle/i.test(u.name),
  );
  if (sanctuary) {
    hit = hit.filter(
      (r) =>
        r.id !== "outspeed-cleave" &&
        r.id !== "strip-control" &&
        r.id !== "turn2-control" &&
        r.id !== "evasion-bait",
    );
    if (!hit.some((r) => r.id === "injury-vs-stall")) {
      const injury = all.find((r) => r.id === "injury-vs-stall");
      if (injury) hit = [injury, ...hit];
    }
  }
  if (
    read.roles.includes("soulblock") ||
    read.uniqueEffects.some((u) => /shackles of suppression/i.test(u.name))
  ) {
    hit = hit.filter((r) => r.id !== "outspeed-cleave");
  }
  if (read.archetype === "injury-grind") {
    hit = hit.filter(
      (r) => r.id !== "outspeed-cleave" && r.id !== "strip-control",
    );
  }
  if (read.watch.some((t) => t.key === "first-cycle")) {
    const race = read.archetype === "speed-cleave";
    const cannotMiss = read.watch.some((t) => t.key === "cannot-miss");
    const inject =
      cannotMiss || !race
        ? (["injury-vs-stall"] as const)
        : (["evasion-bait", "injury-vs-stall"] as const);
    for (const id of inject) {
      if (!hit.some((r) => r.id === id)) {
        const extra = all.find((r) => r.id === id);
        if (extra) hit = [...hit, extra];
      }
    }
    const prefer = cannotMiss
      ? ["injury-vs-stall", "turn2-control"]
      : race
        ? [
            "evasion-bait",
            "injury-vs-stall",
            "outspeed-cleave",
            "turn2-control",
          ]
        : ["injury-vs-stall", "turn2-control", "strip-control"];
    hit = [...hit].sort((a, b) => {
      const ia = prefer.indexOf(a.id);
      const ib = prefer.indexOf(b.id);
      return (ia === -1 ? 40 : ia) - (ib === -1 ? 40 : ib);
    });
  }
  const reviveThreat =
    read.roles.includes("revive") ||
    read.uniqueEffects.some((u) => isReviveUnique(u.name));
  if (reviveThreat && !hit.some((r) => r.id === "anti-revive-burst")) {
    const extra = all.find((r) => r.id === "anti-revive-burst");
    if (extra) hit = [...hit, extra];
  }
  if (
    !sanctuary &&
    read.archetype !== "injury-grind" &&
    read.archetype !== "harsetti-stall" &&
    !read.roles.includes("soulblock") &&
    read.uniqueEffects.some((u) =>
      /shield of holy spirit|bastet roar/i.test(u.name),
    )
  ) {
    const extra = all.find((r) => r.id === "strip-control");
    if (extra) {
      hit = [
        extra,
        ...hit.filter((r) => r.id !== "strip-control" && r.id !== "evasion-bait"),
      ];
    }
  }
  if (hit.length > 0) return hit;
  return all.filter((r) => r.vs.includes("bruiser-mix"));
}
export function recommendCounters(
  enemyIds: string[],
  poolIds: string[] | null,
  seats: 3 | 4 = 4,
): CounterTeam[] {
  const read = classifyDefense(enemyIds);
  if (!read) return [];
  const wanted = (poolIds ?? requirePool())
    .map((id) => getHero(id))
    .filter((h): h is Hero => Boolean(h && h.verified));
  const theory = !poolIds || wanted.length < 4;
  const usable = wanted.length >= 3 ? wanted : heroesOf(requirePool());
  const isTheory = theory || wanted.length < 4;
  const results = [];
  for (const recipe of recipesFor(read)) {
    const reviveThreat =
      read.roles.includes("revive") ||
      read.uniqueEffects.some((u) => isReviveUnique(u.name));
    if (recipe.id === "anti-revive-burst" && !reviveThreat) continue;
    const filled = fillRecipe(recipe, usable, enemyIds, seats);
    if (filled.heroIds.length < 3) continue;
    const wallHeroes = heroesOf(enemyIds).filter((h) => h.verified);
    const filledHeroes = filled.picks.map((p) => p.hero);
    const wallOpeners = wallHeroes.filter(isFirstCycleOpener);
    const theirFast = Math.max(0, ...wallOpeners.map((h) => h.baseSpeed ?? 0));
    const ourFast = Math.max(0, ...filledHeroes.map((h) => h.baseSpeed ?? 0));
    const gap = theirFast > 0 ? theirFast - ourFast : 0;
    const cannotMiss = wallHeroes.some(hitsEvenOnMiss);
    if (cannotMiss && recipe.id === "evasion-bait") continue;
    const race =
      recipe.id === "outspeed-cleave" ||
      recipe.id === "strip-control" ||
      recipe.id === "turn2-control";
    if (wallOpeners.length > 0 && race) {
      const contest = filledHeroes.some(
        (h) =>
          h.roles.includes("opener") &&
          Number.isFinite(h.baseSpeed) &&
          (h.baseSpeed ?? 0) >= theirFast - 8,
      );
      if (!contest) continue;
    }
    const answerable = read.watch.filter(
      (t) =>
        t.answerTags?.length ||
        t.answerRoles?.length ||
        t.answerEffects?.length,
    ).length;
    const gaps = unansweredThreats(
      read.watch,
      filledHeroes,
    );
    const answered = Math.max(0, answerable - gaps.length);
    const tierAvg =
      filledHeroes.reduce((s, h) => s + TIER_ORDER[h.tier], 0) /
      Math.max(1, filledHeroes.length);
    let speedAdj = 0;
    if (gap >= 12 && recipe.id === "injury-vs-stall") speedAdj += 12;
    if (gap >= 12 && recipe.id === "evasion-bait" && !cannotMiss) speedAdj += 12;
    const score = Math.round(
      Math.min(
        99,
        Math.max(
          1,
          20 +
            filled.coverage * 48 +
            answered * 8 +
            tierAvg * 4 +
            (isTheory ? -8 : 4) -
            gaps.length * 8 +
            speedAdj,
        ),
      ),
    );
    results.push({
      recipeId: recipe.id,
      name: recipe.name,
      heroIds: filled.heroIds,
      seats,
      score,
      coverage: filled.coverage,
      wincon: recipe.wincon,
      setup: setupFor(filled.picks, read),
      pitfalls: pitfallsFor(filled.picks, read),
      missing: filled.missing,
      gaps,
      theorycraft: isTheory,
      why: whyFor(recipe, read, filledHeroes),
    });
  }
  results.sort((a, b) => b.score - a.score || b.coverage - a.coverage);
  const seen = new Set<string>();
  const uniqueTeams: CounterTeam[] = [];
  for (const team of results) {
    const key = [...team.heroIds].sort().join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueTeams.push(team);
    if (uniqueTeams.length >= 4) break;
  }
  return uniqueTeams;
}
function heroMatchesToken(h: Hero, t: string): boolean {
  const name = h.name.toLowerCase();
  const short = h.short.toLowerCase();
  if (name.includes(t) || short.toLowerCase().includes(t) || h.id.includes(t))
    return true;
  if (name.split(/[\s.&'-]+/).some((w) => w.startsWith(t))) return true;
  const hay =
    `${h.element} ${h.class} ${h.roles.join(" ")} ${h.tags.join(" ")} ${(h.effects ?? []).join(" ")}`.toLowerCase();
  return hay.includes(t);
}
function tokenScore(h: Hero, t: string): number {
  const name = h.name.toLowerCase();
  const short = h.short.toLowerCase();
  let s = 0;
  if (short === t || name === t || h.id === t) s = 100;
  else if (short.startsWith(t) || name.startsWith(t)) s = 80;
  else if (name.split(/[\s.&'-]+/).some((w) => w === t)) s = 70;
  else if (name.split(/[\s.&'-]+/).some((w) => w.startsWith(t))) s = 55;
  else if (name.includes(t) || short.includes(t)) s = 40;
  else if (heroMatchesToken(h, t)) s = 20;
  if (h.verified) s += 4;
  return s;
}
export function searchTokens(query: string): string[] {
  return query
    .split(/[,，;]+/)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}
export function searchHeroes(query: string, list: Hero[] = allHeroes()): Hero[] {
  const tokens = searchTokens(query);
  if (tokens.length === 0) return list;
  return list.filter((h) => tokens.some((t) => heroMatchesToken(h, t)));
}
export function bestHeroMatches(query: string, list: Hero[] = allHeroes()): Hero[] {
  const tokens = searchTokens(query);
  const used = new Set();
  const out = [];
  for (const t of tokens) {
    const hit = list
      .filter((h) => !used.has(h.id) && tokenScore(h, t) >= 40)
      .sort(
        (a, b) =>
          tokenScore(b, t) - tokenScore(a, t) || a.name.localeCompare(b.name),
      )[0];
    if (hit) {
      used.add(hit.id);
      out.push(hit);
    }
  }
  return out;
}