// Vice Trophy Tracker — saved progress.
// One small job: keep the earned set in localStorage, and export / import it
// as a JSON file. No network, no account, just the browser's own storage.

const STORAGE_KEY = 'vice-trophy-tracker-v1';
const TOTAL = 55;

/** The earned trophy ids (1..55) the browser has saved, or an empty set. */
export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const data = JSON.parse(raw);
    const ids = Array.isArray(data) ? data : data.earned;
    if (!Array.isArray(ids)) return new Set();
    return new Set(ids.filter((n) => Number.isInteger(n) && n >= 1 && n <= TOTAL));
  } catch {
    return new Set();
  }
}

/** Persist the earned set. A storage failure is silent: tracking still works. */
export function saveProgress(earned) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        app: 'vice-trophy-tracker',
        version: 1,
        savedAt: new Date().toISOString(),
        earned: [...earned].sort((a, b) => a - b),
      }),
    );
  } catch {
    // Private mode or a full store: the page keeps working without saving.
  }
}

/** The JSON text an Export download carries. */
export function exportProgress(earned) {
  return JSON.stringify(
    {
      app: 'vice-trophy-tracker',
      version: 1,
      exportedAt: new Date().toISOString(),
      earned: [...earned].sort((a, b) => a - b),
    },
    null,
    2,
  );
}

/** Parse an exported file back into an earned set. Throws on bad input. */
export function parseProgress(text) {
  const data = JSON.parse(text);
  const ids = Array.isArray(data) ? data : data.earned;
  if (!Array.isArray(ids)) throw new Error('no earned list in file');
  const clean = ids.filter((n) => Number.isInteger(n) && n >= 1 && n <= TOTAL);
  if (clean.length === 0 && ids.length > 0) throw new Error('no valid trophy ids in file');
  return new Set(clean);
}

/** Forget everything saved. Returns an empty set for the caller to use. */
export function clearProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing saved, or storage is unavailable: same result.
  }
  return new Set();
}
