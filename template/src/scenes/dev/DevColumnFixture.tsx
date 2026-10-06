import React from 'react';
import {SafeArea} from '../../components/layout/SafeArea';
import {Note} from '../../components/kit/Text';
import type {SceneProps} from '../index';

/**
 * Development-only fixture for column-top, kept apart from DevLayoutFixture
 * because a crowded scene clusters everything into the same columns: two
 * side-by-side columns whose tops differ by more than the tolerance.
 */
export const DevColumnFixture: React.FC<SceneProps> = () => (
  <SafeArea>
    <Note id="col-left" text="left column" x={144} y={200} w={500} at={0} />
    <Note id="col-left-2" text="left column, second block" x={144} y={300} w={500} at={0} />
    <Note id="col-right" text="right column, starting lower" x={1084} y={260} w={500} at={0} />
  </SafeArea>
);
