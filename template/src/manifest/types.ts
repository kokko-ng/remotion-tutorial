export interface SceneEntry {
  id: string;
  chapter: string;
  component: string;
  durationSec: number;
  padOutSec: number;
}

export interface ChapterEntry {
  id: string;
  title: string;
  /** development-only chapter (layout fixture, previews): not part of the video,
   * excluded from the Full composition and from default sweeps, run by name */
  dev?: boolean;
}

export interface Manifest {
  fps: number;
  width: number;
  height: number;
  preset: string;
  title: string;
  chapters: ChapterEntry[];
  scenes: SceneEntry[];
}

export interface WordToken {
  text: string;
  startMs: number;
  durationMs: number;
  punct: boolean;
}

export interface SubtitleChunk {
  text: string;
  startMs: number;
  endMs: number;
  words: {text: string; startMs: number; endMs: number}[];
}
