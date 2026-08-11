import React from 'react';
import {SafeArea} from '../components/layout/SafeArea';
import {SectionHeading} from '../components/SectionHeading';
import {Group} from '../components/diagram/Group';
import {Node} from '../components/diagram/Node';
import {Arrow} from '../components/diagram/Arrow';
import {Callout} from '../components/Callout';
import {useJson} from '../manifest/useJson';
import {wordFrame} from '../manifest/timing';
import type {WordToken} from '../manifest/types';
import {useTheme} from '../theme/ThemeProvider';
import type {SceneProps} from './index';

export const S03_Peering: React.FC<SceneProps> = ({sceneId}) => {
  const theme = useTheme();
  const words = useJson<WordToken[]>(`audio/${sceneId}.words.json`);
  if (!words) return null;

  const atStart = Math.max(0, wordFrame(words, 'neighborhoods') - 8);
  const atBridge = wordFrame(words, 'bridge');
  const atClosed = wordFrame(words, 'closed');

  return (
    <SafeArea>
      <SectionHeading text="Two neighborhoods, one bridge" startFrame={0} />
      <Group id="vnet-east" x={104} y={190} w={560} h={440} title="vnet-east 10.0.0.0/16" startFrame={atStart} />
      <Group id="vnet-west" x={1064} y={190} w={560} h={440} title="vnet-west 10.1.0.0/16" startFrame={atStart + 8} />
      <Node id="app" x={284} y={345} w={200} h={130} label="app" sublabel="10.0.1.4" startFrame={atStart + 14} />
      <Node id="db" x={1244} y={345} w={200} h={130} label="db" sublabel="10.1.2.7" color={theme.accent3} startFrame={atStart + 20} />
      <Arrow
        x1={674}
        y1={410}
        x2={1056}
        y2={410}
        color={theme.accent2}
        label="peering"
        startFrame={atBridge}
        pulse
      />
      <Callout
        id="closed-by-default"
        text="Closed by default, opened deliberately."
        x={484}
        y={696}
        w={760}
        startFrame={atClosed}
        accent={theme.accent2}
      />
    </SafeArea>
  );
};
