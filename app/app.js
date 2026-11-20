// Vice Trophy Tracker — the checklist, the guides and the filters.
// Boots by loading the official list from data/trophies.json, then renders
// the checklist, the guide panel and the roadmap from it. Everything runs
// offline: the only file fetched is the app's own data file.

import { loadProgress, saveProgress, exportProgress, parseProgress, clearProgress } from './store.js';
import { ROADMAP_STEPS, MISSABLE, stepOf, stepCounts, isMissable } from './roadmap.js';

// Where each fact comes from. Every guide below names its sources from here.
const SOURCES = {
  pyx: {
    label: 'PowerPyx — GTA 6 Trophy Guide & Roadmap',
    url: 'https://www.powerpyx.com/grand-theft-auto-6-gta-6-trophy-guide-roadmap/',
  },
  exo: {
    label: 'Exophase — official GTA VI trophy list',
    url: 'https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/',
  },
  psn: {
    label: 'PSNProfiles — GTA VI trophy list',
    url: 'https://psnprofiles.com/trophies/43531-grand-theft-auto-vi',
  },
};

// The kind each trophy belongs to, for the kind filter.
const KIND_OF = {
  1: 'story', 2: 'story', 3: 'story', 4: 'story', 5: 'story', 6: 'story',
  7: 'story', 8: 'story', 9: 'story', 10: 'story', 11: 'story', 12: 'story',
  13: 'story', 14: 'story',
  15: 'activity', 16: 'activity', 17: 'activity', 18: 'activity',
  19: 'activity', 20: 'activity', 21: 'activity', 29: 'activity', 46: 'activity',
  22: 'questline', 23: 'questline', 24: 'questline', 25: 'questline',
  26: 'questline', 27: 'questline',
  28: 'collectible', 30: 'collectible', 31: 'collectible', 42: 'collectible',
  34: 'robbery', 39: 'robbery', 40: 'robbery', 41: 'robbery', 43: 'robbery',
  32: 'misc', 33: 'misc', 35: 'misc', 36: 'misc', 37: 'misc', 38: 'misc',
  44: 'misc', 45: 'misc', 47: 'misc', 48: 'misc', 49: 'misc', 50: 'misc',
  51: 'misc', 52: 'misc', 53: 'misc', 54: 'misc', 55: 'misc',
};

const KIND_LABEL = {
  story: 'Story', questline: 'Questline', collectible: 'Collectible',
  activity: 'Activity', robbery: 'Robbery', misc: 'Misc',
};

const GRADE_ORDER = { platinum: 0, gold: 1, silver: 2, bronze: 3 };

