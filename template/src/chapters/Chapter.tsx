import React from 'react';
import {AbsoluteFill, Sequence, staticFile} from 'remotion';
import {Audio} from '@remotion/media';
import {chapterScenes, manifest, sceneFrames} from '../manifest/timing';
import {ThemeProvider, useTheme} from '../theme/ThemeProvider';
import {AuditProvider} from '../components/layout/audit';
import {Subtitles} from '../components/Subtitles';
import {ProgressBar} from '../components/ProgressBar';
import {sceneRegistry} from '../scenes';

export interface ChapterProps extends Record<string, unknown> {
  chapterId: string;
  debugLayout?: boolean;
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

export const Chapter: React.FC<ChapterProps> = ({chapterId, debugLayout = false}) => {
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
          <Sequence key={scene.id} from={from} durationInFrames={frames} name={scene.id}>
            <AuditProvider enabled={debugLayout}>
              {scene.durationSec > 0 ? (
                <Audio src={staticFile(`audio/${scene.id}.wav`)} />
              ) : null}
              <SceneComp sceneId={scene.id} />
              <Subtitles sceneId={scene.id} />
            </AuditProvider>
          </Sequence>
        );
      })}
      <ProgressBar />
    </ThemeProvider>
  );
};
