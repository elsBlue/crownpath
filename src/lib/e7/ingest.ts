import type { Element, HeroClass, Role, Tag, Tier, UniqueEffect } from "./types";

export const BATCH_MAX = 10;

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
] as const;

export type PreferSlot = (typeof PREFER_SLOTS)[number];

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
] as const;

export type IngestFlag = (typeof FLAG_IDS)[number];

export type DraftWatch = {
  key: string;
  label: string;
  note: string;
};

export type HeroDraft = {
  id: string;
  name: string;
  short: string;
  element: Element;
  class: HeroClass;
  tier: Tier;
  rarity: 3 | 4 | 5;
  roles: Role[];
  tags: Tag[];
  effects: string[];
  buffs: string[];
  debuffs: string[];
  uniqueEffects: UniqueEffect[];
  kit: string;
  jobFor: string;
  watch: DraftWatch | null;
  prefer: PreferSlot[];
  applyWatch: boolean;
  flags: string[];
  sourceKit: string;
  baseSpeed?: number;
  defense: number;
  offense: number;
  verified: true;
  checkedAt: string;
  matched: boolean;
};

export type IngestBatch = {
  model?: string;
  checkedAt: string;
  heroes: HeroDraft[];
};

export const FLAG_LABEL: Record<string, string> = {
  "self-stealth-not-evade": "Self stealth ≠ miss nest",
  "self-evasion-not-miss-nest": "Self evasion ≠ miss nest",
  "extra-attack-not-dual-attack": "Extra attack ≠ Dual Attack",
  "extra-turn-soulburn-only": "Extra turn is Soulburn only",
  "buff-duration-minus-1-not-strip": "Duration −1 ≠ strip",
  "cannot-buff-not-seal": "Cannot Buff ≠ Seal",
  "skill-effect-nullifier-not-skill-nullifier": "Effect Nullifier ≠ Skill Nullifier",
  "cr-cut-not-speedcap": "CR cut ≠ Speed cap",
  "self-skill-nullifier-not-fallen-cecilia": "Self Nullifier ≠ F.Cecilia",
};
