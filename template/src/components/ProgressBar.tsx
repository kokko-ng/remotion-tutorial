import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {useTheme} from '../theme/ThemeProvider';

/**
 * Thin progress bar along the very bottom edge (below the subtitle band).
 */
export const ProgressBar: React.FC = () => {
  const theme = useTheme();
  const frame = useCurrentFrame();
  const {durationInFrames, width} = useVideoConfig();
  const progress = durationInFrames > 1 ? frame / (durationInFrames - 1) : 0;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: 5,
          width: width * progress,
          background: theme.accent,
          opacity: 0.55,
        }}
      />
    </AbsoluteFill>
  );
};
