import rawManifest from '../../scenes.json';
import type {Manifest, SceneEntry, WordToken} from './types';

export const manifest = rawManifest as Manifest;

export const msToFrame = (ms: number, fps: number): number =>
  Math.round((ms / 1000) * fps);

export const sceneFrames = (scene: SceneEntry, fps: number): number =>
  Math.ceil((scene.durationSec + scene.padOutSec) * fps);

export const chapterScenes = (chapterId: string): SceneEntry[] =>
  manifest.scenes.filter((s) => s.chapter === chapterId);

export const chapterDurationFrames = (chapterId: string): number =>
  chapterScenes(chapterId).reduce((sum, s) => sum + sceneFrames(s, manifest.fps), 0);

export const totalDurationFrames = (): number =>
  manifest.chapters.reduce((sum, ch) => sum + chapterDurationFrames(ch.id), 0);

const stripPunct = (s: string) => s.replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();

/**
 * Frame (scene-relative) at which the nth occurrence of a word is spoken.
 * Returns 0 and warns if not found, so a typo degrades gracefully.
 */
export const wordFrame = (
  words: WordToken[] | null,
  query: string,
  occurrence = 1,
): number => {
  if (!words) return 0;
  const target = stripPunct(query);
  let seen = 0;
  for (const w of words) {
    if (!w.punct && stripPunct(w.text) === target) {
      seen += 1;
      if (seen === occurrence) return msToFrame(w.startMs, manifest.fps);
    }
  }
  // eslint-disable-next-line no-console
  console.warn(`wordFrame: "${query}" (occurrence ${occurrence}) not found`);
  return 0;
};
