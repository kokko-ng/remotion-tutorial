import React from 'react';
import {SafeArea} from '../../components/layout/SafeArea';
import {Note, Tag} from '../../components/kit/Text';
import {CodeFile} from '../../components/kit/CodeFile';
import {Window} from '../../components/kit/Window';
import {DiagramShot} from '../../components/kit/DiagramShot';
import {Arrow} from '../../components/diagram/Arrow';
import {Node} from '../../components/diagram/Node';
import type {SceneProps} from '../index';

/**
 * Development-only fixture that breaks every layout rule on purpose. The
 * layout sweep must report each rule here (scripts/layout_selftest.sh checks
 * that), or a clean sweep elsewhere means nothing. Chapter "devfail".
 */
export const DevLayoutFixture: React.FC<SceneProps> = () => (
  <SafeArea>
    {/* overlap, tight (gap under minGap) */}
    <Note id="overlap-a" text="Overlap A" x={0} y={0} w={300} at={0} />
    <Note id="overlap-b" text="Overlap B" x={150} y={10} w={300} at={0} />
    <Tag id="close-a" text="close a" x={520} y={0} at={0} />
    <Tag id="close-b" text="close b" x={520} y={62} at={0} />
    {/* clipped-text: a code line wider than its window */}
    <CodeFile id="clipped-code" path="clip.py" lines={['x = "a line much too long for this narrow window, so it is cut off"']} x={0} y={300} w={300} h={140} />
    {/* bounds: in the subtitle band, past the left margin */}
    <Note id="in-subtitles" text="I sit in the subtitle band" x={600} y={840} w={500} at={0} />
    <Note id="past-margin" text="Past the margin" x={-60} y={500} w={300} at={0} />
    {/* text-overflow: a nowrap tag running off the frame; text-bounds: unaudited text off the edge */}
    <Tag id="spills" text="a nowrap tag that runs straight off the right edge of the frame" x={1300} y={620} at={0} />
    <div style={{position: 'absolute', left: 1650, top: 720, whiteSpace: 'nowrap', fontSize: 30, color: 'white'}}>unaudited text off the edge</div>
    {/* off-center: a wide showcase pushed left */}
    <Window id="off-centre" x={0} y={160} w={1200} h={100} title="a wide showcase pushed left">
      <div />
    </Window>
    {/* duplicate-id */}
    <Note id="twin" text="twin one" x={1000} y={300} w={200} at={0} />
    <Note id="twin" text="twin two" x={1000} y={420} w={200} at={0} />
    {/* arrows: detached, through text, piled-up heads */}
    <Arrow x1={1250} y1={60} x2={1400} y2={60} />
    <Note id="crossed-by-arrow" text="an arrow runs through this sentence" x={1300} y={130} w={400} at={0} />
    <Arrow x1={1250} y1={150} x2={1710} y2={150} />
    <Note id="pile-target" text="target" x={1400} y={230} w={160} at={0} />
    <Arrow x1={1250} y1={200} x2={1400} y2={240} />
    <Arrow x1={1250} y1={290} x2={1400} y2={242} />
    {/* column-top lives in DevColumnFixture (scene d03): a crowded scene clusters into one column */}
    {/* overflow and inset on [data-fit] (upstream rules): a node too small for its label */}
    <Node id="tiny-node" x={760} y={480} w={90} h={40} label="a label far too long for this node" />
    {/* diagram rules: a whole view held past the overview limit (illegible), and a
        zoom that slices a label and shows a box without its name */}
    <DiagramShot id="held-overview" name="sample" source="diagrams-src/sample.svg" x={1150} y={330} w={560} h={260} />
    <DiagramShot
      id="bad-zoom"
      name="sample"
      source="diagrams-src/sample.svg"
      x={760}
      y={560}
      w={500}
      h={220}
      focus={[{at: 0, rect: [0.05, 0.31, 0.26, 0.4]}]}
    />
  </SafeArea>
);
