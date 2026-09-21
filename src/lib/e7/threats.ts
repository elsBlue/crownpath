/**
 * Wall watches. Accumulated — never rewrite this file as a whole.
 * Targeted search-replace of a unique nearby block only.
 * Floor: stay above 400 lines.
 */
import { heroEffects } from "./effects";
import type { Hero, NormalEffect, Role, Tag } from "./types";

export type DraftThreat = {
  key: string;
  label: string;
  note: string;
  answerTags?: Tag[];
  answerRoles?: Role[];
  answerEffects?: NormalEffect[];
};

function hasUnique(heroes: Hero[], needle: string): boolean {
  const n = needle.toLowerCase();
  return heroes.some((h) => (h.uniqueEffects ?? []).some((u) => u.name.toLowerCase().includes(n)));
}

/** Skill extra-turn opener. Not Soulburn-only. Not Genesis Ras crit extra turn. */
export function isFirstCycleOpener(h: Hero): boolean {
  if (!h.roles.includes("opener")) return false;
  const et =
    h.tags.includes("extra-turn") || (h.effects ?? []).includes("extra-turn");
  if (!et) return false;
  if (/extra turn is soulburn only/i.test(h.kit ?? "")) return false;
  if (h.id === "genesis-ras") return false;
  return true;
}

export function hitsEvenOnMiss(h: Hero): boolean {
  return /hits even on miss/i.test(h.kit ?? "");
}

