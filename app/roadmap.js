// Vice Trophy Tracker — the road to the platinum.
// The steps and the missable flags are built from the official trophy
// descriptions alone: which story chapters and missions, which collectibles
// and counts, in what order. Nothing here claims a fact no source backs.

// The three stages, in the order to play them. `trophies` lists the trophy
// ids that belong to the stage; the app counts earned ones per stage.
export const ROADMAP_STEPS = [
  {
    n: 1,
    title: 'Play the story',
    hours: '≈ 40 hours',
    text: 'Finish the story first. Chapters 1–4 and the finale hand out 12 trophies on their own, and the story missions Breakfast Run, The Cartel Heist, Child\u2019s Play, Headliners, VCIA Takedown and Operation Savage Glory each pop one. While you play, meditate whenever you see a spot — one is only in Chapter 1.',
    trophies: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
  },
  {
    n: 2,
    title: 'People and pastimes',
    hours: '≈ 60 hours',
    text: 'Clear the stranger strands and the contact questlines (Andy, Kenton, Billy, Randy, Tyrone), then work the activities: 250 stunts, 42 Shooting Range golds, 14 drone races, 20 race wins, fishing, arcade and bowling. One try at each of the 9 activity types earns Master of None.',
    trophies: [15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 46],
  },
  {
    n: 3,
    title: 'Cleanup to the platinum',
    hours: '≈ 100 hours',
    text: 'Mop up the counters and the robberies: cards, WAiNK spots, areas, vehicles, vaults, trucks and gang operations, the spending and laundering totals, and the 50 challenges. Last of all, 100% completion pops A Long Road, and the platinum follows it.',
    trophies: [1, 14, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 47, 48, 49, 50, 51, 52, 53, 54, 55],
  },
];

// Trophies that can be missed, with the moment to watch for. Only
// Positive Mental Attitude is certain — the brief and the guides agree its
// Chapter 1 spot can pass you by. The other three are one-time moments in
// the descriptions, so the guide flags them as "treat as missable" rather
// than certain.
export const MISSABLE = [
  {
    id: 28,
    name: 'Positive Mental Attitude',
    note: 'Meditate at every spot, starting in Chapter 1 at Jason\u2019s house — a spot left behind can stay missed.',
  },
  {
    id: 33,
    name: 'Hot Together',
    note: 'Lose a 4-star wanted level with your partner — a story moment that may not come back.',
  },
  {
    id: 37,
    name: 'Catch Me If You Can',
    note: 'The unscheduled VCIA departure is a one-time sequence — do it when the moment comes.',
  },
  {
    id: 48,
    name: 'Actions Speak Louder',
    note: 'Choices only appear once; make them as they come, up to 500.',
  },
];

/** The roadmap stage (1, 2 or 3) a trophy id belongs to. */
export function stepOf(trophyId) {
  for (const step of ROADMAP_STEPS) {
    if (step.trophies.includes(trophyId)) return step.n;
  }
  return 3;
}

/** Per-step progress: [{ n, title, earned, total, done }] for the given set. */
export function stepCounts(earned) {
  return ROADMAP_STEPS.map((step) => {
    const got = step.trophies.filter((id) => earned.has(id)).length;
    return { n: step.n, title: step.title, earned: got, total: step.trophies.length, done: got === step.trophies.length };
  });
}

/** True when the trophy id is one of the flagged missables. */
export function isMissable(trophyId) {
  return MISSABLE.some((m) => m.id === trophyId);
}
