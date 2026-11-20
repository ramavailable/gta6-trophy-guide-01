// Vice Trophy Tracker — the entry program (Node 22, standard library only).
// Hands the guide in: copies app/ and screenshots/ from beside this file to
// /output (or MAKEFUN_OUTPUT_DIR outside the grader) and writes
// /output/dossier.json with the vendored make.fun library. The scorer
// requires the dossier to be byte for byte what its own copy of the library
// writes, so this file only copies files and calls the library.
//
// Run it: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const MAX_SCREENSHOT_BYTES = 262144;

function fail(message) {
  throw new Error(`main.ts: ${message}`);
}

function countFiles(dir) {
  let n = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    n += entry.isDirectory() ? countFiles(join(dir, entry.name)) : 1;
  }
  return n;
}

function checkInputs() {
  const indexHtml = join(here, 'app', 'index.html');
  if (!existsSync(indexHtml)) fail('app/index.html is missing');
  const trophies = join(here, 'app', 'data', 'trophies.json');
  if (!existsSync(trophies)) fail('app/data/trophies.json is missing');
  const list = JSON.parse(readFileSync(trophies, 'utf8'));
  const items = Array.isArray(list) ? list : list.trophies;
  if (!Array.isArray(items) || items.length !== 55) {
    fail(`app/data/trophies.json must name all 55 trophies, found ${Array.isArray(items) ? items.length : 'none'}`);
  }
  const shotsDir = join(here, 'screenshots');
  if (!existsSync(shotsDir)) fail('screenshots/ is missing');
  const shots = readdirSync(shotsDir).filter((f) => !f.startsWith('.'));
  if (shots.length < 3 || shots.length > 4) fail(`screenshots/ must hold 3 or 4 images, found ${shots.length}`);
  for (const shot of shots) {
    const size = statSync(join(shotsDir, shot)).size;
    if (size > MAX_SCREENSHOT_BYTES) fail(`screenshots/${shot} is ${size} bytes, over the 256 KiB cap`);
  }
  return shots.length;
}

const shotCount = checkInputs();

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps: only text_max_bytes shapes the bytes; the others
// refuse an entry the scorer would refuse (more than 4 screenshots or one
// over 256 KiB; more than 993 files and directories in app/ or 48 MiB of
// app files).
const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(out, 'dossier.json'), dossier);

const appFiles = countFiles(join(out, 'app'));
console.log(
  `Vice Trophy Tracker handed in: ${appFiles} app files, ${shotCount} screenshots, dossier ${dossier.length} bytes.`,
);
