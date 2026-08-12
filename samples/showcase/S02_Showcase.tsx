import React from 'react';
import {SafeArea} from '../components/layout/SafeArea';
import {SectionHeading} from '../components/SectionHeading';
import {Group} from '../components/diagram/Group';
import {Node} from '../components/diagram/Node';
import {Arrow} from '../components/diagram/Arrow';
import {GraphPlot, type PlotPoint} from '../components/GraphPlot';
import {Callout} from '../components/Callout';
import {useTheme} from '../theme/ThemeProvider';
import type {SceneProps} from './index';

// Latency against load: flat, then a knee. Shaped so the curve's arc length is
// deliberately non-uniform in x, which is the case the GraphPlot tip marker
// has to get right.
const curve: PlotPoint[] = Array.from({length: 41}, (_, i) => {
  const x = i / 40;
  return {x, y: 0.08 + 0.88 / (1 + Math.exp(-12 * (x - 0.68)))};
});

export const S02_Showcase: React.FC<SceneProps> = () => {
  const theme = useTheme();
  return (
    <SafeArea>
      <SectionHeading text="Where the time goes" startFrame={0} />
      <Group id="vnet" x={0} y={150} w={900} h={420} title="vnet 10.0.0.0/16" startFrame={8} />
      <Node
        id="client"
        x={44}
        y={310}
        w={210}
        h={130}
        label="Client"
        sublabel="10.0.1.4"
        startFrame={16}
      />
      <Node
        id="gateway"
        x={345}
        y={310}
        w={210}
        h={130}
        label="Gateway"
        sublabel="10.0.2.1"
        color={theme.accent2}
        startFrame={24}
      />
      <Node
        id="service"
        x={646}
        y={310}
        w={210}
        h={130}
        label="Service"
        sublabel=":8080"
        color={theme.accent3}
        startFrame={32}
      />
      <Arrow x1={254} y1={375} x2={345} y2={375} startFrame={40} />
      <Arrow x1={555} y1={375} x2={646} y2={375} startFrame={46} />
      <GraphPlot
        id="latency"
        x={980}
        y={150}
        w={748}
        h={420}
        points={curve}
        xLabel="concurrent requests"
        yLabel="p99 latency"
        startFrame={54}
      />
      <Callout
        id="takeaway"
        text="Queueing shows up at the gateway long before the service is busy."
        x={0}
        y={624}
        w={1728}
        startFrame={140}
      />
    </SafeArea>
  );
};