// Guides in our own words, one per trophy, each naming its sources.
// Anything the community has not pinned down yet says so plainly instead
// of inventing a location or a step.
const GUIDES = {
  1: { text: 'The platinum pops the moment the other 54 trophies are yours — there is nothing extra to do for it. Work the roadmap below in order and it arrives on its own.', src: ['pyx', 'exo'] },
  2: { text: 'Finish the opening mission, Gone Fishing — the first story mission — and the trophy pops at its end. Unmissable story progress.', src: ['pyx', 'exo'] },
  3: { text: 'Complete Chapter 1. Keep playing the story; the trophy pops when the chapter closes.', src: ['pyx', 'exo'] },
  4: { text: 'Complete Chapter 2. Story progress only — no side work is needed for it.', src: ['pyx', 'exo'] },
  5: { text: 'Complete Chapter 3. Story progress only.', src: ['pyx', 'exo'] },
  6: { text: 'Complete Chapter 4. Story progress only.', src: ['pyx', 'exo'] },
  7: { text: 'Complete the final mission. The story finale — finish it and the gold is yours.', src: ['pyx', 'exo'] },
  8: { text: 'Complete the mission Breakfast Run. A story mission — play it through to the end.', src: ['pyx', 'exo'] },
  9: { text: 'Complete the mission The Cartel Heist. A story mission; the trophy pops on completion.', src: ['pyx', 'exo'] },
  10: { text: 'Complete the mission Child\u2019s Play. A story mission.', src: ['pyx', 'exo'] },
  11: { text: 'Complete the mission Headliners. A story mission.', src: ['pyx', 'exo'] },
  12: { text: 'Complete the mission VCIA Takedown. A story mission.', src: ['pyx', 'exo'] },
  13: { text: 'Complete the mission Operation Savage Glory. A story mission.', src: ['pyx', 'exo'] },
  14: { text: 'Reach 100% completion — every story mission, stranger strand, activity, collectible and challenge the game counts. The in-game stats page shows your percentage, and this checklist tracks what is left. This is the long grind before the platinum.', src: ['pyx', 'psn'] },
  15: { text: 'Pull off 250 stunts — jumps, near misses and air time in vehicles all count toward the total. Chain stunts during free roam and the count climbs fast; the stats page tracks it.', src: ['pyx', 'psn'] },
  16: { text: 'Try each of the 9 activity types once — fishing, races, the shooting range, drone races, arcade, bowling and the rest. One try each is enough; you do not need to win.', src: ['pyx', 'psn'] },
  17: { text: 'Earn a gold medal in all 42 Shooting Range challenges. Learn each range\u2019s weapon pattern and replay challenges until every one shows gold.', src: ['pyx', 'psn'] },
  18: { text: 'Win a Top Fun Drone Race at every one of the 14 locations. Learn each course\u2019s corners; a win at each location counts.', src: ['pyx', 'psn'] },
  19: { text: 'Win 20 different races — road, off-road and water races all count as long as each is a different event.', src: ['pyx', 'psn'] },
  20: { text: 'Beat Cal in a fishing challenge. Fish the challenge spot and outscore Cal; heavier catches win.', src: ['pyx'] },
  21: { text: 'Complete one arcade game — any machine, any game, start to finish.', src: ['pyx'] },
  22: { text: 'Complete the final mission for Andy. Play Andy\u2019s strand through to its last mission.', src: ['pyx'] },
  23: { text: 'Complete the final mission for Kenton. Play Kenton\u2019s strand through to its last mission.', src: ['pyx'] },
  24: { text: 'Complete the final mission for Billy. Play Billy\u2019s strand through to its last mission.', src: ['pyx'] },
  25: { text: 'Complete 8 mission strands for strangers across Leonida. Pick up stranger missions as you find them and see each strand through to its end.', src: ['pyx', 'psn'] },
  26: { text: 'Complete the final mission for Randy. Play Randy\u2019s strand through to its last mission.', src: ['pyx'] },
  27: { text: 'Complete the final mission for Tyrone. Play Tyrone\u2019s strand through to its last mission.', src: ['pyx'] },
  28: { text: 'Meditate at all 18 spots across Leonida. Start early: one meditation spot is in Chapter 1 at Jason\u2019s house, and a spot left behind can stay missed — meditate whenever you see one.', src: ['pyx', 'psn'] },
  29: { text: 'Hunt a unique animal for Bret. Follow Bret\u2019s hunt strand; the unique animal is the target, not regular wildlife.', src: ['pyx'] },
  30: { text: 'Complete 3 Collectible Card sets. Cards are hidden across Leonida — collect full sets, three sets in total.', src: ['pyx', 'psn'] },
  31: { text: 'WAiNK It at 100 locations. Find the WAiNK spots and use the interaction at each — the counter tracks all 100.', src: ['pyx', 'psn'] },
  32: { text: 'Complete 50 challenges. Challenges span combat, driving and activities; work through the challenge list in the stats menu.', src: ['pyx', 'psn'] },
  33: { text: 'Lose a 4-star wanted level with your partner and escape the heat. Get the cops to 4 stars while your partner is with you, then break line of sight and stay hidden until it clears. It happens during a story moment with your partner, so treat it as missable.', src: ['pyx'] },
  34: { text: 'Rob 3 shops back-to-back with your partner without losing your wanted level. Chain three shop robberies in one run with your partner and keep moving between shops.', src: ['pyx'] },
  35: { text: 'Discover 100 vehicles. Drive or enter new vehicle models — each new model counts once.', src: ['pyx', 'psn'] },
  36: { text: 'Take down 5 enemies in a single use of Combat Focus. Group enemies first, then trigger Combat Focus and chain five takedowns before it ends.', src: ['pyx'] },
  37: { text: 'Make an unscheduled departure at VCIA. During the VCIA sequence, leave by an unscheduled route instead of the normal exit — a one-time moment, so treat it as missable.', src: ['pyx'] },
  38: { text: 'Deal with the Rhinos — the tanks. Take one on and survive the encounter; heavy weapons and cover help.', src: ['pyx'] },
  39: { text: 'Rob a jewelry store without being detected. Go in quiet, avoid cameras and guards, and leave before the alarm.', src: ['pyx'] },
  40: { text: 'Rob 5 bank vaults and escape. Plan each vault, then lose the cops after every one — five vaults in total.', src: ['pyx', 'psn'] },
  41: { text: 'Rob an armored truck and escape. Hit a truck on the road, grab the cash and lose the wanted level.', src: ['pyx'] },
  42: { text: 'Explore all 52 areas of Leonida. The map tracks visited areas — drive through every named area until the counter hits 52.', src: ['pyx', 'psn'] },
  43: { text: 'Rob an illegal operation belonging to each of the 9 gangs. One operation per gang — nine in total.', src: ['pyx', 'psn'] },
  44: { text: 'Enjoy a cocktail with a view on Ocean Beach. Sit at the Ocean Beach spot and order a cocktail.', src: ['pyx'] },
  45: { text: 'Smash your way out of a vehicle showroom in classic style. Drive through the showroom front and out the other side.', src: ['pyx'] },
  46: { text: 'Follow through at the Kolt & Associates bowling alley. Play a full game of bowling there.', src: ['pyx'] },
  47: { text: 'A partnership with mass appeal. A story moment with your partner — it pops on its own as the partnership plays out.', src: ['pyx'] },
  48: { text: 'Choices made, for better or worse. PSN tracks a count up to 500 choices — make story and side choices as they come; some choices only appear once, so treat it as missable.', src: ['pyx', 'psn'] },
  49: { text: 'Second time\u2019s the charm. PowerPyx lists this trophy as unconfirmed — its exact trigger is not yet pinned down by the community. Check PowerPyx\u2019s guide for the latest confirmed method before chasing it.', src: ['pyx'] },
  50: { text: 'What the hell just happened? Witness something strange in Leonida — an unexplained event. The community is still mapping where it triggers; check PowerPyx\u2019s guide for confirmed spots.', src: ['pyx'] },
  51: { text: 'Bowl \u2019em over with a melee drive-by. Knock someone down while doing a melee drive-by from a vehicle.', src: ['pyx'] },
  52: { text: 'Earn $250,000 laundering marked bills through your contacts. Run marked bills through your laundering contacts until $250,000 is clean.', src: ['pyx', 'psn'] },
  53: { text: 'Spend $100,000 across all shops. Buy clothes, food, weapons and upgrades — all shop spending counts.', src: ['pyx'] },
  54: { text: 'Purchase all 8 garage properties. Buy every garage on the market.', src: ['pyx', 'psn'] },
  55: { text: 'Register 10 vehicles to the Scooter Bros app. Register vehicles you own through the app until it hits 10.', src: ['pyx', 'psn'] },
};