export function wallThreats(heroes: Hero[]): DraftThreat[] {
  const out: DraftThreat[] = [];
  const add = (t: DraftThreat) => {
    if (!out.some((x) => x.key === t.key)) out.push(t);
  };

  const ids = new Set(heroes.map((h) => h.id));
  const roles = new Set(heroes.flatMap((h) => h.roles));
  const tags = new Set(heroes.flatMap((h) => h.tags));
  const debuffs = heroes.flatMap((h) => h.debuffs ?? []);
  const hasDebuff = (name: string) => debuffs.some((d) => d.toLowerCase() === name.toLowerCase());

  if (roles.has("speedcap") || ids.has("harsetti") || hasUnique(heroes, "skuggiheim")) {
    add({
      key: "speedcap",
      label: "Speed cap",
      note: hasUnique(heroes, "skuggiheim")
        ? "Speed is capped. Turn-bar gain on her turn does not apply."
        : "Nobody can win a speed race. This is a long fight.",
      answerTags: ["injury"],
    });
  }
  if (roles.has("soulblock") || ids.has("belian") || hasUnique(heroes, "shackles of suppression")) {
    add({
      key: "soulblock",
      label: "Soul lock",
      note: "Souls do not generate. Spending souls does nothing.",
    });
  } else if (
    hasUnique(heroes, "unwavering execution") ||
    ids.has("disciplinary-prefect-aria")
  ) {
    add({
      key: "dp-aria",
      label: "DP Aria",
      note: "Spending souls costs twice as much. Souls still generate. While Purge is on cooldown, her hits cut max Health.",
      answerTags: ["injury"],
    });
  }
  if (hasUnique(heroes, "dragon flame") || ids.has("martial-artist-ken")) {
    add({
      key: "ma-ken",
      label: "MA Ken",
      note: "Counters ally crits, and Dragon Flame when he is crit (50% penetrate, lost Health). Mort and Star's Blessing turn those counters off.",
      answerTags: ["aoe"],
    });
  }
  if (
    roles.has("revive") ||
    ids.has("lisette") ||
    ids.has("ruele-of-light") ||
    hasUnique(heroes, "fragment of life") ||
    hasUnique(heroes, "time reversal") ||
    hasUnique(heroes, "spirit lord") ||
    hasUnique(heroes, "sacred covenant") ||
    hasUnique(heroes, "it's time to be reborn") ||
    ids.has("school-nurse-yulha")
  ) {
    add({
      key: "revive",
      label: "Revive / reset",
      note: "Killing one unit is not enough. They can come back.",
      answerTags: ["anti-revive"],
      answerEffects: ["extinction"],
    });
  }
  if (hasUnique(heroes, "time reversal")) {
    add({
      key: "reversal",
      label: "Time Reversal",
      note: "After the first round of turns, HP and buffs go back to how the fight started.",
    });
  }
  if (
    heroes.some((h) => (h.uniqueEffects ?? []).some((u) => /^skill nullifier$/i.test(u.name))) ||
    ids.has("fallen-cecilia") ||
    ids.has("angel-of-light-angelica") ||
    ids.has("eternal-wanderer-ludwig") ||
    ids.has("lilibet") ||
    ids.has("aube")
  ) {
    add({
      key: "nullifier",
      label: "Skill Nullifier",
      note: "The first skill into that unit is cancelled.",
    });
  }
  if (ids.has("remnant-violet")) {
    add({
      key: "evade",
      label: "Evasion",
      note: "Single-target third skills into Violet miss often.",
      answerTags: ["aoe", "dual-attack", "injury"],
    });
  } else if (ids.has("setsuka")) {
    add({
      key: "evade",
      label: "Evasion",
      note: "+30% Evasion on the whole wall. Any single-target skill can miss — not only a third skill. When an ally other than her evades, she counters.",
      answerTags: ["aoe", "dual-attack", "injury"],
    });
  }
  if (tags.has("injury") && (roles.has("bruiser") || roles.has("tank") || roles.has("dps"))) {
    add({
      key: "injury",
      label: "Injury",
      note: "They shrink the HP bar. Healing cannot fill the missing part.",
    });
  }
  if (
    (ids.has("last-rider-krau") || heroes.some((h) => h.tags.includes("immunity") && h.roles.includes("tank"))) &&
    !ids.has("notos") &&
    !hasUnique(heroes, "sanctuary of battle")
  ) {
    add({
      key: "strip",
      label: "Buffed wall",
      note: "They start with buffs up, often Immunity, so debuffs will not land until those buffs are gone.",
      answerRoles: ["strip"],
      answerTags: ["strip"],
      answerEffects: ["buff-dispel"],
    });
  }
  if (hasDebuff("Seal") && !ids.has("notos") && !hasUnique(heroes, "sanctuary of battle")) {
    add({
      key: "seal",
      label: "Seal",
      note: "Passives are off on sealed units.",
    });
  } else if (
    hasDebuff("Cannot Buff") &&
    !ids.has("notos") &&
    !hasUnique(heroes, "sanctuary of battle")
  ) {
    add({
      key: "unbuffable",
      label: "Cannot Buff",
      note: "New buffs will not land. Passives still run.",
    });
  }
  if (
    (hasUnique(heroes, "lullaby for waves") ||
      ids.has("dragon-king-sharun")) &&
    !ids.has("notos") &&
    !hasUnique(heroes, "sanctuary of battle")
  ) {
    add({
      key: "cascade",
      label: "Cascade",
      note: "Stun, Sleep, or Fear on this wall cleanses the lock and grants Cascade: 4,000 extra damage on their next attack.",
    });
  }
  if (hasUnique(heroes, "ferocious stand")) {
    add({
      key: "force-target",
      label: "Forced targeting",
      note: "Single-target skills have to hit her.",
      answerTags: ["aoe"],
    });
  }
  if (hasUnique(heroes, "oath of punishment")) {
    add({
      key: "oath",
      label: "Oath of Punishment",
      note: "Undispellable. Debuffs do not stick on her.",
    });
  }
  if (hasUnique(heroes, "insight") || ids.has("sylvan-sage-vivian")) {
    add({
      key: "ss-vivian",
      label: "SS Vivian",
      note: "Starts immune to debuffs. Removing buffs does not turn that off. A hit of 30% max Health is cut in half.",
      answerTags: ["injury", "aoe"],
    });
  }
  if (
    hasUnique(heroes, "desert storm") ||
    ids.has("desert-jewel-basar")
  ) {
    add({
      key: "dj-basar",
      label: "DJ Basar",
      note: "Cleanses the team and grants Immunity. If he has Barrier after an enemy skill, Desert Storm turns your Barrier into damage and cuts Combat Readiness 20%. He no longer extra-turns from Barrier.",
      answerTags: ["strip"],
    });
  }
  if (
    hasUnique(heroes, "shield of holy spirit") ||
    ids.has("crimson-armin")
  ) {
    add({
      key: "c-armin",
      label: "C.Armin",
      note: "Team Immunity 2 turns and Invincible 1 turn. She does not cleanse.",
      answerTags: ["strip"],
    });
  }
  if (hasUnique(heroes, "divine vessel") || ids.has("bystander-hwayoung")) {
    add({
      key: "b-hwayoung",
      label: "ML Hwayoung",
      note: "Buffs and debuffs do not stick. Removing buffs does nothing. If an ally drops to 40% Health, she hits a random unit, ignoring share and damage reduction, and a kill cannot be revived.",
      answerTags: ["aoe", "injury"],
    });
  }
  if (hasUnique(heroes, "demon blade")) {
    add({
      key: "cannot-die",
      label: "Cannot die",
      note: "She cannot die in that window.",
      answerTags: ["strip"],
    });
  }
  if (hasDebuff("Beguile")) {
    add({
      key: "beguile",
      label: "Beguile",
      note: "After she removes buffs, the back line takes 10% of their maximum Health.",
    });
  }
  if (
    (hasDebuff("Block") ||
      hasUnique(heroes, "mirror of the abyss") ||
      ids.has("witch-of-the-mere-tenebria")) &&
    !ids.has("notos") &&
    !hasUnique(heroes, "sanctuary of battle")
  ) {
    add({
      key: "block",
      label: "Block",
      note: "Block: you cannot receive buffs, and allies cannot cleanse you. Passives still run. That is not Seal.",
    });
  }
  if (
    (hasUnique(heroes, "mirror of the abyss") ||
      ids.has("witch-of-the-mere-tenebria")) &&
    !ids.has("notos") &&
    !hasUnique(heroes, "sanctuary of battle")
  ) {
    add({
      key: "wmeri",
      label: "WMeri Dual Attack",
      note: "While her second skill is on cooldown, her basic attack makes their highest-Attack ally hit with her.",
    });
  }
  if (
    (hasDebuff("Restrict")) &&
    !ids.has("notos") &&
    !hasUnique(heroes, "sanctuary of battle")
  ) {
    add({
      key: "restrict",
      label: "Restrict",
      note: "Combat Readiness increases other than Speed do not apply.",
    });
  }
  if (
    (hasDebuff("Immobilize") || hasUnique(heroes, "immobilize") || ids.has("aube")) &&
    !ids.has("notos") &&
    !hasUnique(heroes, "sanctuary of battle")
  ) {
    add({
      key: "immobilize",
      label: "Immobilize",
      note: "Combat Readiness from Speed does not apply. Restrict also blocks Combat Readiness from skills. Speed stacking does not help.",
    });
  }
  if (
    (hasDebuff("Rupture") || hasUnique(heroes, "rupture")) &&
    !ids.has("notos") &&
    !hasUnique(heroes, "sanctuary of battle")
  ) {
    add({
      key: "rupture",
      label: "Rupture",
      note: "Attacking a Ruptured hero deals extra damage back, proportional to maximum Health.",
    });
  }
  if (hasUnique(heroes, "witch's curse") || ids.has("briar-witch-iseria") || hasUnique(heroes, "death's dominion") || ids.has("hecate")) {
    add({
      key: "both-revive",
      label: "No revive (both sides)",
      note: "Nobody revives while they live. Your revive is off as well.",
    });
  }
  if (hasUnique(heroes, "offering") || hasUnique(heroes, "scales of equity")) {
    add({
      key: "offering",
      label: "Offering",
      note: "Seventy percent of damage is shared onto the unit in Front (rightmost).",
      answerEffects: ["ignore-damage-sharing"],
    });
    add({
      key: "cr-steal",
      label: "Combat Readiness steal",
      note: "When you raise Combat Readiness, she takes 35% of it.",
    });
  }
  if (hasUnique(heroes, "spirit gate") || ids.has("spirit-eye-celine")) {
    add({
      key: "se-celine",
      label: "SE Celine reset",
      note: "Her third skill revives all. One hit cannot exceed 70% Health.",
      answerTags: ["anti-revive"],
      answerEffects: ["extinction"],
    });
  }
  if (hasUnique(heroes, "soul exchange") || ids.has("apocalypse-ravi")) {
    add({
      key: "aravi-reset",
      label: "A.Ravi kill-revive",
      note: "A kill with her third skill revives one ally. A skill that blocks revive stops this.",
      answerTags: ["anti-revive"],
      answerEffects: ["extinction"],
    });
  }
  if (hasUnique(heroes, "bzzt") || ids.has("urban-shadow-choux")) {
    add({
      key: "bzzt",
      label: "Bzzt!",
      note: "Every attack cuts everyone's maximum Health.",
    });
  }
  if (hasUnique(heroes, "time to rampage") || ids.has("lone-wolf-peira")) {
    add({
      key: "peira-evade",
      label: "Peira evade",
      note: "+35% evasion on herself only. She takes another turn immediately. The rest of the wall can still be hit.",
      answerTags: ["aoe", "dual-attack", "injury"],
    });
  }
  if (hasUnique(heroes, "ruler of the sea") || ids.has("navy-captain-landy")) {
    add({
      key: "nc-landy",
      label: "NC Landy",
      note: "Immune to Stun, Sleep, and Fear. Extra-attack area damage.",
    });
  }
  if (hasUnique(heroes, "laying the groundwork") || ids.has("architect-laika")) {
    add({
      key: "a-laika",
      label: "A.Laika",
      note: "Removes buffs, marks a target, then acts again. The third skill can prevent revive if it gets the kill.",
    });
  }
  if (hasUnique(heroes, "cloud of ruin") || ids.has("sage-baal")) {
    add({
      key: "sage-baal",
      label: "Sage Baal",
      note: "Removes buffs from everyone, then Sleep. Mort, Little Queen Charlotte, Dark Corvus, and Navy Captain Landy ignore Sleep.",
    });
  }
  if (hasUnique(heroes, "wandering eidolon") || ids.has("twisted-eidolon-kayron")) {
    add({
      key: "te-kayron",
      label: "TE Kayron",
      note: "Counters cut everyone's max Health. Extra damage on the third skill still hits on a miss. Mort turns counters off.",
    });
  }
  if (hasUnique(heroes, "elbris's successor") || ids.has("monarch-of-the-sword-iseria")) {
    add({
      key: "miseria",
      label: "Miseria",
      note: "Counter chance is doubled. The unit in Front (rightmost) counters with her. Dawnbreaker cuts everyone's max Health. Fracture stays through revive. Elbris is +50% Hit Chance and Pen Resist. Mort turns the counters off.",
    });
  }
  if (hasUnique(heroes, "it's far from over") || ids.has("lionheart-cermia")) {
    add({
      key: "lh-cermia",
      label: "LH Cermia",
      note: "If an ally hits with you into her, her third skill cooldown resets.",
    });
  }
  if (hasUnique(heroes, "light storm") || ids.has("specimen-sez")) {
    add({
      key: "s-sez",
      label: "S.Sez",
      note: "Stuns, then a kill with that skill cannot be revived.",
    });
  }
  if (hasUnique(heroes, "dark contract") || ids.has("arbiter-vildred")) {
    add({
      key: "a-vildred",
      label: "A.Vildred",
      note: "Dies once, returns at 70% Health with a full bar. A skill that blocks revive stops this.",
      answerTags: ["anti-revive", "aoe"],
    });
  }
  if (hasUnique(heroes, "vip treatment") || ids.has("maid-chloe")) {
    add({
      key: "maid-chloe",
      label: "Maid Chloe",
      note: "Revives the dead and places Revive on the living. A skill that blocks revive stops this.",
      answerTags: ["anti-revive"],
    });
  }
  if (hasUnique(heroes, "superhumanization") || ids.has("school-nurse-yulha")) {
    add({
      key: "sn-yulha",
      label: "SN Yulha",
      note: "Full revive with Superhumanization: +100% max Health and Speed, undispellable. That cooldown cannot be pushed. A skill that blocks revive stops this.",
      answerTags: ["anti-revive"],
      answerEffects: ["extinction"],
    });
  }
  if (hasUnique(heroes, "spirit invocation") || ids.has("successor-taeyou")) {
    add({
      key: "s-taeyou",
      label: "S.Taeyou",
      note: "Removes two buffs from everyone, then Invincible. On a crit he counters. If Possessed, he acts again immediately. Spending souls makes it unavoidable. The extra hit is not an ally hitting with him.",
      answerRoles: ["strip"],
    });
  }
  if (hasUnique(heroes, "sanctuary of battle") || ids.has("notos")) {
    add({
      key: "notos",
      label: "Notos",
      note: "God's Might doubles his stats. Buffs and debuffs do not apply to anyone. That skill starts the first fight on cooldown. Cutting max Health still works. Combat Readiness does not move him until he transforms.",
      answerTags: ["injury"],
    });
  }
  if (hasUnique(heroes, "laceration") || ids.has("faithless-lidica")) {
    add({
      key: "f-lidica",
      label: "F.Lidica",
      note: "Removes two buffs from everyone, applies Laceration, then acts again immediately.",
      answerTags: ["strip"],
    });
  }
  if (hasUnique(heroes, "emergency stitching") || ids.has("designer-lilibet")) {
    add({
      key: "d-lilibet",
      label: "D.Lilibet",
      note: "Your debuffs feed her Combat Readiness and Immunity.",
    });
  }
  if (hasUnique(heroes, "queen's dignity") || ids.has("little-queen-charlotte")) {
    add({
      key: "lq-charlotte",
      label: "LQ Charlotte",
      note: "Immune to Stun, Sleep, and Fear. If she spends souls on her third skill, it cannot miss.",
    });
  }
  if (hasUnique(heroes, "ruin's advent") || ids.has("dark-corvus")) {
    add({
      key: "d-corvus",
      label: "D.Corvus",
      note: "Hits charge his third skill. That hit ignores damage sharing, and a kill cannot be revived. It starts the first fight on cooldown.",
    });
  }
  if (hasUnique(heroes, "closer") || ids.has("closer-charles")) {
    add({
      key: "c-charles",
      label: "C.Charles",
      note: "Start-of-fight evasion. Executes units under 40% Health.",
    });
  }
  if (hasUnique(heroes, "waxing crescent") || ids.has("lone-crescent-bellona")) {
    add({
      key: "lc-bellona",
      label: "LC Bellona",
      note: "Evasion on herself only. At full Fighting Spirit she cuts everyone's max Health. The rest of the wall can still be hit.",
      answerTags: ["aoe", "injury"],
    });
  }
  if (hasUnique(heroes, "end of evil") || ids.has("judge-kise")) {
    add({
      key: "j-kise",
      label: "J.Kise",
      note: "Removes all buffs from everyone and cannot be countered. Spending souls makes it unavoidable.",
      answerTags: ["strip", "aoe"],
    });
  }
  if (hasUnique(heroes, "frostbite") || hasUnique(heroes, "mental focus") || ids.has("ran")) {
    add({
      key: "ran",
      label: "Ran",
      note: "Acts again immediately, then removes buffs. Frostbite turns damage sharing off.",
      answerTags: ["strip"],
    });
  }
  if (hasUnique(heroes, "battle command") || ids.has("ambitious-tywin")) {
    add({
      key: "a-tywin",
      label: "A.Tywin",
      note: "Stuns everyone and empties souls. Buffs stay on.",
    });
  }
  if (
    (hasUnique(heroes, "meteor fall") ||
      hasUnique(heroes, "flame of savara") ||
      ids.has("silver-blade-aramintha")) &&
    !ids.has("notos") &&
    !hasUnique(heroes, "sanctuary of battle")
  ) {
    add({
      key: "sb-ara",
      label: "SB Ara",
      note: "Stuns everyone, applies two Burns, then pulls the enemy with the highest Combat Readiness back 30%. The extra hit is hers alone — an ally does not hit with her.",
    });
  }
  if (ids.has("zahhak") || heroes.some((h) => h.id === "zahhak" && h.tags.includes("injury"))) {
    add({
      key: "zahhak",
      label: "Zahhak injury",
      note: "Cuts one unit's max Health by up to 35%. That is not a hit on everyone.",
    });
  }
  if (hasUnique(heroes, "absolute dignity") || ids.has("mort")) {
    add({
      key: "no-counter",
      label: "No counters",
      note: "Nobody else can counter. Immune to Stun, Sleep, and Fear.",
    });
  } else if (
    (hasUnique(heroes, "star's blessing") ||
      hasUnique(heroes, "disciple of the stars") ||
      ids.has("astromancer-elena")) &&
    !ids.has("notos") &&
    !hasUnique(heroes, "sanctuary of battle")
  ) {
    add({
      key: "a-elena",
      label: "A.Elena",
      note: "While Star's Blessing is up, you cannot counter. She starts the fight with it for one turn. This is not Mort.",
    });
  }
  if (
    hasDebuff("Unhealable") &&
    !ids.has("notos") &&
    !hasUnique(heroes, "sanctuary of battle")
  ) {
    add({
      key: "unhealable",
      label: "Unhealable",
      note: "Heals do not land on afflicted heroes.",
    });
  }
  if (
    hasUnique(heroes, "begone") ||
    hasUnique(heroes, "obstacle elimination") ||
    ids.has("commander-pavel")
  ) {
    add({
      key: "c-pavel",
      label: "C.Pavel",
      note: "Ally crits charge Begone: he hits everyone, then his Combat Readiness fills. Extra attacks, counters, and ally-hits-with-them do not charge it. His third skill ignores damage sharing.",
    });
  }
  if (hasDebuff("Sleep") && !ids.has("notos") && !hasUnique(heroes, "sanctuary of battle")) {
    add({
      key: "sleep",
      label: "Sleep",
      note: "They can Sleep a unit. That unit cannot act, and its Evasion drops to zero until it takes a hit.",
    });
  }
  if (hasDebuff("Target") && ids.has("architect-laika")) {
    add({
      key: "target",
      label: "Target",
      note: "+15% damage taken, −50% Evasion. If this lands, Architect Laika acts again immediately.",
      answerTags: ["aoe", "injury"],
    });
  } else if (hasDebuff("Target")) {
    add({
      key: "target",
      label: "Target",
      note: "+15% damage taken, −50% Evasion.",
      answerTags: ["aoe", "injury"],
    });
  }
  if (hasUnique(heroes, "pilfer")) {
    add({
      key: "pilfer",
      label: "Pilfer",
      note: "−20% Attack, Health, and Defense, and it stays after death. Dispelling Spoils also clears it.",
      answerTags: ["strip"],
      answerEffects: ["buff-dispel"],
    });
  }
  if (hasUnique(heroes, "redirected provoke")) {
    add({
      key: "redir-provoke",
      label: "Redirected Provoke",
      note: "They use their first skill on your highest-Health unit.",
    });
  }
  if (hasUnique(heroes, "vigor")) {
    add({
      key: "vigor",
      label: "Vigor",
      note: "Undispellable +30% Attack and Defense.",
    });
  }
  if (hasUnique(heroes, "defensive magic")) {
    add({
      key: "def-magic",
      label: "Defensive Magic",
      note: "Arena defense rarely spends souls. She starts at zero Soul and gains one on her turn, so the skill that cancels yours comes late. If souls cannot generate, it never happens.",
    });
  }
  if (hasUnique(heroes, "sacred covenant")) {
    add({
      key: "covenant",
      label: "Sacred Covenant",
      note: "Self only. Undispellable for five turns, then a 100% revive. This is not team Immunity.",
      answerTags: ["anti-revive"],
      answerEffects: ["extinction"],
    });
  }
  if (hasDebuff("Collapse") || hasUnique(heroes, "collapse") || ids.has("salome")) {
    add({
      key: "collapse",
      label: "Collapse",
      note: "The HP bar is cut in half. Healing cannot fill the missing part.",
    });
  }
  if (hasUnique(heroes, "clone") || ids.has("salome")) {
    add({
      key: "salome",
      label: "Salome",
      note: "The first skill into her is cancelled. She copies a target for one turn, then acts again. Their highest-Attack ally hits with her. Removing Clone also removes what she copied.",
      answerTags: ["strip"],
    });
  }
  if (hasUnique(heroes, "inner abyss") || ids.has("abyssal-yufine")) {
    add({
      key: "a-yufine",
      label: "A.Yufine",
      note: "Strips everyone and pulls their turn bar down halfway. Always lands. When you push your own bar, a third of that push is lost.",
    });
  }
  if (hasUnique(heroes, "bind") || ids.has("rhianna-and-luciella")) {
    add({
      key: "rnl",
      label: "R&L",
      note: "Rhianna removes two buffs and inflicts Bind: that unit cannot extra-skill, counter, or have an ally hit with them off-turn. After the third skill, 70% evasion for the rest of the fight.",
      answerTags: ["aoe", "injury"],
    });
  }
  if (hasUnique(heroes, "lua squad") || ids.has("hellion-lua")) {
    add({
      key: "h-lua",
      label: "H.Lua",
      note: "When a hero hits her, their team gains 7% Combat Readiness and every ally with Challenge counters. Mort and Star's Blessing turn those counters off. Lua's Challenge shortens buffs — it does not remove them.",
    });
  }
  if (hasUnique(heroes, "obliterate") || ids.has("operator-sigret")) {
    add({
      key: "o-sigret",
      label: "O.Sigret",
      note: "Everyone's Combat Readiness is pulled back 30%, and buffs are shortened by one turn — not removed. She acts again only if Annihilation kills. Unavoidable if the target has Barrier.",
    });
  }
  if (ids.has("pirate-captain-flan")) {
    add({
      key: "pc-flan",
      label: "PC Flan",
      note: "After an ally hits a unit with no buffs, their team gains Speed and Combat Readiness. Full Burst steals a buff, then a Bomb that stuns two turns later and cannot be resisted. That stun is not the opener.",
    });
  }
  if (hasUnique(heroes, "death sentence") || ids.has("ainz-ooal-gown")) {
    add({
      key: "ainz",
      label: "Ainz",
      note: "Removes all buffs, then Silence so skills 2 and 3 cannot be used. At turn 12, Death Sentence deals 50,000 and ignores sharing; it falls off if he dies. 25% Barrier when an ally is hit. Another turn needs souls — arena defense rarely spends them.",
    });
  }
  if (hasUnique(heroes, "grudge") || hasUnique(heroes, "blood aura")) {
    add({
      key: "grudge",
      label: "Grudge / Blood Aura",
      note: "First death: team Barrier and Immunity, and he gains Blood Aura. Moon Slash only revives dead allies if that third skill gets a kill. That is a clutch, not a Ruele reset.",
    });
  }
  if (hasUnique(heroes, "can you handle this") || ids.has("eternal-wanderer-ludwig")) {
    add({
      key: "ew-ludwig",
      label: "EW Ludwig",
      note: "If you spend souls, his Combat Readiness fills and his third skill hits through more Defense. Arena defense rarely spends souls, so that extra turn usually does not happen. The first skill into him is cancelled.",
    });
  }
  if (hasUnique(heroes, "boundless obsession") || ids.has("requiem-roana")) {
    add({
      key: "rq-roana",
      label: "RQ Roana",
      note: "Combat Readiness from Speed is halved — Speed itself is not capped. When the unit in Front (rightmost) takes a turn, her Combat Readiness jumps 70%. Then she removes buffs from everyone, adds one cooldown, and pulls Combat Readiness back 30%.",
    });
  }
  if (hasUnique(heroes, "illusion") || ids.has("specter-tenebria")) {
    add({
      key: "spec-tene",
      label: "Spec Tene",
      note: "Cannot be picked as a skill target while an ally lives. Hits that strike everyone still hit her. Endless Nightmare always stuns. Poison Blast does not trigger counters. Another turn needs souls — arena defense rarely spends them.",
      answerTags: ["aoe"],
    });
  }
  if (hasUnique(heroes, "engulf") || ids.has("tidal-rift-elvira")) {
    add({
      key: "tr-elvira",
      label: "TR Elvira",
      note: "Engulf is 100% Effectiveness and crit resistance — not Immunity. Killing her gives her team Cascade (4,000 extra on their next attack). 75% Seal (passives off). The extra hit is hers alone.",
    });
  }
  if (hasUnique(heroes, "victory pose") || ids.has("top-model-luluca")) {
    add({
      key: "tm-lulu",
      label: "TM Lulu",
      note: "Victory Pose fills the team's Combat Readiness, then she acts again. A kill with Demolish cannot be revived. Energy Blast ignores damage sharing. The extra hit is hers alone.",
    });
  }
  if (hasUnique(heroes, "deify") || ids.has("zio")) {
    add({
      key: "zio",
      label: "Zio",
      note: "Removes two buffs, then Silence and pulls Combat Readiness back 30%. On her basic skill she hits again (no ally with her) and takes 50% less damage. Speed is not capped.",
    });
  }
  if (hasUnique(heroes, "nature restoration") || ids.has("mediator-kawerik")) {
    add({
      key: "ml-kawerik",
      label: "ML Kawerik",
      note: "Removes all buffs, then gives her team Barrier. Then she cleanses them, gives Attack up and Immunity. Shortening your debuffs is not the same as removing buffs.",
    });
  }
  if (hasUnique(heroes, "pestilence") || ids.has("death-dealer-ray")) {
    add({
      key: "dd-ray",
      label: "DD Ray",
      note: "Removes two buffs from everyone, then Sleep, Venom, and she acts again. Allies apply Venom and detonate it — that cuts max Health. Clinical Trial does not make an ally hit with her.",
    });
  }
  if (hasUnique(heroes, "dark moon") || hasUnique(heroes, "noias") || ids.has("shepherd-diene")) {
    add({
      key: "dark-moon",
      label: "Dark Moon",
      note: "If you spend souls, two buffs are removed. Arena defense rarely spends souls.",
    });
  }
  if (hasUnique(heroes, "i wanna go home") || ids.has("solitaria")) {
    add({
      key: "no-focus",
      label: "Focus lock",
      note: "Enemy Focus gain is zero. Massacre never charges.",
      answerTags: ["injury", "aoe", "dual-attack"],
    });
  }
  if (hasUnique(heroes, "phantom's waltz") || ids.has("sea-phantom-politis")) {
    add({
      key: "resource-cut",
      label: "Resource cut",
      note: "Enemy resource gain is reduced by 50% (Focus, Fighting Spirit, and similar). This is not a soul lock.",
    });
  }
  if (hasUnique(heroes, "astral guide") || hasUnique(heroes, "tranquility") || ids.has("politis")) {
    add({
      key: "tranquility",
      label: "Tranquility",
      note: "Heals and Immunity clip buff duration. She takes the cycle.",
    });
  }
  if (hasUnique(heroes, "skill effect nullifier") || ids.has("new-moon-luna")) {
    add({
      key: "nm-luna",
      label: "NM Luna nullifier",
      note: "She starts with one effect from the first skill into her cancelled. The rest of that skill still happens.",
    });
  }
  if (ids.has("conqueror-lilias")) {
    add({
      key: "c-lilias",
      label: "C.Lilias",
      note: "For Honor lets her act again immediately. Then a random ally hits with her basic skill.",
    });
  }
  if (hasUnique(heroes, "final deliverance") || ids.has("hecate")) {
    add({
      key: "hecate-extra",
      label: "Hecate extra-attack",
      note: "On her turn she extra-attacks everyone, then Stealth. Death's Dominion already turns revive off for both sides. The third skill starts the first fight on cooldown.",
    });
  }
  if (ids.has("archdemons-shadow")) {
    add({
      key: "ads",
      label: "ADS Burst",
      note: "Basic skill can Seal (passives off). If the target is sealed, Burst hits everyone as an extra attack — no ally with him. Dissolution lets him act again and does not trigger counters.",
    });
  }
  if (hasUnique(heroes, "star extinction") || ids.has("straze")) {
    add({
      key: "straze",
      label: "Straze",
      note: "Star Extinction hits everyone, he is Invincible for one turn, and it does not trigger counters. Destructive Gaze removes buffs from everyone. He is there to end the fight, not stall.",
    });
  }
  if (hasUnique(heroes, "detain") || ids.has("eye-of-the-abyss-fumyr")) {
    add({
      key: "fumyr-detain",
      label: "Detain",
      note: "The foremost ally is taken off the field until she dies or Detain ends. That seat is empty until they return.",
    });
  }
  if (hasUnique(heroes, "concealment") || ids.has("aube")) {
    add({
      key: "aube-hide",
      label: "Concealment",
      note: "While another ally is present she cannot be selected as a skill target. Area skills still hit her. That is not Specter Tenebria Illusion.",
      answerTags: ["aoe"],
    });
  }
  if (ids.has("argent-waves-hwayoung") || hasUnique(heroes, "swallow kick")) {
    add({
      key: "aw-hwayoung",
      label: "AW Hwayoung",
      note: "After an ally non-attack skill she Swallow Kicks the highest Defense, 50% penetrate. With Vigor she extra-turns. That extra turn is not the first cycle.",
    });
  }
  if (ids.has("aria") || hasUnique(heroes, "the umbral hour")) {
    add({
      key: "aria-stealth",
      label: "Aria Stealth",
      note: "Allies except her are Stealthed with Barrier. Single-target skills have to hit Aria. Area skills still hit. Combat Readiness −30% is not a Speed cap.",
      answerTags: ["aoe"],
    });
  }
  if (ids.has("arunka") || hasUnique(heroes, "wild instinct")) {
    add({
      key: "arunka",
      label: "Arunka",
      note: "She cannot crit. Expose is an extra attack, not Dual Attack. A kill with Thrashing cannot be revived.",
      answerTags: ["anti-revive"],
    });
  }
  if (ids.has("aubade-ludwig") || hasUnique(heroes, "light of condemnation")) {
    add({
      key: "aubade",
      label: "Aubade Ludwig",
      note: "With Dawn, Light of Condemnation is 1,000–25,000 additional on everyone from Souls spent. White Night strips two, then Block and Silence. Extra attack is not Dual Attack.",
      answerRoles: ["control"],
    });
  }
  if (ids.has("benimaru") || hasUnique(heroes, "multilayer barrier")) {
    add({
      key: "benimaru",
      label: "Benimaru",
      note: "An enemy extra turn cleanses him, grants undispellable Multilayer Barrier (+50% Hit, immune to debuffs), and pushes Combat Readiness 25%. Hell Flare at full Fighting Spirit is an extra attack, not Dual Attack: 30% penetrate, 60% with Barrier.",
      answerRoles: ["control"],
    });
  }
  if (ids.has("celine")) {
    add({
      key: "celine",
      label: "Non-attack punish",
      note: "A non-attack skill cleanses her, grants 10 Soul, and Blink hits a random unit for Combat Readiness +30%. Open with an attack. Stealth and Evasion are only on herself.",
    });
  }
  if (ids.has("byblis") || hasUnique(heroes, "i'm warning you")) {
    add({
      key: "byblis",
      label: "Counter reaction",
      note: "When an ally is counterattacked, I'm Warning You cuts enemy buff durations by 2 turns, Decrease Defense, and heals the wall. Buff duration −2 is not a strip.",
      answerTags: ["strip"],
    });
  }
  if (ids.has("dizzy") || hasUnique(heroes, "emotional gamma ray")) {
    add({
      key: "dizzy-miss",
      label: "Dizzy miss",
      note: "Emotional Gamma Ray misses the hit, but Decrease Speed, Decrease Attack, and Decrease Hit Chance still land on everyone.",
    });
  }
  if (ids.has("edward-elric") || hasUnique(heroes, "rise!")) {
    add({
      key: "edward-rise",
      label: "Edward Rise",
      note: "If you hit him while he has a debuff, Rise! strips one and inflicts a random Decrease Attack, Decrease Hit Chance, Provoke, Silence, or Restrict.",
      answerRoles: ["strip"],
    });
  }
  if (ids.has("elvira")) {
    add({
      key: "elvira-immortal",
      label: "Elvira Immortality",
      note: "Capturing Sacrifice is Immortality 3 turns and ignores cooldown manip. She cannot die in that window. Exterminate after her basic while Immortal strips one and Beguiles.",
    });
  }
  if (ids.has("fenris") || hasUnique(heroes, "soaring arrow")) {
    add({
      key: "fenris",
      label: "Fenris reaction",
      note: "After an ally extra attack, counter, or Dual Attack, Soaring Arrow hits everyone, cleanses two, and Combat-Readiness pushes him 30%.",
    });
  }
  if (ids.has("festive-eda") || hasUnique(heroes, "expected outcome")) {
    add({
      key: "festa-eda",
      label: "Festive Eda",
      note: "Stealth is only on herself — not a miss nest. If she starts a turn without Stealth she full-cleanses, Shyness, then Expected Outcome cuts Combat Readiness 50%.",
    });
  }
  if (ids.has("frida") || hasUnique(heroes, "oasis all-ride pass")) {
    add({
      key: "frida-pass",
      label: "Frida All-Ride",
      note: "Oasis All-Ride Pass is on everyone at the start. Each hero's first Soulburn costs 0 Soul. Oasis Land also ignores damage sharing for 3 turns. Aqua Ride is Soulburn, not Dual Attack.",
    });
  }
  if (ids.has("fumyr") || hasUnique(heroes, "fruit of knowledge")) {
    add({
      key: "fumyr-fruit",
      label: "Fumyr Fruit",
      note: "At full Focus after she attacks, Fruit of Knowledge full-strips everyone, then Sleep and Decrease Defense. Extra turn is Soulburn only. She is not Eye of the Abyss Fumyr.",
    });
  }
  if (hasUnique(heroes, "coastal discipline") || ids.has("aram")) {
    add({
      key: "aram",
      label: "Aram",
      note: "If you take the first turn, her team starts with Immunity for three turns. After an area attack, Warming Up: 10 Soul, Vigor, and Speed Up. That is not a Speed cap.",
      answerRoles: ["strip"],
    });
  }
  if (hasUnique(heroes, "ignore sharing") || ids.has("ivana")) {
    add({
      key: "ivana",
      label: "Ivana",
      note: "Requiem Prayer: their attacks ignore damage sharing for three turns. Offering and other share tanks do not cover you.",
    });
  }
  if (ids.has("amid") || hasUnique(heroes, "forest blessing")) {
    add({
      key: "amid",
      label: "Amid Nullifier",
      note: "Forest Blessing puts Skill Nullifier on her whole team. The first skill into each of them is cancelled, then she acts again.",
    });
  }
  if (ids.has("abigail") || hasUnique(heroes, "blood banquet")) {
    add({
      key: "abigail",
      label: "Abigail save",
      note: "When a back-row ally would die, she spends her own HP to keep them alive for that hit.",
    });
  }
  if (ids.has("ae-ningning") || hasUnique(heroes, "system hacking")) {
    add({
      key: "ae-ningning",
      label: "ae-NINGNING",
      note: "System Hacking turns Barrier into damage. That inversion ignores Effect Resistance and still hits on a miss. She is not Desert Jewel Basar.",
    });
  }
  if (ids.has("ae-winter") || hasUnique(heroes, "next level")) {
    add({
      key: "ae-winter",
      label: "ae-WINTER",
      note: "A non-attack skill into her cleanses her, grants Immunity, and resets Black Out. Do not strip or push Combat Readiness as the first action. Stealth is on herself, not a miss nest.",
    });
  }
  if (ids.has("albedo") || hasUnique(heroes, "aegis unfold")) {
    add({
      key: "albedo",
      label: "Albedo",
      note: "When an ally other than her is crit, she counters everyone with Bicorn: one buff comes off, then she gains Speed. Mort turns that counter off.",
    });
  }
  if (hasUnique(heroes, "immortal will") || ids.has("kayron")) {
    add({
      key: "kayron-immortal",
      label: "Kayron Immortality",
      note: "On lethal damage he gains Immortality and Evasion, and his third skill resets. The first kill does not stick.",
      answerTags: ["strip"],
    });
  }
  if (
    hasUnique(heroes, "last words of a fallen star") ||
    hasUnique(heroes, "knowledge of the stars") ||
    ids.has("uncharted-pioneer-politis")
  ) {
    add({
      key: "up-politis",
      label: "UP Politis",
      note: "Front: after ten ally attacks. Back: after ten hits taken. Then she cleanses herself, additional damage on her team doubles, and she acts again. That extra turn is not the first cycle. S1/S3 additional damage still lands on a miss.",
      answerTags: ["aoe"],
    });
  }
  const otherCleave = heroes.some(
    (h) =>
      h.roles.includes("cleave") &&
      !h.roles.includes("opener"),
  );
  if (roles.has("opener") && otherCleave) {
    add({
      key: "cleave",
      label: "Turn-1 cleave",
      note: "They want the first turn: remove your buffs, then hit everyone.",
    });
  }

  const firstCycle = heroes.filter(isFirstCycleOpener);
  if (firstCycle.length > 0) {
    const who = firstCycle.map((h) => h.short || h.name).join(" / ");
    const top = [...firstCycle]
      .filter((h) => Number.isFinite(h.baseSpeed))
      .sort((a, b) => (b.baseSpeed ?? 0) - (a.baseSpeed ?? 0))[0];
    const speedBit = top
      ? ` ${top.short}'s speed before gear is ${top.baseSpeed}. Last Rider Krau is 100.`
      : "";
    const cannotMiss = firstCycle.some(hitsEvenOnMiss);
    const stripOpen = firstCycle.some(
      (h) => h.tags.includes("strip") || h.roles.includes("strip"),
    );
    add({
      key: "first-cycle",
      label: "First cycle",
      note: cannotMiss
        ? `${who} acts again immediately, then the third skill hits the whole team even on miss.${speedBit} If another damage dealer takes the next turn, slow units do not act.`
        : stripOpen
          ? `${who} acts again immediately on a skill (not by spending souls).${speedBit} Buffs come off, then the follow-up, before slow units act.`
          : `${who} acts again immediately on a skill (not by spending souls).${speedBit} That extra turn is his kit, not a speed race.`,
      answerTags: cannotMiss ? undefined : ["evade"],
      answerRoles: ["opener"],
    });
    if (cannotMiss) {
      add({
        key: "cannot-miss",
        label: "Cannot miss",
        note: "The third skill after that extra turn hits everyone even on miss. Missing does not stop it.",
      });
    }
  }

  if (ids.has("renoa")) {
    add({
      key: "renoa-dirge",
      label: "Renoa Dirge",
      note: "Buffs and debuffs on her become Dirge Bullets. After each skill she extra-attacks (not Dual Attack). S3 is +40% Combat Readiness, not extra turn.",
    });
  }

  if (ids.has("holiday-yufine")) {
    add({
      key: "holiday-yufine",
      label: "H.Yufine CR",
      note: "Let's Eat Together reduces Combat Readiness decreases on their whole team by 30%. Her on-turn S1 is AoE that does not Dual Attack. Self evasion is not a miss nest.",
    });
  }

  if (ids.has("jack-o")) {
    add({
      key: "jack-o-chiron",
      label: "Jack-O' Chiron",
      note: "The back-row ally starts with Chain of Chiron: after they attack, random Stun, Cannot Buff, Decrease Hit Chance, or Restrict. On a kill her S3 extra-turns.",
    });
  }

  if (ids.has("elena") && !ids.has("astromancer-elena")) {
    add({
      key: "elena-guard",
      label: "Elena",
      note: "When the team takes an all-ally hit, she cuts 30% of that damage. Consecrated Ground then cleanses one debuff from everyone and pushes Combat Readiness 30%.",
    });
  }

  if (ids.has("kawerik")) {
    add({
      key: "kawerik-mana",
      label: "Kawerik Field",
      note: "While Mana Field is up, a skill hit into him spends 10 Fighting Spirit and deals no damage. Dimensional Corridor fully pushes cooldowns; a crit on that skill grants an extra turn.",
    });
  }

  if (ids.has("krau")) {
    add({
      key: "krau-share",
      label: "Krau Share",
      note: "While Summon Ziegfried is off cooldown he takes 25% of an ally's damage. Soulburn makes the nuke AoE; it is not extra turn.",
    });
  }

  if (ids.has("lethe")) {
    add({
      key: "lethe-frost",
      label: "Lethe Frostbite",
      note: "Freeze Over puts Frostbite: no damage reduction or damage share. Call of the Abyss Extincts on kill. Buff duration −2 is not a strip.",
    });
  }

  if (ids.has("lilias")) {
    add({
      key: "lilias-suppression",
      label: "Lilias Suppression",
      note: "After a non-attack skill she cleanses herself and Provokes that enemy. S3 hits with your highest Attack and cuts Combat Readiness 25%.",
    });
  }

  if (ids.has("lua")) {
    add({
      key: "lua-beguile",
      label: "Lua Beguile",
      note: "Sweet Talk Beguiles: at the end of that unit's turn their allies take 10% max HP. S2 is strip, Sleep, and extra turn.",
    });
  }

  const rank: Record<string, number> = {
    "lua-beguile": 10,
    "lilias-suppression": 10,
    "lethe-frost": 10,
    "krau-share": 10,
    "kawerik-mana": 10,
    "elena-guard": 11,
    "jack-o-chiron": 10,
    "holiday-yufine": 10,
    "renoa-dirge": 10,
    speedcap: 0,
    "first-cycle": 1,
    "cannot-miss": 1,
    notos: 2,
    evade: 2,
    rnl: 2,
    revive: 3,
    injury: 4,
    soulblock: 5,
    "dp-aria": 5,
    "ma-ken": 13,
    "h-lua": 13,
    "o-sigret": 14,
    "pc-flan": 14,
    ainz: 9,
    "force-target": 6,
    "fumyr-detain": 6,
    offering: 7,
    ivana: 7,
    nullifier: 8,
    amid: 8,
    "aube-hide": 8,
    immobilize: 8,
    "aw-hwayoung": 10,
    "aria-stealth": 8,
    arunka: 12,
    aubade: 9,
    benimaru: 10,
    celine: 10,
    byblis: 11,
    "dizzy-miss": 8,
    "edward-rise": 10,
    "elvira-immortal": 9,
    fenris: 11,
    "festa-eda": 8,
    "frida-pass": 10,
    "fumyr-fruit": 7,
    "redir-provoke": 8,
    collapse: 8,
    salome: 8,
    "nm-luna": 8,
    "c-lilias": 12,
    "hecate-extra": 10,
    ads: 12,
    straze: 12,
    "up-politis": 12,
    "a-yufine": 11,
    block: 8,
    "cannot-die": 9,
    "kayron-immortal": 9,
    "both-revive": 10,
    oath: 10,
    "ss-vivian": 10,
    "dj-basar": 11,
    "c-armin": 11,
    "b-hwayoung": 9,
    strip: 11,
    aram: 11,
    abigail: 9,
    "ae-ningning": 11,
    "ae-winter": 10,
    albedo: 13,
    cascade: 11,
    reversal: 12,
    "no-counter": 13,
    "a-elena": 13,
    unhealable: 21,
    "c-pavel": 23,
    "sb-ara": 24,
    "dark-moon": 14,
    "ew-ludwig": 14,
    "rq-roana": 11,
    "spec-tene": 8,
    "tr-elvira": 8,
    "tm-lulu": 12,
    zio: 9,
    "ml-kawerik": 10,
    "dd-ray": 8,
    miseria: 15,
    "sn-yulha": 16,
    "s-taeyou": 17,
    restrict: 18,
    wmeri: 19,
    rupture: 22,
  };
  return out.sort((a, b) => (rank[a.key] ?? 40) - (rank[b.key] ?? 40));
}

