import type React from 'react';
import {S01_Example} from './S01_Example';
import {DevLayoutFixture} from './dev/DevLayoutFixture';
import {DevPreview} from './dev/DevPreview';
import {DevColumnFixture} from './dev/DevColumnFixture';
import {DevConnectorFixture} from './dev/DevConnectorFixture';

export interface SceneProps {
  sceneId: string;
}

/**
 * Every scene component named in scenes.json must be registered here.
 */
export const sceneRegistry: Record<string, React.FC<SceneProps>> = {
  S01_Example,
  // dev-only chapters (scenes.json "dev": true): the layout fixture and a clean preview
  DevLayoutFixture,
  DevPreview,
  DevColumnFixture,
  DevConnectorFixture,
};
