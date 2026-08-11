import React from 'react';
import {TitleCard} from '../components/TitleCard';
import type {SceneProps} from './index';

export const S01_Title: React.FC<SceneProps> = () => {
  return (
    <TitleCard
      title="System Design in Azure"
      subtitle="store, move, remember"
      startFrame={4}
    />
  );
};
