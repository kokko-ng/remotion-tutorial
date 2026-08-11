import React from 'react';
import {useTheme} from '../theme/ThemeProvider';
import {useEntrance} from '../theme/motion';
import {Audit} from './layout/audit';

/**
 * A single emphasized statement (used for recall prompts and key takeaways).
 * Absolutely positioned inside SafeArea. Width is required so text wraps
 * predictably; audit it against neighbors.
 */
export const Callout: React.FC<{
  id?: string;
  text: string;
  x: number;
  y: number;
  w: number;
  startFrame?: number;
  accent?: string;
  align?: 'left' | 'center';
}> = ({id = 'callout', text, x, y, w, startFrame = 0, accent, align = 'center'}) => {
  const theme = useTheme();
  const p = useEntrance(startFrame);
  const color = accent ?? theme.accent;
  const scale = theme.motion === 'spring' ? 0.94 + 0.06 * p : 1;
  return (
    <Audit id={id}>
      <div
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: w,
          opacity: p,
          transform: `scale(${scale})`,
          background: theme.bgPanel,
          borderRadius: theme.radius,
          borderLeft: theme.stroke > 0 ? `${Math.max(3, theme.stroke)}px solid ${color}` : undefined,
          boxShadow: theme.softShadow ?? undefined,
          padding: '30px 38px',
        }}
      >
        <div
          style={{
            fontFamily: theme.fontBody,
            fontSize: 38,
            fontWeight: 600,
            color: theme.ink,
            lineHeight: 1.45,
            textAlign: align,
          }}
        >
          {text}
        </div>
      </div>
    </Audit>
  );
};
