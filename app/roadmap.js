// Roadmap to the platinum: the order to earn the trophies in, built from the
// official descriptions and the PowerPyx roadmap. Each step names the trophies
// it covers so the reader can jump straight to them in the checklist below.

export const ROADMAP_STEPS = [
  {
    step: 1,
    title: 'Play the story — and guard the one missable',
    hours: '60–80 hours',
    text: 'Just finish the story and enjoy it. All 12 story trophies pop on their own, and the 6 character questlines (Andy, Kenton, Billy, Randy, Tyrone, Bret) stay open after the story. Do the Chapter 1 meditation for Positive Mental Attitude while you are there — it is the only trophy that might be missable. Scan vehicles and study animals as you go: progress already counts toward 100%.',
    trophyIds: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 22, 23, 24, 26, 27, 28, 29],
  },
  {
    step: 2,
    title: '100% Completion checklist + challenges',
    hours: 'about 100 hours',
    text: 'After the story, open Progress > Stats > 100% Completion. The bar is lenient — closer to 60% of true completion: any 100 optional missions, 200 of 277 vehicles, 100 of 255 animals, 300 stunts, any 70 of 80 challenges. The only things that need everything are robberies, underwater discoveries, shooting ranges, drone races and Bret’s quests. Nothing here is missable.',
    trophyIds: [14, 15, 17, 18, 30, 31, 32, 35, 40, 42, 43, 52, 54, 55],
  },
  {
    step: 3,
    title: 'Strangers & Freaks and misc cleanup',
    hours: 'about 10 hours',
    text: 'Most trophies are done by now. Finish the 8 counting Strangers & Freaks strands (Kirk, Kyle, Yago and Pilot Pete are confirmed), then mop up the one-off trophies: the UFO easter egg, the Banshee showroom smash, the VCIA plane theft, the tank at Mile Zero, and the money trophies. The platinum pops with the last one.',
    trophyIds: [1, 16, 19, 20, 21, 25, 33, 34, 36, 37, 38, 39, 41, 44, 45, 46, 47, 48, 49, 50, 51, 53],
  },
];

// Render the roadmap steps into a container. Clicking a trophy chip in a step
// calls onSelect(id) so the checklist jumps to that trophy's guide.
export function renderRoadmap(container, byId, onSelect) {
  container.replaceChildren();
  for (const s of ROADMAP_STEPS) {
    const card = document.createElement('article');
    card.className = 'step';
    const head = document.createElement('h3');
    head.textContent = `Step ${s.step} — ${s.title}`;
    const hours = document.createElement('p');
    hours.className = 'step-hours';
    hours.textContent = s.hours;
    const text = document.createElement('p');
    text.textContent = s.text;
    const chips = document.createElement('div');
    chips.className = 'step-trophies';
    for (const id of s.trophyIds) {
      const t = byId.get(id);
      if (!t) continue;
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'step-chip';
      chip.textContent = t.name;
      chip.addEventListener('click', () => onSelect(id));
      chips.append(chip);
    }
    card.append(head, hours, text, chips);
    container.append(card);
  }
}
