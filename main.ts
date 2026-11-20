// Vice Trophy Tracker — make.fun entry for gta6-trophy-guide-01 (Node 22,
// standard library only). The guide is this directory's app/ folder: plain
// static files a browser opens at app/index.html (ES modules, CSS, no build
// step), fully offline — it loads nothing over the network, and its trophy
// list and guides live in app/data/trophies.json.
//
// This program hands the guide in: it copies app/ and screenshots/ from
// beside this file to /output and writes /output/dossier.json, the summary
// the judge reads (the screenshots, the first load's files and bytes, and
// the source), with the vendored make.fun library. Leave
// vendor/makefun-frontend.ts as it is: the scorer requires dossier.json to
// be byte for byte what its own copy writes.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const appDir = join(here, 'app');
const shotsDir = join(here, 'screenshots');

function fail(message) {
  console.error(`main.ts: ${message}`);
  process.exit(1);
}

// Count every file and directory under a folder, so the summary can say
// what was handed in (and so a stray file shows up before the gate sees it).
function countEntries(dir) {
  let files = 0;
  let dirs = 0;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      dirs += 1;
      const inner = countEntries(path);
      files += inner.files;
      dirs += inner.dirs;
    } else {
      files += 1;
    }
  }
  return { files, dirs };
}

// Preflight: refuse to hand in a broken entry instead of letting the gate
// find out. The scorer's own caps (reference/gate.json): at most 4
// screenshots, each at most 256 KiB; app/ at most 993 files and directories
// and 48 MiB.
if (!existsSync(join(appDir, 'index.html'))) fail('app/index.html is missing');
if (!existsSync(join(appDir, 'data', 'trophies.json'))) fail('app/data/trophies.json is missing');
if (!existsSync(shotsDir)) fail('screenshots/ is missing');
const shots = readdirSync(shotsDir).filter((name) => !name.startsWith('.'));
if (shots.length < 3 || shots.length > 4) fail(`expected 3 or 4 screenshots, found ${shots.length}`);
for (const shot of shots) {
  const size = statSync(join(shotsDir, shot)).size;
  if (size > 262144) fail(`screenshots/${shot} is ${size} bytes, over the 256 KiB cap`);
}

mkdirSync(out, { recursive: true });
cpSync(appDir, join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

// Only text_max_bytes shapes the bytes; the other caps refuse an entry the
// scorer would refuse, so a hand-in that gets this far already fits them.
const dossier = buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 });
if (!dossier || Buffer.byteLength(dossier) === 0) fail('buildDossier returned an empty dossier');
const dossierPath = join(out, 'dossier.json');
writeFileSync(dossierPath, dossier);

// Confirm the hand-in landed: a missing or empty dossier would fail the
// gate silently, so say so out loud while the run is still visible.
const appCount = countEntries(join(out, 'app'));
console.log(`copied ${appCount.files} app files (${appCount.dirs} dirs) + ${shots.length} screenshots`);
console.log(`wrote ${dossierPath} (${Buffer.byteLength(dossier)} bytes)`);
