import type React from 'react';
import {S01_Example} from './S01_Example';

export interface SceneProps {
  sceneId: string;
}

/**
 * Every scene component named in scenes.json must be registered here.
 */
export const sceneRegistry: Record<string, React.FC<SceneProps>> = {
  S01_Example,
};
