// Vice Trophy Tracker — where progress lives.
//
// The earned set and the two switches (spoiler-safe, hide-earned) are kept
// in localStorage, so a reader's checklist survives a reload, a new tab and
// a new day. Export writes the progress out as a JSON file; import reads one
// back and only keeps trophy ids that exist in this list, so a stale export
// or a file from another tracker can never corrupt the checklist. Nothing
// in this module touches the network.

export const STORE_KEYS = {
  earned: 'vice-trophy-tracker-earned-v1',
  spoiler: 'vice-trophy-tracker-spoiler-v1',
  hideEarned: 'vice-trophy-tracker-hide-earned-v1',
};

const APP_TAG = 'vice-trophy-tracker';

// --- low-level helpers --------------------------------------------------------

function loadIdSet(key) {
  let parsed;
  try {
    parsed = JSON.parse(localStorage.getItem(key) ?? '[]');
  } catch {
    return new Set();
  }
  if (!Array.isArray(parsed)) return new Set();
  return new Set(parsed.filter((value) => Number.isInteger(value)));
}

function saveIdSet(key, ids) {
  const sorted = [...ids].sort((a, b) => a - b);
  localStorage.setItem(key, JSON.stringify(sorted));
}

function loadSwitch(key) {
  return localStorage.getItem(key) === '1';
}

function saveSwitch(key, on) {
  localStorage.setItem(key, on ? '1' : '0');
}

// --- earned trophies ----------------------------------------------------------

export function readEarned() {
  return loadIdSet(STORE_KEYS.earned);
}

export function writeEarned(earned) {
  saveIdSet(STORE_KEYS.earned, earned);
}

// --- switches -----------------------------------------------------------------

export function readSpoiler() {
  return loadSwitch(STORE_KEYS.spoiler);
}

export function writeSpoiler(on) {
  saveSwitch(STORE_KEYS.spoiler, on);
}

export function readHideEarned() {
  return loadSwitch(STORE_KEYS.hideEarned);
}

export function writeHideEarned(on) {
  saveSwitch(STORE_KEYS.hideEarned, on);
}

// Wipe every saved switch and the earned set (the Reset button's backend).
export function clearProgress() {
  for (const key of Object.values(STORE_KEYS)) localStorage.removeItem(key);
}

// --- export / import ------------------------------------------------------------

// Download the current progress as a JSON file the reader can keep, share
// or import later. The payload names the app and its version, so an import
// can tell our exports apart from anything else.
export function downloadProgress(earned, total) {
  const done = earned.size;
  const payload = {
    app: APP_TAG,
    version: 1,
    exportedAt: new Date().toISOString(),
    earned: [...earned].sort((a, b) => a - b),
    total,
    percent: total ? Math.round((done / total) * 100) : 0,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'gta6-trophy-progress.json';
  link.click();
  URL.revokeObjectURL(link.href);
}

// Read a progress file back. Returns { earned } on success, or { error }
// when the file is not one of our exports. Ids that are not in validIds
// are dropped, so an export from another list cannot add trophies that do
// not exist here. A payload that names another app is refused outright.
export async function parseProgressFile(file, validIds) {
  let data;
  try {
    data = JSON.parse(await file.text());
  } catch {
    return { error: 'That file is not valid JSON.' };
  }
  if (data && typeof data === 'object' && !Array.isArray(data) && data.app && data.app !== APP_TAG) {
    return { error: 'That file is from another tracker, not this one.' };
  }
  const list = Array.isArray(data) ? data : data.earned;
  if (!Array.isArray(list)) return { error: 'That file has no earned list in it.' };
  const earned = new Set();
  for (const value of list) {
    if (Number.isInteger(value) && validIds.has(value)) earned.add(value);
  }
  return { earned };
}