export function unansweredThreats(threats: DraftThreat[], filled: Hero[]): string[] {
  const tags = new Set(filled.flatMap((h) => h.tags));
  const roles = new Set(filled.flatMap((h) => h.roles));
  const effects = new Set(filled.flatMap((h) => heroEffects(h)));
  return threats
    .filter((t) => t.answerTags?.length || t.answerRoles?.length || t.answerEffects?.length)
    .filter((t) => {
      const hit =
        t.answerTags?.some((x) => tags.has(x)) ||
        t.answerRoles?.some((x) => roles.has(x)) ||
        t.answerEffects?.some((x) => effects.has(x));
      return !hit;
    })
    .map((t) => t.label);
}

const FATAL_GAP = new Set(["Speed cap", "First cycle", "Revive / reset", "Notos"]);

function prettyFatal(label: string) {
  if (label === "Notos") return "Sanctuary of Battle";
  if (label === "Cannot miss") return "the first cycle (it hits everyone even on miss)";
  return label;
}

/** Factual limit when no listed lineup answers a wall-level threat. Not a skip order. */
export function lineupLimitNote(
  watch: DraftThreat[],
  teams: { gaps: string[] }[],
): string | null {
  const names: string[] = [];
  if (watch.some((t) => t.key === "cannot-miss")) {
    names.push(prettyFatal("Cannot miss"));
  }
  if (teams.length > 0) {
    const shared = teams[0]!.gaps.filter(
      (g) => FATAL_GAP.has(g) && teams.every((t) => t.gaps.includes(g)),
    );
    for (const g of shared) {
      if (g === "First cycle" && names.some((n) => n.includes("first cycle"))) continue;
      names.push(prettyFatal(g));
    }
  }
  if (names.length === 0) return null;
  if (names.length === 1) {
    return `None of these lineups answer ${names[0]}. Skipping this defense is allowed.`;
  }
  const last = names[names.length - 1]!;
  return `None of these lineups answer ${names.slice(0, -1).join(", ")} or ${last}. Skipping this defense is allowed.`;
}