// Trophies whose trigger the community has not confirmed yet.
const UNCONFIRMED = new Set([49]);

let trophies = [];
let earned = loadProgress();
let selectedId = null;
const filters = { q: '', grade: '', kind: '', sort: 'grade', hideEarned: false, spoiler: false };

const $ = (id) => document.getElementById(id);
const listEl = $('list');
const detailEl = $('detail');

function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

function isHidden(trophy) {
  return filters.spoiler && KIND_OF[trophy.id] === 'story' && !earned.has(trophy.id);
}

function visibleTrophies() {
  const q = filters.q.trim().toLowerCase();
  let out = trophies.filter((t) => {
    if (filters.grade && t.grade !== filters.grade) return false;
    if (filters.kind && KIND_OF[t.id] !== filters.kind) return false;
    if (filters.hideEarned && earned.has(t.id)) return false;
    if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))) return false;
    return true;
  });
  if (filters.sort === 'name') {
    out = [...out].sort((a, b) => a.name.localeCompare(b.name));
  } else if (filters.sort === 'stage') {
    out = [...out].sort((a, b) => stepOf(a.id) - stepOf(b.id) || a.id - b.id);
  } else {
    out = [...out].sort((a, b) => GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade] || a.id - b.id);
  }
  return out;
}

function tagHtml(trophy) {
  const tags = [`<span class="tag grade-${trophy.grade}">${gradeLabel(trophy.grade)}</span>`];
  tags.push(`<span class="tag">${KIND_LABEL[KIND_OF[trophy.id]]}</span>`);
  tags.push(`<span class="tag">Stage ${stepOf(trophy.id)}</span>`);
  if (isMissable(trophy.id)) tags.push('<span class="tag missable">Missable</span>');
  if (UNCONFIRMED.has(trophy.id)) tags.push('<span class="tag unconfirmed">Unconfirmed</span>');
  return tags.join('');
}

