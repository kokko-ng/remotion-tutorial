import React from 'react';
import {interpolate} from 'remotion';
import {useTheme} from '../theme/ThemeProvider';
import {useEntrance} from '../theme/motion';
import {Audit} from './layout/audit';

/**
 * Small heading pinned to the top-left of the safe area. Place inside SafeArea.
 */
export const SectionHeading: React.FC<{
  text: string;
  startFrame?: number;
}> = ({text, startFrame = 0}) => {
  const theme = useTheme();
  const p = useEntrance(startFrame);
  return (
    <Audit id="section-heading">
      <div style={{position: 'absolute', top: 0, left: 0}}>
        <div
          style={{
            fontFamily: theme.fontHeading,
            fontSize: 46,
            fontWeight: 600,
            color: theme.ink,
            opacity: p,
          }}
        >
          {text}
        </div>
        <div
          style={{
            height: 3,
            width: interpolate(p, [0, 1], [0, 120]),
            background: theme.accent,
            marginTop: 10,
            borderRadius: 2,
          }}
        />
      </div>
    </Audit>
  );
};
