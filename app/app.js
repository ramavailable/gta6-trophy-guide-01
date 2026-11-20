// Vice Trophy Tracker: checklist + guide for all 55 GTA VI trophies on PS5.
// Loads app/data/trophies.json, renders the checklist, the roadmap and the
// detail panel, and keeps progress in localStorage (see store.js). Fully
// offline: the only fetch is the trophy data file, served from app/ itself.

import { loadEarned, saveEarned, loadSpoiler, saveSpoiler, exportProgress, importProgress } from './store.js';
import { renderRoadmap } from './roadmap.js';

const KIND_LABELS = {
  story: 'Story',
  questline: 'Questline',
  activity: 'Activity',
  collectible: 'Collectible',
  robbery: 'Robbery',
  misc: 'Misc',
};

const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];

const listEl = document.getElementById('trophy-list');
const detailEl = document.getElementById('detail');
const progressText = document.getElementById('progress-text');
const progressFill = document.getElementById('progress-fill');
const progressGrades = document.getElementById('progress-grades');
const countEl = document.getElementById('shown-count');

const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;
const byId = new Map(trophies.map((t) => [t.id, t]));

// Deep links, used by the screenshots and by readers sharing a trophy:
// ?t=<id> selects a trophy, ?grade= / ?kind= filter, ?spoiler=1 hides story
// spoilers, ?earn=1,2,3 marks trophies earned for the shot.
const params = new URLSearchParams(location.search);
let earned = loadEarned();
let spoiler = loadSpoiler();
if (params.get('spoiler') === '1') spoiler = true;
if (params.get('earn')) {
  // Replace (not add to) the saved set, so a shared link always shows the
  // same progress no matter what this browser earned before.
  earned = new Set();
  for (const n of params.get('earn').split(',')) {
    const id = Number(n);
    if (byId.has(id)) earned.add(id);
  }
  saveEarned(earned);
}
let selectedId = Number(params.get('t')) || 28;
if (!byId.has(selectedId)) selectedId = trophies[0].id;

const filters = {
  q: '',
  grade: params.get('grade') || 'all',
  kind: params.get('kind') || 'all',
  hideEarned: false,
};

function isHidden(t) {
  return spoiler && t.kind === 'story' && !earned.has(t.id);
}

function visibleTrophies() {
  const q = filters.q.trim().toLowerCase();
  return trophies.filter((t) => {
    if (filters.grade !== 'all' && t.grade !== filters.grade) return false;
    if (filters.kind === 'missable' && !t.missable) return false;
    if (filters.kind !== 'all' && filters.kind !== 'missable' && t.kind !== filters.kind) return false;
    if (filters.hideEarned && earned.has(t.id)) return false;
    if (q && !(t.name + ' ' + t.description + ' ' + t.guide).toLowerCase().includes(q)) return false;
    return true;
  });
}

function gradeBadge(t) {
  const b = document.createElement('span');
  b.className = `grade grade-${t.grade}`;
  b.textContent = t.grade;
  return b;
}

function renderProgress() {
  const total = trophies.length;
  const done = earned.size;
  progressText.textContent = `${done} of ${total} earned — ${Math.round((done / total) * 100)}% to platinum`;
  progressFill.style.width = `${(done / total) * 100}%`;
  progressGrades.textContent = GRADE_ORDER.map(
    (g) => `${earned.size && trophies.filter((t) => t.grade === g && earned.has(t.id)).length}/${trophies.filter((t) => t.grade === g).length} ${g}`,
  ).join(' · ');
}

function renderList() {
  const shown = visibleTrophies();
  listEl.replaceChildren();
  for (const t of shown) {
    const row = document.createElement('article');
    row.className = 'trophy' + (earned.has(t.id) ? ' earned' : '') + (t.id === selectedId ? ' selected' : '');
    row.addEventListener('click', () => {
      selectedId = t.id;
      renderList();
      renderDetail();
    });
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.id);
    box.setAttribute('aria-label', `Mark ${t.name} earned`);
    box.addEventListener('click', (e) => {
      e.stopPropagation();
      if (box.checked) earned.add(t.id);
      else earned.delete(t.id);
      saveEarned(earned);
      renderProgress();
      renderList();
      renderDetail();
    });
    const main = document.createElement('div');
    main.className = 'trophy-main';
    const name = document.createElement('h3');
    name.textContent = isHidden(t) ? 'Hidden trophy — story spoiler' : t.name;
    const desc = document.createElement('p');
    desc.className = 'trophy-desc';
    desc.textContent = isHidden(t) ? 'Earn it to reveal the name and description.' : t.description;
    const tags = document.createElement('div');
    tags.className = 'tags';
    tags.append(gradeBadge(t));
    const kind = document.createElement('span');
    kind.className = 'tag';
    kind.textContent = KIND_LABELS[t.kind];
    tags.append(kind);
    if (t.missable) {
      const m = document.createElement('span');
      m.className = 'tag tag-missable';
      m.textContent = '⚠ MISSABLE';
      tags.append(m);
    }
    main.append(name, desc, tags);
    row.append(box, main);
    listEl.append(row);
  }
  countEl.textContent = `Showing ${shown.length} of ${trophies.length} trophies`;
}

