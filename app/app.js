// Vice Trophy Tracker: checklist + guide for all 55 GTA VI trophies on PS5.
//
// It loads app/data/trophies.json, renders the checklist, the guide panel
// and the roadmap, and keeps progress in localStorage (see store.js). Fully
// offline: the only fetch is the trophy data file, served from app/ itself.
//
// Deep links, used by the screenshots and by readers sharing a trophy:
// ?t=<id> selects a trophy, ?grade= / ?kind= filter, ?spoiler=1 hides story
// spoilers, ?earn=1,2,3 marks trophies earned for the shot.

import {
  readEarned, writeEarned, clearProgress,
  readSpoiler, writeSpoiler,
  readHideEarned, writeHideEarned,
  downloadProgress, parseProgressFile,
} from './store.js';
import { renderSteps, stepFor } from './roadmap.js';

const KIND_LABEL = {
  story: 'Story',
  questline: 'Questline',
  activity: 'Activity',
  collectible: 'Collectible',
  robbery: 'Robbery',
  misc: 'Misc',
};
const GRADE_RANK = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
const GRADES = ['platinum', 'gold', 'silver', 'bronze'];

const data = await (await fetch('data/trophies.json')).json();
const trophies = data.trophies;
const byId = new Map(trophies.map((trophy) => [trophy.id, trophy]));
const validIds = new Set(byId.keys());

// --- state -----------------------------------------------------------------

const params = new URLSearchParams(location.search);
const state = {
  earned: readEarned(),
  spoiler: readSpoiler(),
  hideEarned: readHideEarned(),
  query: '',
  grade: params.get('grade') || 'all',
  kind: params.get('kind') || 'all',
  sort: 'default',
  selected: Number(params.get('t')) || 28,
};
if (params.get('spoiler') === '1') state.spoiler = true;
if (params.get('earn')) {
  // Replace (not add to) the saved set, so a shared link always shows the
  // same progress no matter what this browser earned before.
  state.earned = new Set();
  for (const part of params.get('earn').split(',')) {
    const id = Number(part);
    if (byId.has(id)) state.earned.add(id);
  }
  writeEarned(state.earned);
}
if (!byId.has(state.selected)) state.selected = trophies[0].id;

// --- DOM shortcuts ----------------------------------------------------------

const $ = (id) => document.getElementById(id);
const listEl = $('list');
const panelEl = $('panel');
const progressLine = $('progress-line');
const progressFill = $('progress-bar-fill');
const gradeBreakdown = $('grade-breakdown');
const countEl = $('trophy-count');
const emptyEl = $('empty-state');
const stepsEl = $('steps');
const queryInput = $('query');
const gradeSelect = $('grade-filter');
const sortSelect = $('sort-filter');
const spoilerToggle = $('spoiler-toggle');
const hideEarnedToggle = $('hide-earned-toggle');

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
}

function gradeBadge(trophy) {
  return el('span', `grade grade-${trophy.grade}`, trophy.grade);
}

function spoilerHidden(trophy) {
  return state.spoiler && trophy.kind === 'story' && !state.earned.has(trophy.id);
}

// --- filtering and sorting ---------------------------------------------------

