// Roadmap to the platinum, in three steps, built from the official trophy
// descriptions and the PowerPyx roadmap. Each step carries the trophies it
// covers as chips; clicking a chip jumps to that trophy's guide in the
// checklist. Every step also shows how many of its trophies are already
// earned, so a reader can see at a glance which step they are on.

export const STEPS = [
  {
    n: 1,
    title: 'Play the story — and guard the one missable',
    hours: '60–80 hours',
    text: 'Just play the story through and enjoy it. The 12 story trophies and the 6 character questlines (Andy, Kenton, Billy, Randy, Tyrone, Bret) all stay open after the credits, so there is no rush — except for one meditation. Do the Chapter 1 meditation for Positive Mental Attitude while you are there: it is the only trophy that might be missable. Scan vehicles and study animals as you go, since that progress already counts toward 100%.',
    ids: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 22, 23, 24, 26, 27, 28, 29],
  },
  {
    n: 2,
    title: '100% Completion checklist and challenges',
    hours: 'about 100 hours',
    text: 'After the story, open Progress, then Stats, then 100% Completion. The bar is lenient — closer to 60% of true completion: any 100 optional missions, 200 of 277 vehicles, 100 of 255 animals, 300 stunts, any 70 of 80 challenges. Only robberies, underwater discoveries, shooting ranges, drone races and Bret’s quests need to be finished in full. Nothing in this step is missable.',
    ids: [14, 15, 17, 18, 30, 31, 32, 35, 40, 42, 43, 52, 54, 55],
  },
  {
    n: 3,
    title: 'Strangers & Freaks and misc cleanup',
    hours: 'about 10 hours',
    text: 'Most trophies are done by now. Finish the 8 counting Strangers & Freaks strands (Kirk, Kyle, Yago and Pilot Pete are confirmed), then mop up the one-offs: the UFO easter egg, the Banshee showroom smash, the VCIA plane theft, the tank at Mile Zero, and the money trophies. The platinum pops with the last one.',
    ids: [1, 16, 19, 20, 21, 25, 33, 34, 36, 37, 38, 39, 41, 44, 45, 46, 47, 48, 49, 50, 51, 53],
  },
];

// Which roadmap step a trophy belongs to, from its stage in the data file.
export function stepFor(trophy) {
  return STEPS.find((step) => step.n === trophy.stage) ?? null;
}

// One trophy chip inside a step card: its name, ticked when earned.
function stepChip(trophy, earned, onPick) {
  const chip = document.createElement('button');
  chip.type = 'button';
  chip.className = 'step-chip' + (earned.has(trophy.id) ? ' chip-earned' : '');
  chip.textContent = (earned.has(trophy.id) ? '✓ ' : '') + trophy.name;
  chip.addEventListener('click', () => onPick(trophy.id));
  return chip;
}

// Render the three steps into container. byId maps trophy ids to trophies,
// earned is the set of earned ids, and onPick(id) runs when a reader clicks
// a trophy chip.
export function renderSteps(container, byId, earned, onPick) {
  container.replaceChildren();
  for (const step of STEPS) {
    const done = step.ids.filter((id) => earned.has(id)).length;
    const card = document.createElement('article');
    card.className = 'step' + (done === step.ids.length ? ' step-done' : '');

    const head = document.createElement('h3');
    head.textContent = `Step ${step.n} — ${step.title}`;
    const meta = document.createElement('p');
    meta.className = 'step-meta';
    meta.textContent = `${step.hours} · ${done} of ${step.ids.length} earned`;
    const text = document.createElement('p');
    text.textContent = step.text;

    const chips = document.createElement('div');
    chips.className = 'step-trophies';
    for (const id of step.ids) {
      const trophy = byId.get(id);
      if (!trophy) continue;
      chips.append(stepChip(trophy, earned, onPick));
    }
    card.append(head, meta, text, chips);
    container.append(card);
  }
}