function renderDetail() {
  const t = byId.get(selectedId);
  detailEl.replaceChildren();
  const head = document.createElement('div');
  head.className = 'detail-head';
  head.append(gradeBadge(t));
  const name = document.createElement('h2');
  name.textContent = isHidden(t) ? 'Hidden trophy — story spoiler' : t.name;
  head.append(name);
  if (t.missable && !isHidden(t)) {
    const m = document.createElement('span');
    m.className = 'tag tag-missable';
    m.textContent = '⚠ MISSABLE';
    head.append(m);
  }
  detailEl.append(head);

  const desc = document.createElement('p');
  desc.className = 'detail-desc';
  desc.textContent = isHidden(t)
    ? 'This is a story trophy. Turn spoiler-safe off, or earn it, to see its name, description and guide.'
    : t.description;
  detailEl.append(desc);

  if (!isHidden(t)) {
    const guideTitle = document.createElement('h3');
    guideTitle.textContent = 'How to get it';
    const guide = document.createElement('p');
    guide.className = 'detail-guide';
    guide.textContent = t.guide;
    detailEl.append(guideTitle, guide);

    const srcTitle = document.createElement('h3');
    srcTitle.textContent = 'Sources';
    const srcList = document.createElement('ul');
    srcList.className = 'sources';
    for (const s of t.sources) {
      const li = document.createElement('li');
      if (s.url) {
        const a = document.createElement('a');
        a.href = s.url;
        a.textContent = s.name;
        a.target = '_blank';
        a.rel = 'noopener';
        li.append(a);
      } else {
        li.textContent = s.name;
      }
      srcList.append(li);
    }
    detailEl.append(srcTitle, srcList);
  }

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'earn-btn';
  toggle.textContent = earned.has(t.id) ? '✓ Earned — click to unmark' : 'Mark as earned';
  toggle.addEventListener('click', () => {
    if (earned.has(t.id)) earned.delete(t.id);
    else earned.add(t.id);
    saveEarned(earned);
    renderProgress();
    renderList();
    renderDetail();
  });
  detailEl.append(toggle);
}

// Wire the controls.
const searchInput = document.getElementById('search');
searchInput.addEventListener('input', () => { filters.q = searchInput.value; renderList(); });
const gradeSelect = document.getElementById('grade');
gradeSelect.value = filters.grade;
gradeSelect.addEventListener('change', () => { filters.grade = gradeSelect.value; renderList(); });
document.querySelectorAll('[data-kind]').forEach((btn) => {
  if (btn.dataset.kind === filters.kind) btn.classList.add('active');
  btn.addEventListener('click', () => {
    filters.kind = btn.dataset.kind;
    document.querySelectorAll('[data-kind]').forEach((b) => b.classList.toggle('active', b === btn));
    renderList();
  });
});
const spoilerToggle = document.getElementById('spoiler');
spoilerToggle.checked = spoiler;
spoilerToggle.addEventListener('change', () => {
  spoiler = spoilerToggle.checked;
  saveSpoiler(spoiler);
  renderList();
  renderDetail();
});
const hideEarned = document.getElementById('hide-earned');
hideEarned.addEventListener('change', () => { filters.hideEarned = hideEarned.checked; renderList(); });
document.getElementById('export').addEventListener('click', () => exportProgress(earned));
document.getElementById('import').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const next = await importProgress(file).catch(() => null);
  if (next) {
    earned = next;
    saveEarned(earned);
    renderProgress();
    renderList();
    renderDetail();
  }
  e.target.value = '';
});
document.getElementById('reset').addEventListener('click', () => {
  earned = new Set();
  saveEarned(earned);
  renderProgress();
  renderList();
  renderDetail();
});

renderRoadmap(document.getElementById('roadmap-steps'), byId, (id) => {
  selectedId = id;
  document.getElementById('checklist').scrollIntoView({ behavior: 'smooth' });
  renderList();
  renderDetail();
});
renderProgress();
renderList();
renderDetail();

// The list renders after the data fetch, so the browser's own anchor jump
// (e.g. #roadmap) lands before the page has its final height. Re-apply it
// once the first render is done, so a shared link opens at the right place.
if (location.hash === '#roadmap') {
  document.getElementById('roadmap').scrollIntoView();
}

// Signal to the screenshot driver that the first render is done.
window.__shotReady = true;