function shownTrophies() {
  const query = state.query.trim().toLowerCase();
  const list = trophies.filter((trophy) => {
    if (state.grade !== 'all' && trophy.grade !== state.grade) return false;
    if (state.kind === 'missable' && !trophy.missable) return false;
    if (state.kind !== 'all' && state.kind !== 'missable' && trophy.kind !== state.kind) return false;
    if (state.hideEarned && state.earned.has(trophy.id)) return false;
    if (query && !(trophy.name + ' ' + trophy.description + ' ' + trophy.guide).toLowerCase().includes(query)) return false;
    return true;
  });
  if (state.sort === 'grade') list.sort((a, b) => GRADE_RANK[a.grade] - GRADE_RANK[b.grade] || a.id - b.id);
  else if (state.sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
  else if (state.sort === 'stage') list.sort((a, b) => (a.stage - b.stage) || a.id - b.id);
  return list;
}

// --- rendering ---------------------------------------------------------------

function renderProgress() {
  const done = state.earned.size;
  const total = trophies.length;
  const pct = Math.round((done / total) * 100);
  progressLine.textContent = `${done} of ${total} earned — ${pct}% to platinum`;
  progressFill.style.width = `${pct}%`;
  gradeBreakdown.textContent = GRADES.map((grade) => {
    const all = trophies.filter((t) => t.grade === grade).length;
    const got = trophies.filter((t) => t.grade === grade && state.earned.has(t.id)).length;
    return `${got}/${all} ${grade}`;
  }).join(' · ');
}

function toggleEarned(id) {
  if (state.earned.has(id)) state.earned.delete(id);
  else state.earned.add(id);
  writeEarned(state.earned);
  renderAll();
}

function trophyRow(trophy) {
  const hidden = spoilerHidden(trophy);
  const row = el('article', 'trophy');
  row.classList.toggle('earned', state.earned.has(trophy.id));
  row.classList.toggle('selected', trophy.id === state.selected);
  row.setAttribute('role', 'option');
  row.setAttribute('aria-selected', String(trophy.id === state.selected));
  row.tabIndex = trophy.id === state.selected ? 0 : -1;
  row.dataset.id = String(trophy.id);
  row.addEventListener('click', () => {
    state.selected = trophy.id;
    renderAll();
  });

  const box = el('input');
  box.type = 'checkbox';
  box.checked = state.earned.has(trophy.id);
  box.setAttribute('aria-label', `Mark ${trophy.name} earned`);
  box.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleEarned(trophy.id);
  });

  const main = el('div', 'trophy-main');
  main.append(
    el('h3', null, hidden ? 'Hidden trophy — story spoiler' : trophy.name),
    el('p', 'trophy-desc', hidden ? 'Earn it to reveal the name and description.' : trophy.description),
  );
  const tags = el('div', 'tags');
  tags.append(gradeBadge(trophy));
  tags.append(el('span', 'tag', KIND_LABEL[trophy.kind]));
  if (trophy.missable) tags.append(el('span', 'tag tag-missable', '⚠ MISSABLE'));
  main.append(tags);

  row.append(box, main);
  return row;
}

function renderList() {
  const shown = shownTrophies();
  listEl.replaceChildren();
  for (const trophy of shown) listEl.append(trophyRow(trophy));
  countEl.textContent = `Showing ${shown.length} of ${trophies.length} trophies`;
  emptyEl.hidden = shown.length !== 0;
}

function renderDetail() {
  const trophy = byId.get(state.selected);
  const hidden = spoilerHidden(trophy);
  panelEl.replaceChildren();

  const head = el('div', 'detail-head');
  head.append(gradeBadge(trophy));
  head.append(el('h2', null, hidden ? 'Hidden trophy — story spoiler' : trophy.name));
  if (trophy.missable && !hidden) head.append(el('span', 'tag tag-missable', '⚠ MISSABLE'));
  panelEl.append(head);

  panelEl.append(el('p', 'detail-desc', hidden
    ? 'This is a story trophy. Turn spoiler-safe off, or earn it, to see its name, description and guide.'
    : trophy.description));

  if (!hidden) {
    panelEl.append(el('h3', null, 'How to get it'));
    panelEl.append(el('p', 'detail-guide', trophy.guide));

    panelEl.append(el('h3', null, 'Sources'));
    const sources = el('ul', 'sources');
    for (const source of trophy.sources) {
      const item = el('li');
      if (source.url) {
        const link = el('a', null, source.name);
        link.href = source.url;
        link.target = '_blank';
        link.rel = 'noopener';
        item.append(link);
      } else {
        item.textContent = source.name;
      }
      sources.append(item);
    }
    panelEl.append(sources);

    const step = stepFor(trophy);
    if (step) panelEl.append(el('p', 'detail-step', `Roadmap step ${step.n} — ${step.title}.`));
  }

  const toggle = el('button', 'earn-btn', state.earned.has(trophy.id) ? '✓ Earned — click to unmark' : 'Mark as earned');
  toggle.type = 'button';
  toggle.addEventListener('click', () => toggleEarned(trophy.id));
  panelEl.append(toggle);
}

function renderAll() {
  renderProgress();
  renderList();
  renderDetail();
  renderSteps(stepsEl, byId, state.earned, (id) => {
    state.selected = id;
    document.getElementById('checklist-section').scrollIntoView({ behavior: 'smooth' });
    renderAll();
  });
}

// --- progress summary ---------------------------------------------------------

