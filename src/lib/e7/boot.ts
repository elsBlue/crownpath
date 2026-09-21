const KEY = "crownpath-shade";

let claimed = false;

export function bootAlreadyPlayed() {
  if (claimed) return true;
  try {
    return sessionStorage.getItem(KEY) === "done";
  } catch {
    return false;
  }
}

export function claimBootPlay() {
  if (bootAlreadyPlayed()) return false;
  claimed = true;
  return true;
}

export function markBootDone() {
  claimed = true;
  try {
    sessionStorage.setItem(KEY, "done");
  } catch {
    /* private mode */
  }
}
