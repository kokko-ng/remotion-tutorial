import React from 'react';
import {Sequence, useCurrentFrame} from 'remotion';
import {Chapter} from './chapters/Chapter';
import {chapterScenes, manifest, sceneFrames} from './manifest/timing';

/**
 * Dev-only sweep: one output frame per sample point. Samples every
 * `everySec` seconds inside each scene plus each scene's last frame, with the
 * layout audit on, so every overflow/overlap/subtitle-band violation in the
 * chapter is logged as "[layout] <scene> f<frame> <id>".
 */
export const layoutSamples = (chapterId: string, everySec = 2): number[] => {
  const out: number[] = [];
  let start = 0;
  for (const s of chapterScenes(chapterId)) {
    const n = sceneFrames(s, manifest.fps);
    for (let f = 15; f < n; f += everySec * manifest.fps) out.push(start + f);
    out.push(start + n - 1);
    start += n;
  }
  return out;
};

export const LayoutCheck: React.FC<{chapterId: string; everySec?: number}> = ({chapterId, everySec = 2}) => {
  const frame = useCurrentFrame();
  const samples = layoutSamples(chapterId, everySec);
  const target = samples[Math.min(frame, samples.length - 1)];
  // A Sequence shifted by (frame - target) shows the chapter at exactly
  // `target`, so nested Sequences (scenes) resolve the right frame too.
  return (
    <Sequence from={frame - target} layout="none">
      <Chapter chapterId={chapterId} debugLayout audio={false} />
    </Sequence>
  );
};
