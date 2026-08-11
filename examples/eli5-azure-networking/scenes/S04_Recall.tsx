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
        id="r-vnet"
        x={64}
        y={390}
        w={360}
        h={150}
        label="VNet"
        sublabel="the neighborhood"
        startFrame={wordFrame(words, 'virtual')}
      />
      <Node
        id="r-subnet"
        x={477}
        y={390}
        w={360}
        h={150}
        label="subnet"
        sublabel="the streets"
        color={theme.accent3}
        startFrame={wordFrame(words, 'subnets')}
      />
      <Node
        id="r-nsg"
        x={890}
        y={390}
        w={360}
        h={150}
        label="NSG"
        sublabel="the fence at the door"
        color={theme.accent2}
        startFrame={wordFrame(words, 'fence')}
      />
      <Node
        id="r-peering"
        x={1303}
        y={390}
        w={360}
        h={150}
        label="peering"
        sublabel="the bridge"
        startFrame={wordFrame(words, 'Peering')}
      />
    </SafeArea>
  );
};
