import React from 'react';
import {SafeArea} from '../components/layout/SafeArea';
import {SectionHeading} from '../components/SectionHeading';
import {Node} from '../components/diagram/Node';
import {useJson} from '../manifest/useJson';
import {wordFrame} from '../manifest/timing';
import type {WordToken} from '../manifest/types';
import {useTheme} from '../theme/ThemeProvider';
import type {SceneProps} from './index';

export const S04_Recall: React.FC<SceneProps> = ({sceneId}) => {
  const theme = useTheme();
  const words = useJson<WordToken[]>(`audio/${sceneId}.words.json`);
  if (!words) return null;

  return (
    <SafeArea>
      <SectionHeading text="Recap" startFrame={0} />
      <Node
        id="q-neuron"
        x={64}
        y={380}
        w={460}
        h={170}
        label="neuron"
        sublabel="a weighted sum plus a gate"
        startFrame={wordFrame(words, 'neuron')}
      />
      <Node
        id="q-circuit"
        x={634}
        y={380}
        w={460}
        h={170}
        label="circuit"
        sublabel="a team computing one thing"
        color={theme.accent3}
        startFrame={wordFrame(words, 'circuit')}
      />
      <Node
        id="q-detector"
        x={1204}
        y={380}
        w={460}
        h={170}
        label="curve detector"
        sublabel="found, not programmed"
        color={theme.accent2}
        startFrame={wordFrame(words, 'detector')}
      />
    </SafeArea>
  );
};
