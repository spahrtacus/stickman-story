// Print the length of a narration file in seconds and frames, plus how Example03's scenes would be fitted to it.
// Usage: npm run narration -- public/audio/my-narration.mp3
// Example03 does this fitting by itself when you pass the narration prop; use this to plan your own scenes.

import {parseMedia} from "@remotion/media-parser";
import {nodeReader} from "@remotion/media-parser/node";
import path from "node:path";

const FPS = 30;
const TAIL_FRAMES = 15; // keep in sync with src/audio/fitToNarration.ts
const BASE_SCENES = [90, 120, 120]; // keep in sync with src/scenes/Example03MiniDocumentary.tsx

const file = process.argv[2];
if (!file) {
  console.error("Usage: npm run narration -- public/audio/<file>.mp3");
  process.exit(1);
}

const {slowDurationInSeconds: sec} = await parseMedia({
  src: path.resolve(file),
  reader: nodeReader,
  fields: {slowDurationInSeconds: true},
  acknowledgeRemotionLicense: true,
});

const frames = Math.ceil(sec * FPS);
const total = frames + TAIL_FRAMES;
const base = BASE_SCENES.reduce((a, b) => a + b, 0);
const fitted = BASE_SCENES.map((l) => Math.max(1, Math.round((l * total) / base)));
fitted[fitted.length - 1] = total - fitted.slice(0, -1).reduce((a, b) => a + b, 0);

console.log(`File:      ${file}`);
console.log(`Length:    ${sec.toFixed(2)} s = ${frames} frames at ${FPS} fps`);
console.log(`Film:      ${total} frames (${(total / FPS).toFixed(2)} s, with a ${TAIL_FRAMES}-frame tail)`);
console.log(`Example03: scenes ${fitted.join(" + ")} frames`);
console.log(`Render:    npm run render -- Example03-MiniDocumentary out/mini.mp4 --props='{"narration":"${path.relative("public", path.resolve(file)).split(path.sep).join("/")}"}'`);
