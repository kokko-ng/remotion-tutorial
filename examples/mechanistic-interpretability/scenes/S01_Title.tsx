import React from 'react';
import {TitleCard} from '../components/TitleCard';
import type {SceneProps} from './index';

export const S01_Title: React.FC<SceneProps> = () => {
  return (
    <TitleCard
      title="Mechanistic Interpretability"
      subtitle="reading the machine"
      startFrame={4}
    />
  );
};
