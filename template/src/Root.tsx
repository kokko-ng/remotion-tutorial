import React from 'react';
import {Composition, Sequence} from 'remotion';
import './theme/fonts';
import {Chapter, type ChapterProps} from './chapters/Chapter';
import {
  chapterDurationFrames,
  manifest,
  totalDurationFrames,
} from './manifest/timing';

/**
 * One composition per chapter (the render units) plus a Full composition for
 * scrubbing the whole video in Studio. Composition ids equal chapter ids.
 */

const FullVideo: React.FC<Record<string, unknown> & {debugLayout?: boolean}> = ({
  debugLayout = false,
}) => {
  let offset = 0;
  return (
    <>
      {manifest.chapters.map((ch) => {
        const from = offset;
        const frames = chapterDurationFrames(ch.id);
        offset += frames;
        return (
          <Sequence key={ch.id} from={from} durationInFrames={frames} name={ch.id}>
            <Chapter chapterId={ch.id} debugLayout={debugLayout} />
          </Sequence>
        );
      })}
    </>
  );
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {manifest.chapters.map((ch) => (
        <Composition
          key={ch.id}
          id={ch.id}
          component={Chapter}
          fps={manifest.fps}
          width={manifest.width}
          height={manifest.height}
          defaultProps={{chapterId: ch.id, debugLayout: false} satisfies ChapterProps}
          calculateMetadata={({props}) => ({
            durationInFrames: Math.max(1, chapterDurationFrames(props.chapterId)),
            props,
          })}
        />
      ))}
      <Composition
        id="Full"
        component={FullVideo}
        fps={manifest.fps}
        width={manifest.width}
        height={manifest.height}
        defaultProps={{debugLayout: false}}
        calculateMetadata={({props}) => ({
          durationInFrames: Math.max(1, totalDurationFrames()),
          props,
        })}
      />
    </>
  );
};
