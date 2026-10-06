import React from 'react';
import {SafeArea} from '../../components/layout/SafeArea';
import {Arrow} from '../../components/diagram/Arrow';
import {Group} from '../../components/diagram/Group';
import {Node} from '../../components/diagram/Node';
import type {SceneProps} from '../index';

/**
 * Development-only fixture for the connector, marker, zone and empty-space
 * rules. Every element here is wrong on purpose; scripts/layout_selftest.sh
 * requires each rule to be reported. Nothing is painted below y=600, so the
 * scene also trips `void`. Chapter "devfail".
 */
export const DevConnectorFixture: React.FC<SceneProps> = () => (
  <SafeArea>
    {/* zone-offcenter: one node hugging the zone's top-left for the whole scene */}
    <Group id="zone" x={0} y={0} w={800} h={420} title="vnet" />
    <Node id="zone-vm" x={20} y={60} w={180} h={70} label="vm" />
    {/* link-short: a 20px stub between two boxes */}
    <Node id="stub-a" x={900} y={0} w={160} h={70} label="a" />
    <Node id="stub-b" x={1080} y={0} w={160} h={70} label="b" />
    <Arrow x1={1060} y1={35} x2={1080} y2={35} />
    {/* link-skew and link-offcenter: a slightly tilted line landing low on the edge */}
    <Node id="skew-a" x={900} y={140} w={160} h={100} label="c" />
    <Node id="skew-b" x={1300} y={140} w={160} h={100} label="d" />
    <Arrow x1={1060} y1={200} x2={1300} y2={230} />
    {/* link-label: a label wider than the gap it sits in */}
    <Node id="label-a" x={900} y={300} w={160} h={70} label="e" />
    <Node id="label-b" x={1160} y={300} w={160} h={70} label="f" />
    <Arrow x1={1060} y1={335} x2={1160} y2={335} label="a label far too wide" labelOffset={{dx: 0, dy: 0}} />
    {/* marker-over: a travelling marker parked on a node */}
    <div
      data-marker="parked"
      style={{position: 'absolute', left: 940, top: 320, width: 18, height: 18, background: '#7fd6c2'}}
    />
    {/* content-bounds: a box past the right edge of the content box */}
    <div
      data-fit="past-content-box"
      style={{position: 'absolute', left: 1500, top: 460, width: 400, height: 60, border: '1px solid #888'}}
    />
  </SafeArea>
);
