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
        id="q-store"
        x={64}
        y={380}
        w={460}
        h={170}
        label="store"
        sublabel="Cosmos DB"
        color={theme.accent3}
        startFrame={wordFrame(words, 'stored')}
      />
      <Node
        id="q-move"
        x={634}
        y={380}
        w={460}
        h={170}
        label="move"
        sublabel="Front Door + queue"
        startFrame={wordFrame(words, 'moved')}
      />
      <Node
        id="q-remember"
        x={1204}
        y={380}
        w={460}
        h={170}
        label="remember"
        sublabel="Redis + partition key"
        color={theme.accent2}
        startFrame={wordFrame(words, 'Redis')}
      />
    </SafeArea>
  );
};
