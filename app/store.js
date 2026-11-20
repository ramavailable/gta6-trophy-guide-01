// Progress store: the earned set and the spoiler setting, kept in localStorage
// so the checklist survives a reload. Export writes a JSON file; import reads one
// back. Nothing here touches the network.

export const EARNED_KEY = 'vice-trophy-tracker-earned-v1';
export const SPOILER_KEY = 'vice-trophy-tracker-spoiler-v1';

// Load the earned trophy ids (numbers) from localStorage. Bad data is ignored.
export function loadEarned() {
  try {
    const raw = JSON.parse(localStorage.getItem(EARNED_KEY) ?? '[]');
    if (!Array.isArray(raw)) return new Set();
    return new Set(raw.filter((n) => Number.isInteger(n)));
  } catch {
    return new Set();
  }
}

// Save the earned trophy ids (numbers) to localStorage.
export function saveEarned(earned) {
  localStorage.setItem(EARNED_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
}

// Load the spoiler-safe setting (true hides story names until earned).
export function loadSpoiler() {
  return localStorage.getItem(SPOILER_KEY) === '1';
}

// Save the spoiler-safe setting.
export function saveSpoiler(on) {
  localStorage.setItem(SPOILER_KEY, on ? '1' : '0');
}

// Download the earned set as a JSON file the reader can keep or share.
export function exportProgress(earned) {
  const blob = new Blob(
    [JSON.stringify({ app: 'vice-trophy-tracker', earned: [...earned].sort((a, b) => a - b) }, null, 2)],
    { type: 'application/json' },
  );
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

// Read an exported progress file and return its earned set (or null if invalid).
export async function importProgress(file) {
  const text = await file.text();
  const data = JSON.parse(text);
  const list = Array.isArray(data) ? data : data.earned;
  if (!Array.isArray(list)) return null;
  return new Set(list.filter((n) => Number.isInteger(n)));
}