function progressSummary() {
  const done = state.earned.size;
  const total = trophies.length;
  const parts = GRADES.map((grade) => {
    const all = trophies.filter((t) => t.grade === grade).length;
    const got = trophies.filter((t) => t.grade === grade && state.earned.has(t.id)).length;
    return `${got}/${all} ${grade}`;
  });
  return `GTA 6 trophies: ${done}/${total} (${Math.round((done / total) * 100)}%) — ${parts.join(', ')}`;
}

async function copySummary(button) {
  const text = progressSummary();
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = el('textarea');
    area.value = text;
    document.body.append(area);
    area.select();
    document.execCommand('copy');
    area.remove();
  }
  const label = button.textContent;
  button.textContent = 'Copied!';
  setTimeout(() => { button.textContent = label; }, 1500);
}

// --- controls -----------------------------------------------------------------

queryInput.addEventListener('input', () => { state.query = queryInput.value; renderList(); });

gradeSelect.value = state.grade;
gradeSelect.addEventListener('change', () => { state.grade = gradeSelect.value; renderList(); });

sortSelect.addEventListener('change', () => { state.sort = sortSelect.value; renderList(); });

document.querySelectorAll('[data-kind]').forEach((button) => {
  if (button.dataset.kind === state.kind) button.classList.add('active');
  button.setAttribute('aria-pressed', String(button.dataset.kind === state.kind));
  button.addEventListener('click', () => {
    state.kind = button.dataset.kind;
    document.querySelectorAll('[data-kind]').forEach((other) => {
      other.classList.toggle('active', other === button);
      other.setAttribute('aria-pressed', String(other === button));
    });
    renderList();
  });
});

spoilerToggle.checked = state.spoiler;
spoilerToggle.addEventListener('change', () => {
  state.spoiler = spoilerToggle.checked;
  writeSpoiler(state.spoiler);
  renderAll();
});

hideEarnedToggle.checked = state.hideEarned;
hideEarnedToggle.addEventListener('change', () => {
  state.hideEarned = hideEarnedToggle.checked;
  writeHideEarned(state.hideEarned);
  renderList();
});

$('export-btn').addEventListener('click', () => downloadProgress(state.earned, trophies.length));
$('import-file').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const result = await parseProgressFile(file, validIds);
  if (result.earned) {
    state.earned = result.earned;
    writeEarned(state.earned);
    renderAll();
  } else {
    countEl.textContent = result.error;
  }
  event.target.value = '';
});
$('copy-summary-btn').addEventListener('click', (event) => copySummary(event.currentTarget));
$('reset-btn').addEventListener('click', () => {
  state.earned = new Set();
  clearProgress();
  writeEarned(state.earned);
  renderAll();
});
$('clear-filters-btn').addEventListener('click', () => {
  state.query = '';
  state.grade = 'all';
  state.kind = 'all';
  state.sort = 'default';
  state.hideEarned = false;
  queryInput.value = '';
  gradeSelect.value = 'all';
  sortSelect.value = 'default';
  hideEarnedToggle.checked = false;
  writeHideEarned(false);
  document.querySelectorAll('[data-kind]').forEach((button) => {
    button.classList.toggle('active', button.dataset.kind === 'all');
    button.setAttribute('aria-pressed', String(button.dataset.kind === 'all'));
  });
  renderList();
});

// Keyboard: arrows move the selection through the visible trophies, Home and
// End jump to the first and last one, Enter toggles the selected trophy.
listEl.addEventListener('keydown', (event) => {
  const shown = shownTrophies();
  const at = shown.findIndex((trophy) => trophy.id === state.selected);
  const jumpTo = (index) => {
    if (!shown[index]) return;
    state.selected = shown[index].id;
    renderAll();
    listEl.querySelector('.trophy.selected')?.focus();
  };
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    jumpTo(event.key === 'ArrowDown' ? Math.min(at + 1, shown.length - 1) : Math.max(at - 1, 0));
  } else if (event.key === 'Home') {
    event.preventDefault();
    jumpTo(0);
  } else if (event.key === 'End') {
    event.preventDefault();
    jumpTo(shown.length - 1);
  } else if (event.key === 'Enter' && at >= 0) {
    event.preventDefault();
    toggleEarned(state.selected);
  }
});

renderAll();

// The list renders after the data fetch, so the browser's own anchor jump
// (e.g. #roadmap) lands before the page has its final height. Re-apply it
// once the first render is done, so a shared link opens at the right place.
if (location.hash === '#roadmap') {
  document.getElementById('roadmap-section').scrollIntoView();
}

// Signal to the screenshot driver that the first render is done.
window.__shotReady = true;
