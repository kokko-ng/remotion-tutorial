import React from 'react';
import {SafeArea} from '../components/layout/SafeArea';
import {SectionHeading} from '../components/SectionHeading';
import {Group} from '../components/diagram/Group';
import {Node} from '../components/diagram/Node';
import {useJson} from '../manifest/useJson';
import {wordFrame} from '../manifest/timing';
import type {WordToken} from '../manifest/types';
import {useTheme} from '../theme/ThemeProvider';
import type {SceneProps} from './index';

export const S02_Neighborhood: React.FC<SceneProps> = ({sceneId}) => {
  const theme = useTheme();
  const words = useJson<WordToken[]>(`audio/${sceneId}.words.json`);
  if (!words) return null;

  const atVnet = wordFrame(words, 'neighborhood');
  const atHouses = wordFrame(words, 'houses');
  const atStreets = wordFrame(words, 'Streets');
  const atFence = wordFrame(words, 'fence');

  return (
    <SafeArea>
      <SectionHeading text="The neighborhood" startFrame={0} />
      <Group
        id="vnet"
        x={214}
        y={120}
        w={1300}
        h={690}
        title="vnet 10.0.0.0/16"
        startFrame={atVnet}
      />
      <Group
        id="subnet-web"
        x={274}
        y={210}
        w={560}
        h={540}
        title="subnet: web street"
        color={theme.accent}
        startFrame={atStreets}
      />
      <Group
        id="subnet-data"
        x={894}
        y={210}
        w={560}
        h={540}
        title="subnet: data street"
        color={theme.accent3}
        startFrame={atStreets + 6}
      />
      <Node id="web-1" x={334} y={310} w={180} h={120} label="web-1" sublabel="10.0.1.4" startFrame={atHouses} />
      <Node id="web-2" x={594} y={310} w={180} h={120} label="web-2" sublabel="10.0.1.5" startFrame={atHouses + 4} />
      <Node id="db-1" x={954} y={310} w={180} h={120} label="db-1" sublabel="10.0.2.4" color={theme.accent3} startFrame={atHouses + 8} />
      <Node id="db-2" x={1214} y={310} w={180} h={120} label="db-2" sublabel="10.0.2.5" color={theme.accent3} startFrame={atHouses + 12} />
      <Node id="nsg-web" x={479} y={666} w={150} h={64} label="NSG" color={theme.accent2} startFrame={atFence} />
      <Node id="nsg-data" x={1099} y={666} w={150} h={64} label="NSG" color={theme.accent2} startFrame={atFence + 5} />
    </SafeArea>
  );
};
