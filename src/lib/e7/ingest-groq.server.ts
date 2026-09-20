/** Groq ingest is revoked. Catalog index lives in ingest.ts. */
export { catalogIndex } from "./ingest";

export function readLocalGroqKey(): string {
  return "";
}

export function writeLocalGroqKey(_key: string) {
  /* no-op — Groq is off */
}

export function extractKitsWithGroq(): never {
  throw new Error("Groq ingest is off. Use SuperGrok draft JSON.");
}
