import React from 'react';
import {SafeArea} from '../components/layout/SafeArea';
import {SectionHeading} from '../components/SectionHeading';
import {GraphPlot, type PlotPoint} from '../components/GraphPlot';
import {Callout} from '../components/Callout';
import {useJson} from '../manifest/useJson';
import {wordFrame} from '../manifest/timing';
import type {WordToken} from '../manifest/types';
import {useTheme} from '../theme/ThemeProvider';
import type {SceneProps} from './index';

const sigmoid = (t: number) => 1 / (1 + Math.exp(-11 * (t - 0.58)));
const points: PlotPoint[] = Array.from({length: 60}, (_, i) => {
  const t = i / 59;
  return {x: t, y: 0.04 + 0.9 * sigmoid(t)};
});

export const S03_CurveDetector: React.FC<SceneProps> = ({sceneId}) => {
  const theme = useTheme();
  const words = useJson<WordToken[]>(`audio/${sceneId}.words.json`);
  if (!words) return null;

  const atShow = wordFrame(words, 'Show');
  const atFires = wordFrame(words, 'fires');
  const atNobody = wordFrame(words, 'Nobody');

  return (
    <SafeArea>
      <SectionHeading text="The curve detector" startFrame={0} />
      <GraphPlot
        id="activation-plot"
        x={150}
        y={150}
        w={1000}
        h={640}
        points={points}
        xLabel="curvature of the input"
        yLabel="activation"
        color={theme.accent2}
        startFrame={10}
        curveDelayFrames={Math.max(theme.motionFrames, atShow - 10)}
        drawFrames={Math.max(60, atFires - atShow + 20)}
      />
      <Callout
        id="found-note"
        text="Found, not programmed."
        x={1240}
        y={400}
        w={400}
        startFrame={atNobody}
        accent={theme.accent3}
      />
    </SafeArea>
  );
};
