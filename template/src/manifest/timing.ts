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
 * Frame (scene-relative) at which the nth occurrence of a word, or of a
 * multi-word phrase ("encryption at host"), starts being spoken.
 * Azure sometimes returns several spoken words as one boundary token
 * ("99.99 percent", "72 hours"), so tokens are split on spaces and matched on
 * the normalized character stream: "72 hours" and "72hours" both resolve.
 * Returns 0 and warns if not found, so a typo degrades gracefully; the layout
 * sweep reports every such warning.
 */
export const wordFrame = (
  words: WordToken[] | null,
  query: string,
  occurrence = 1,
): number => {
  if (!words) return 0;
  const toks = words
    .filter((w) => !w.punct)
    .flatMap((w) => w.text.split(/\s+/).filter(Boolean).map((part) => ({...w, text: part})));
  const keys = toks.map((w) => stripPunct(w.text));
  const target = stripPunct(query);
  let seen = 0;
  if (target) {
    for (let i = 0; i < keys.length; i++) {
      if (!keys[i] || !target.startsWith(keys[i])) continue;
      let acc = '';
      for (let j = i; j < keys.length && acc.length < target.length; j++) {
        acc += keys[j];
        if (acc === target) {
          seen += 1;
          if (seen === occurrence) return msToFrame(toks[i].startMs, manifest.fps);
          break;
        }
        if (!target.startsWith(acc)) break;
      }
    }
  }
  // eslint-disable-next-line no-console
  console.warn(`wordFrame: "${query}" (occurrence ${occurrence}) not found`);
  return 0;
};
