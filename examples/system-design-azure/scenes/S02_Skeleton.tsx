import React from 'react';
import {SafeArea} from '../components/layout/SafeArea';
import {SectionHeading} from '../components/SectionHeading';
import {Node} from '../components/diagram/Node';
import {Arrow} from '../components/diagram/Arrow';
import {useJson} from '../manifest/useJson';
import {wordFrame} from '../manifest/timing';
import type {WordToken} from '../manifest/types';
import {useTheme} from '../theme/ThemeProvider';
import type {SceneProps} from './index';

export const S02_Skeleton: React.FC<SceneProps> = ({sceneId}) => {
  const theme = useTheme();
  const words = useJson<WordToken[]>(`audio/${sceneId}.words.json`);
  if (!words) return null;

  const atFront = wordFrame(words, 'Front');
  const atApp = wordFrame(words, 'App');
  const atCosmos = wordFrame(words, 'Cosmos');

  return (
    <SafeArea>
      <SectionHeading text="The skeleton" startFrame={0} />
      <Node
        id="front-door"
        x={90}
        y={380}
        w={300}
        h={140}
        label="Front Door"
        sublabel="edge, anycast"
        startFrame={atFront}
      />
      <Arrow x1={390} y1={450} x2={686} y2={450} startFrame={atApp - 6} pulse />
      <Node
        id="app-service"
        x={690}
        y={380}
        w={300}
        h={140}
        label="App Service"
        sublabel="shorten + redirect"
        color={theme.accent2}
        startFrame={atApp}
      />
      <Arrow x1={990} y1={450} x2={1286} y2={450} startFrame={atCosmos - 6} pulse />
      <Node
        id="cosmos"
        x={1290}
        y={380}
        w={300}
        h={140}
        label="Cosmos DB"
        sublabel="key: short code"
        color={theme.accent3}
        startFrame={atCosmos}
      />
    </SafeArea>
  );
};
