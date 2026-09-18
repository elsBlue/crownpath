import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { groqExtract } from "../../../scripts/extract-kits.mjs";
import { HEROES, heroRarity } from "./heroes";

export function catalogIndex() {
  return HEROES.map((h) => ({
    id: h.id,
    name: h.name,
    short: h.short,
    element: h.element,
    class: h.class,
    tier: h.tier,
    defense: h.defense,
    offense: h.offense,
    baseSpeed: h.baseSpeed,
    rarity: heroRarity(h),
    icon: h.icon,
  }));
}

export function readLocalGroqKey(): string {
  if (process.env.GROQ_API_KEY?.trim()) return process.env.GROQ_API_KEY.trim();
  try {
    const raw = JSON.parse(readFileSync(join(process.cwd(), ".grok/secrets.json"), "utf8"));
    return String(raw.GROQ_API_KEY || "").trim();
  } catch {
    return "";
  }
}

export function writeLocalGroqKey(key: string) {
  const dir = join(process.cwd(), ".grok");
  mkdirSync(dir, { recursive: true });
  const path = join(dir, "secrets.json");
  let current: Record<string, string> = {};
  try {
    current = JSON.parse(readFileSync(path, "utf8")) as Record<string, string>;
  } catch {
    current = {};
  }
  if (key) current.GROQ_API_KEY = key;
  else delete current.GROQ_API_KEY;
  writeFileSync(path, JSON.stringify(current, null, 2) + "\n", { mode: 0o600 });
}

export function extractKitsWithGroq(kitText: string, date: string, key: string) {
  return groqExtract(kitText, { key, date, catalog: catalogIndex() });
}
