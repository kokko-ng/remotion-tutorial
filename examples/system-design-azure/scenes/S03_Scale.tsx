import React from 'react';
import {SafeArea} from '../components/layout/SafeArea';
import {SectionHeading} from '../components/SectionHeading';
import {Node} from '../components/diagram/Node';
import {Arrow} from '../components/diagram/Arrow';
import {CodePanel} from '../components/CodePanel';
import {useJson} from '../manifest/useJson';
import {wordFrame} from '../manifest/timing';
import type {WordToken} from '../manifest/types';
import {useTheme} from '../theme/ThemeProvider';
import type {SceneProps} from './index';

const doc = [
  '{',
  '  "id": "abc123",',
  '  "partitionKey": "abc123",',
  '  "url": "https://example.com/very/long",',
  '  "hits": 42',
  '}',
];

export const S03_Scale: React.FC<SceneProps> = ({sceneId}) => {
  const theme = useTheme();
  const words = useJson<WordToken[]>(`audio/${sceneId}.words.json`);
  if (!words) return null;

  const atRedis = wordFrame(words, 'Redis');
  const atQueue = wordFrame(words, 'queue');
  const atPartition = wordFrame(words, 'partition');

  return (
    <SafeArea>
      <SectionHeading text="Remember harder" startFrame={0} />
      <Node id="front-door" x={90} y={360} w={280} h={130} label="Front Door" startFrame={0} />
      <Arrow x1={370} y1={425} x2={666} y2={425} startFrame={4} />
      <Node id="app-service" x={670} y={360} w={280} h={130} label="App Service" color={theme.accent2} startFrame={8} />
      <Arrow x1={950} y1={425} x2={1326} y2={425} startFrame={12} />
      <Node id="cosmos" x={1330} y={360} w={280} h={130} label="Cosmos DB" color={theme.accent3} startFrame={16} />
      <Node
        id="redis"
        x={670}
        y={120}
        w={280}
        h={120}
        label="Redis cache"
        sublabel="hot links"
        color={theme.accent}
        startFrame={atRedis}
      />
      <Arrow x1={810} y1={360} x2={810} y2={244} startFrame={atRedis + 8} dashed />
      <Node
        id="queue"
        x={1330}
        y={640}
        w={280}
        h={120}
        label="queue"
        sublabel="burst absorber"
        color={theme.accent3}
        startFrame={atQueue}
      />
      <Arrow x1={950} y1={490} x2={1326} y2={676} startFrame={atQueue + 8} />
      <Arrow x1={1470} y1={636} x2={1470} y2={494} startFrame={atQueue + 16} label="drain" labelOffset={{dx: 58, dy: 0}} />
      <CodePanel
        id="doc-panel"
        lines={doc}
        x={90}
        y={560}
        w={640}
        fontSize={22}
        startFrame={atPartition - 30}
        highlights={[{from: 3, to: 3, atFrame: atPartition}]}
      />
    </SafeArea>
  );
};