function renderProgress() {
  const got = earned.size;
  const pct = Math.round((got / trophies.length) * 100);
  $('progressFill').style.width = `${pct}%`;
  $('progressText').textContent = `${got} of ${trophies.length} earned · ${pct}%`;
}

function renderList() {
  const shown = visibleTrophies();
  $('countLine').textContent = `Showing ${shown.length} of ${trophies.length} trophies · ${earned.size} earned`;
  listEl.innerHTML = '';
  for (const t of shown) {
    const row = document.createElement('div');
    row.className = 'trophy' + (earned.has(t.id) ? ' earned' : '') + (t.id === selectedId ? ' selected' : '');
    row.setAttribute('role', 'option');
    row.setAttribute('aria-selected', String(t.id === selectedId));

    const check = document.createElement('button');
    check.type = 'button';
    check.className = 'check';
    check.setAttribute('aria-label', (earned.has(t.id) ? 'Mark not earned: ' : 'Mark earned: ') + t.name);
    check.textContent = earned.has(t.id) ? '✓' : '';
    check.addEventListener('click', (ev) => {
      ev.stopPropagation();
      toggleEarned(t.id);
    });

    const body = document.createElement('button');
    body.type = 'button';
    body.className = 'body';
    body.addEventListener('click', () => selectTrophy(t.id));
    if (isHidden(t)) {
      body.innerHTML = '<span class="name">Hidden story trophy</span>'
        + '<span class="desc hidden-note">Hidden until earned — spoiler-safe is on.</span>'
        + `<span class="meta">${tagHtml(t)}</span>`;
    } else {
      body.innerHTML = `<span class="name">${escapeHtml(t.name)}</span>`
        + `<span class="desc">${escapeHtml(t.description)}</span>`
        + `<span class="meta">${tagHtml(t)}</span>`;
    }

    row.append(check, body);
    listEl.append(row);
  }
  if (shown.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'count-line';
    empty.textContent = 'No trophies match these filters — clear the search or a filter to see them again.';
    listEl.append(empty);
  }
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function sourceLinks(codes) {
  return codes
    .map((c) => `<a href="${SOURCES[c].url}" target="_blank" rel="noopener">${SOURCES[c].label}</a>`)
    .join(' · ');
}

function renderDetail() {
  const t = trophies.find((x) => x.id === selectedId);
  if (!t) {
    detailEl.innerHTML = '<h2>Pick a trophy</h2>'
      + '<p>Select any trophy on the left to see its official description, a guide in our own words, and the sources behind it. Every guide names where its facts come from.</p>';
    return;
  }
  const guide = GUIDES[t.id];
  const hidden = isHidden(t);
  const got = earned.has(t.id);
  let html = `<h2>${hidden ? 'Hidden story trophy' : escapeHtml(t.name)}</h2>`;
  html += `<p class="official">${hidden ? 'Hidden until earned — spoiler-safe is on.' : escapeHtml(t.description)}</p>`;
  html += `<div class="meta">${tagHtml(t)}</div>`;
  html += '<h3>Guide</h3>';
  html += hidden
    ? '<p>The guide stays hidden until this trophy is earned.</p>'
    : `<p>${escapeHtml(guide.text)}</p>`;
  if (!hidden) {
    html += '<h3>Sources</h3>';
    html += `<p class="sources">${sourceLinks(guide.src)}</p>`;
  }
  if (isMissable(t.id)) {
    const note = MISSABLE.find((m) => m.id === t.id).note;
    html += `<h3>Missable</h3><p>${escapeHtml(note)}</p>`;
  }
  if (UNCONFIRMED.has(t.id)) {
    html += '<h3>Unconfirmed</h3><p>The community has not pinned this one down yet — check the cited guide for the latest confirmed method.</p>';
  }
  html += `<h3>Roadmap</h3><p>Stage ${stepOf(t.id)} of 3 — ${escapeHtml(ROADMAP_STEPS[stepOf(t.id) - 1].title)}.</p>`;
  html += `<button type="button" class="earn-toggle${got ? ' earned' : ''}" id="earnToggle">${got ? '✓ Earned — unmark' : 'Mark as earned'}</button>`;
  detailEl.innerHTML = html;
  $('earnToggle').addEventListener('click', () => toggleEarned(t.id));
}

function renderRoadmap() {
  const counts = stepCounts(earned);
  $('steps').innerHTML = ROADMAP_STEPS.map((step, i) => {
    const c = counts[i];
    return `<article class="step"><h3>Stage ${step.n} — ${escapeHtml(step.title)}</h3>`
      + `<span class="chip${c.done ? ' done' : ''}">${c.done ? '✓ Done — ' : ''}${c.earned} of ${c.total} earned</span>`
      + `<p>${escapeHtml(step.text)}</p><p>${escapeHtml(step.hours)}</p></article>`;
  }).join('');
  $('missList').innerHTML = '<h3>Missable trophies — don\u2019t let these pass you by</h3><ul>'
    + MISSABLE.map((m) => `<li><strong>${escapeHtml(m.name)}</strong> — ${escapeHtml(m.note)}</li>`).join('')
    + '</ul>';
}

function renderAll() {
  renderProgress();
  renderList();
  renderDetail();
  renderRoadmap();
}

function toggleEarned(id) {
  if (earned.has(id)) earned.delete(id);
  else earned.add(id);
  saveProgress(earned);
  renderAll();
}

function selectTrophy(id) {
  selectedId = id;
  renderList();
  renderDetail();
}

function summaryText() {
  const byGrade = {};
  for (const t of trophies) {
    byGrade[t.grade] = byGrade[t.grade] || [0, 0];
    byGrade[t.grade][1] += 1;
    if (earned.has(t.id)) byGrade[t.grade][0] += 1;
  }
  const parts = ['Vice Trophy Tracker', `${earned.size}/${trophies.length} earned (${Math.round((earned.size / trophies.length) * 100)}%)`];
  for (const g of ['platinum', 'gold', 'silver', 'bronze']) {
    if (byGrade[g]) parts.push(`${gradeLabel(g)} ${byGrade[g][0]}/${byGrade[g][1]}`);
  }
  return parts.join(' · ');
}

async function copySummary() {
  const text = summaryText();
  try {
    await navigator.clipboard.writeText(text);
    $('copyBtn').textContent = 'Copied!';
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.append(ta);
    ta.select();
    try { document.execCommand('copy'); $('copyBtn').textContent = 'Copied!'; } catch { /* clipboard unavailable */ }
    ta.remove();
  }
  setTimeout(() => { $('copyBtn').textContent = 'Copy summary'; }, 1500);
}

function download(filename, text) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function bindToolbar() {
  $('search').addEventListener('input', (ev) => { filters.q = ev.target.value; renderList(); });
  $('gradeFilter').addEventListener('change', (ev) => { filters.grade = ev.target.value; renderList(); });
  $('kindFilter').addEventListener('change', (ev) => { filters.kind = ev.target.value; renderList(); });
  $('sortSelect').addEventListener('change', (ev) => { filters.sort = ev.target.value; renderList(); });
  $('hideEarned').addEventListener('change', (ev) => { filters.hideEarned = ev.target.checked; renderList(); });
  $('spoilerToggle').addEventListener('change', (ev) => { filters.spoiler = ev.target.checked; renderList(); renderDetail(); });
  $('exportBtn').addEventListener('click', () => download('vice-trophy-progress.json', exportProgress(earned)));
  $('importBtn').addEventListener('click', () => $('importFile').click());
  $('importFile').addEventListener('change', async (ev) => {
    const file = ev.target.files[0];
    if (!file) return;
    try {
      earned = parseProgress(await file.text());
      saveProgress(earned);
      renderAll();
    } catch (err) {
      alert('Could not import that file: ' + err.message);
    }
    ev.target.value = '';
  });
  $('copyBtn').addEventListener('click', copySummary);
  $('resetBtn').addEventListener('click', () => {
    if (confirm('Clear all saved progress?')) {
      earned = clearProgress();
      renderAll();
    }
  });
}

function bindKeyboard() {
  listEl.addEventListener('keydown', (ev) => {
    const rows = [...listEl.querySelectorAll('.trophy .body')];
    const i = rows.indexOf(document.activeElement);
    if (i < 0) return;
    if (ev.key === 'ArrowDown' && i < rows.length - 1) { ev.preventDefault(); rows[i + 1].focus(); }
    else if (ev.key === 'ArrowUp' && i > 0) { ev.preventDefault(); rows[i - 1].focus(); }
    else if (ev.key === 'Home') { ev.preventDefault(); rows[0].focus(); }
    else if (ev.key === 'End') { ev.preventDefault(); rows[rows.length - 1].focus(); }
    else if (ev.key === 'Enter') { ev.preventDefault(); rows[i].click(); }
  });
}

function applyDeepLinks() {
  const params = new URLSearchParams(location.search);
  const seeded = params.get('earn');
  if (seeded) {
    for (const part of seeded.split(',')) {
      const n = Number.parseInt(part, 10);
      if (Number.isInteger(n) && n >= 1 && n <= 55) earned.add(n);
    }
    saveProgress(earned);
  }
  if (params.get('grade')) { filters.grade = params.get('grade'); $('gradeFilter').value = filters.grade; }
  if (params.get('kind')) { filters.kind = params.get('kind'); $('kindFilter').value = filters.kind; }
  if (params.get('spoiler') === '1') { filters.spoiler = true; $('spoilerToggle').checked = true; }
  const t = Number.parseInt(params.get('t') || '', 10);
  if (Number.isInteger(t) && t >= 1 && t <= 55) selectedId = t;
}

async function boot() {
  bindToolbar();
  bindKeyboard();
  try {
    const res = await fetch('data/trophies.json');
    if (!res.ok) throw new Error('trophy list did not load');
    const data = await res.json();
    trophies = Array.isArray(data) ? data : data.trophies;
  } catch (err) {
    $('countLine').textContent = 'The trophy list could not be loaded. Check the app files and reload.';
    window.__shotReady = true;
    return;
  }
  applyDeepLinks();
  renderAll();
  // The page grows as the checklist renders, so a #roadmap link from before
  // the render would point at the wrong place: scroll to it once laid out.
  if (location.hash) {
    const target = document.querySelector(location.hash);
    if (target) target.scrollIntoView();
  }
  window.__shotReady = true;
}

boot();
