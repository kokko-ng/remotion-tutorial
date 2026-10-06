import React from 'react';
import {Sequence, useVideoConfig} from 'remotion';
import {SafeArea} from '../../components/layout/SafeArea';
import {DiagramShot} from '../../components/kit/DiagramShot';
import {frameNodes} from '../../components/kit/frames';
import {Note, Tag} from '../../components/kit/Text';
import {Arrow} from '../../components/diagram/Arrow';
import type {SceneProps} from '../index';

/**
 * Development-only clean composition that must pass every layout rule:
 * a whole-diagram establishing shot (within the overview limit) cut to a
 * label-safe zoom, then two top-aligned columns joined by an attached arrow.
 * Chapter "dev".
 */
export const DevPreview: React.FC<SceneProps> = () => {
  const {fps} = useVideoConfig();
  return (
    <SafeArea>
      <Sequence name="Diagram" durationInFrames={3 * fps} premountFor={fps}>
        <DiagramShot
          name="sample"
          source="diagrams-src/sample.svg"
          h={800}
          focus={[{at: 30, rect: frameNodes('sample', ['sample-api', 'sample-worker'])}]}
        />
      </Sequence>
      <Sequence name="Columns" from={3 * fps} premountFor={fps}>
        <Note id="left" text="The poller asks the provider what changed." x={144} y={200} w={520} at={0} />
        <Tag id="left-tag" text="changed-since cursor" x={144} y={330} at={0} />
        <Note id="right" text="The stream keeps the answer for a day." x={1064} y={200} w={520} at={0} />
        <Arrow x1={670} y1={230} x2={1058} y2={230} />
      </Sequence>
    </SafeArea>
  );
};
