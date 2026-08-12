import type React from 'react';
import {S01_Title} from './S01_Title';
import {S02_Showcase} from './S02_Showcase';

export interface SceneProps {
  sceneId: string;
}

export const sceneRegistry: Record<string, React.FC<SceneProps>> = {
  S01_Title,
  S02_Showcase,
};
