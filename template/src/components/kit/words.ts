import {useJson} from '../../manifest/useJson';
import {wordFrame} from '../../manifest/timing';
import type {WordToken} from '../../manifest/types';

/**
 * Word-keyed timing for one scene. `at('redis')` is the scene-relative frame
 * where "redis" is first spoken; `at('event hubs', 2, -6)` is six frames
 * before the second occurrence of the phrase. Matching is wordFrame's (phrases,
 * merged boundary tokens). Common words ("the", "nothing") often match an
 * earlier occurrence than you mean: prefer a distinctive phrase or pass the
 * occurrence. `end` is the frame where the last word ends.
 */
export interface SceneWords {
  words: WordToken[] | null;
  at: (query: string, occurrence?: number, offsetFrames?: number) => number;
  end: number;
}

export const useSceneWords = (sceneId: string, fps = 30): SceneWords => {
  const words = useJson<WordToken[]>(`audio/${sceneId}.words.json`);
  const at = (query: string, occurrence = 1, offsetFrames = 0): number =>
    Math.max(0, wordFrame(words, query, occurrence) + offsetFrames);
  const last = words && words.length > 0 ? words[words.length - 1] : null;
  const end = last ? Math.round(((last.startMs + last.durationMs) / 1000) * fps) : 0;
  return {words, at, end};
};
