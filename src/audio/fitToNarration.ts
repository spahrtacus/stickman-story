import {parseMedia} from "@remotion/media-parser";
import {staticFile} from "remotion";
import {FPS} from "../styles/palette";

/*
 * Fit a multi-scene film to the length of its narration.
 *
 * measureNarration() reads the real length of an audio file in public/ (for example "audio/my-narration.mp3").
 * fitScenes() stretches or shrinks the scene lengths to that total, keeping each scene's share of the film.
 * remapFrame() moves a frame (a caption start, say) from the original timing to the fitted timing,
 * so it stays at the same point inside its scene.
 *
 * Use them in a composition's calculateMetadata (see Example03 in src/Root.tsx), so the video is sized to the
 * narration every time you open Studio or render. No hand-entered frame numbers.
 */

/** Frames of silence added after the narration ends, so the last word is never cut. */
export const TAIL_FRAMES = 15;

/** Length of an audio file in public/, in frames at FPS (rounded up). */
export const measureNarration = async (file: string): Promise<number> => {
  const {slowDurationInSeconds} = await parseMedia({
    src: staticFile(file),
    fields: {slowDurationInSeconds: true},
    acknowledgeRemotionLicense: true,
  });
  return Math.ceil(slowDurationInSeconds * FPS);
};

/** Scale scene lengths so they add up to `total`. The last scene absorbs rounding. Every scene keeps at least 1 frame. */
export const fitScenes = (lens: number[], total: number): number[] => {
  const base = lens.reduce((a, b) => a + b, 0);
  const out = lens.map((l) => Math.max(1, Math.round((l * total) / base)));
  const used = out.slice(0, -1).reduce((a, b) => a + b, 0);
  out[out.length - 1] = Math.max(1, total - used);
  return out;
};

/** Start frame of each scene, given the scene lengths. */
export const sceneStarts = (lens: number[]): number[] => lens.map((_, i) => lens.slice(0, i).reduce((a, b) => a + b, 0));

/** Move a frame from the original scene timing to the fitted one, keeping its relative position inside its scene. */
export const remapFrame = (f: number, from: number[], to: number[]): number => {
  const a = sceneStarts(from);
  const b = sceneStarts(to);
  let i = a.length - 1;
  while (i > 0 && f < a[i]) i--;
  return Math.round(b[i] + ((f - a[i]) * to[i]) / from[i]);
};
