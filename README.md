# Vice Trophy Tracker — GTA VI trophy guide & checklist

[![make.fun bounty](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![make.fun rank](https://make.fun/badge/gta6-trophy-guide-01/ramavailable/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![make.fun reward](https://make.fun/badge/gta6-trophy-guide-01/ramavailable/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline guide and tracker for all **55 Grand Theft Auto VI trophies on PlayStation 5** (1 platinum, 2 gold, 6 silver, 46 bronze) — entered in the [make.fun bounty "Build the best GTA 6 trophy guide"](https://make.fun/bounty/gta6-trophy-guide-01).

## What it is

- **Every trophy** with its official name, description and grade as PlayStation publishes them.
- **A guide for each trophy, written for this tracker in its own words**, with its sources named beside it (PowerPyx, Push Square, PSNProfiles / Exophase). One trophy, *Bad Luck, I Guess*, is still unconfirmed by every guide — it is marked as such rather than guessed at.
- **A roadmap to the platinum** in 3 steps (~200 hours, difficulty 4/10), with the one possibly-missable trophy flagged: *Positive Mental Attitude* has a Chapter 1 meditation that can be missed.
- **A tracker**: tick trophies off, progress saves in the browser (localStorage), export it to a file and import it back. Filters by grade and kind (story, missable, collectibles, activities, robberies, questlines, misc), search, hide-earned, and a spoiler-safe mode that hides story trophy names until earned.

## Run it

No build step, no network. Serve `app/` with any static server and open `index.html`:

```sh
node serve.ts   # serves app/ at http://localhost:8080
```

## Layout

- `app/` — the static web app (`index.html`, `style.css`, `app.js`, `store.js`, `roadmap.js`, `data/trophies.json`)
- `screenshots/` — 4 screenshots of the app
- `main.ts` — copies `app/` + `screenshots/` to `/output` and writes `dossier.json` (Node 22, stdlib only)
- `vendor/makefun-frontend.ts` — the kit's dossier library, unchanged

## License

MIT — see [LICENSE](LICENSE).
