import React from 'react';
import {useCurrentFrame} from 'remotion';
import {useTheme} from '../../theme/ThemeProvider';
import {Audit} from '../layout/audit';
import {snap} from './motion';

/**
 * A terminal-style window: a title bar carrying the repository path in mono
 * (a path is data, so mono is earned) and a body that clips its content.
 * No decorative window chrome. Every code, terminal,
 * diagram, and image shot sits in one of these, so the whole video shares
 * one frame language. Positions are SafeArea coordinates.
 */
export const Window: React.FC<{
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  startFrame?: number;
  /** body background; diagrams pass a light paper colour token */
  bodyBg?: string;
  accent?: string;
  children: React.ReactNode;
}> = ({id, x, y, w, h, title, startFrame = 0, bodyBg, accent, children}) => {
  const theme = useTheme();
  const frame = useCurrentFrame();
  const p = snap(frame, startFrame, 6);
  const barH = 44;
  return (
    <Audit id={id}>
      <div
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: w,
          height: h,
          opacity: p > 0 ? 1 : 0,
          scale: String(0.96 + 0.04 * p),
          background: theme.bgPanel,
          border: `${theme.stroke}px solid ${accent ?? theme.inkMuted}66`,
          borderRadius: theme.radius,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: barH,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '0 16px',
            borderBottom: `${theme.stroke}px solid ${theme.inkMuted}44`,
          }}
        >
          <div
            style={{
              fontFamily: theme.fontMono,
              fontSize: 22,
              color: theme.inkMuted,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </div>
        </div>
        <div style={{position: 'absolute', left: 0, top: barH, width: '100%', height: `calc(100% - ${barH}px)`, background: bodyBg, overflow: 'hidden'}}>
          {children}
        </div>
      </div>
    </Audit>
  );
};

export const WINDOW_BAR = 44;
