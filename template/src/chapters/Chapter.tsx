import React from 'react';
import {AbsoluteFill, Sequence, staticFile} from 'remotion';
import {Audio} from '@remotion/media';
import {chapterScenes, manifest, sceneFrames} from '../manifest/timing';
import {ThemeProvider, useTheme} from '../theme/ThemeProvider';
import {AuditProvider} from '../components/layout/audit';
import {Subtitles} from '../components/Subtitles';
import {ProgressBar} from '../components/ProgressBar';
import {sceneRegistry} from '../scenes';
import {useJson} from '../manifest/useJson';
import type {WordToken} from '../manifest/types';

/**
 * Renders a scene only once its word timings are loaded. Without this, every
 * wordFrame cue resolves to 0 while a scene premounts, so all reveals flash
 * on at once and the layout sweep reports false overlaps.
 */
const SceneGate: React.FC<{sceneId: string; silent: boolean; children: React.ReactNode}> = ({sceneId, silent, children}) => {
  const words = useJson<WordToken[]>(silent ? null : `audio/${sceneId}.words.json`);
  // a scene with no narration (a dev fixture or preview) renders at once
  return silent || words ? <>{children}</> : null;
};

export interface ChapterProps extends Record<string, unknown> {
  chapterId: string;
  debugLayout?: boolean;
  /** false skips voiceover audio (used by the layout sweep). */
  audio?: boolean;
}

const Background: React.FC = () => {
  const theme = useTheme();
  return (
    <AbsoluteFill style={{background: theme.bg}}>
      {theme.vignette ? (
        <AbsoluteFill
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.32) 100%)',
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};

export const Chapter: React.FC<ChapterProps> = ({chapterId, debugLayout = false, audio = true}) => {
  const scenes = chapterScenes(chapterId);
  let offset = 0;
  return (
    <ThemeProvider preset={manifest.preset} debugLayout={debugLayout}>
      <Background />
      {scenes.map((scene) => {
        const from = offset;
        const frames = sceneFrames(scene, manifest.fps);
        offset += frames;
        const SceneComp = sceneRegistry[scene.component];
        if (!SceneComp) {
          throw new Error(
            `Scene component "${scene.component}" is not in the scene registry (src/scenes/index.ts)`,
          );
        }
        return (
          <Sequence key={scene.id} from={from} durationInFrames={frames} name={scene.id} premountFor={manifest.fps}>
            <AuditProvider enabled={debugLayout} sceneId={scene.id}>
              {audio && scene.durationSec > 0 ? (
                <Audio src={staticFile(`audio/${scene.id}.wav`)} premountFor={manifest.fps} />
              ) : null}
              <SceneGate sceneId={scene.id} silent={scene.durationSec === 0}>
                <SceneComp sceneId={scene.id} />
              </SceneGate>
              <Subtitles sceneId={scene.id} />
            </AuditProvider>
          </Sequence>
        );
      })}
      <ProgressBar />
    </ThemeProvider>
  );
};
