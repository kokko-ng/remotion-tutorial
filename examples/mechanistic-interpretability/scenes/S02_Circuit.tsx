import React from 'react';
import {SafeArea} from '../components/layout/SafeArea';
import {SectionHeading} from '../components/SectionHeading';
import {Node} from '../components/diagram/Node';
import {Group} from '../components/diagram/Group';
import {Arrow} from '../components/diagram/Arrow';
import {EquationBlock} from '../components/EquationBlock';
import {useJson} from '../manifest/useJson';
import {wordFrame} from '../manifest/timing';
import type {WordToken} from '../manifest/types';
import {useTheme} from '../theme/ThemeProvider';
import type {SceneProps} from './index';

export const S02_Circuit: React.FC<SceneProps> = ({sceneId}) => {
  const theme = useTheme();
  const words = useJson<WordToken[]>(`audio/${sceneId}.words.json`);
  if (!words) return null;

  const atSum = wordFrame(words, 'sum');
  const atInputs = wordFrame(words, 'input');
  const atCircuits = wordFrame(words, 'circuits');

  return (
    <SafeArea>
      <SectionHeading text="From numbers to circuits" startFrame={0} />
      <Node id="x1" x={200} y={260} w={120} h={90} label="x1" startFrame={atInputs} />
      <Node id="x2" x={200} y={420} w={120} h={90} label="x2" startFrame={atInputs + 4} />
      <Node id="x3" x={200} y={580} w={120} h={90} label="x3" startFrame={atInputs + 8} />
      <Arrow x1={320} y1={305} x2={756} y2={430} startFrame={atInputs + 12} label="w1" labelOffset={{dx: -30, dy: -24}} />
      <Arrow x1={320} y1={465} x2={756} y2={455} startFrame={atInputs + 15} label="w2" labelOffset={{dx: -40, dy: -22}} />
      <Arrow x1={320} y1={625} x2={756} y2={480} startFrame={atInputs + 18} label="w3" labelOffset={{dx: -30, dy: 24}} />
      <Node
        id="neuron"
        x={760}
        y={400}
        w={170}
        h={110}
        label="neuron"
        sublabel="weighted sum"
        color={theme.accent2}
        startFrame={atSum}
      />
      <Arrow x1={930} y1={455} x2={1326} y2={455} startFrame={atInputs + 22} />
      <Node id="output" x={1330} y={400} w={170} h={110} label="output" startFrame={atInputs + 26} />
      <EquationBlock
        id="equation"
        tex={String.raw`a=\sigma\!\left(\sum_i w_i x_i + b\right)`}
        x={1010}
        y={130}
        fontSize={46}
        startFrame={atSum + 8}
      />
      <Node id="n-up" x={765} y={264} w={160} h={90} label="neuron" color={theme.inkMuted} startFrame={atCircuits} />
      <Node id="n-down" x={765} y={560} w={160} h={90} label="neuron" color={theme.inkMuted} startFrame={atCircuits + 5} />
      <Group
        id="circuit"
        x={725}
        y={210}
        w={250}
        h={500}
        title="circuit"
        color={theme.accent3}
        startFrame={atCircuits + 12}
      />
    </SafeArea>
  );
};
