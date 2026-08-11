import React from 'react';
import {TitleCard} from '../components/TitleCard';
import type {SceneProps} from './index';

export const S01_Title: React.FC<SceneProps> = () => {
  return (
    <TitleCard
      title="Azure Networking"
      subtitle="explained like a neighborhood"
      startFrame={4}
    />
  );
};
