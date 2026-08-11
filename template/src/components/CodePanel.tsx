import React from 'react';
import {useCurrentFrame} from 'remotion';
import {useTheme} from '../theme/ThemeProvider';
import {useEntrance} from '../theme/motion';
import {Audit} from './layout/audit';

export interface HighlightSpec {
  from: number; // 1-based first line
  to: number; // 1-based last line
  atFrame: number; // scene-relative frame when this highlight becomes active
}

/**
 * A code panel with sequential line reveal and a movable highlight window.
 * Keep snippets short (10 lines or fewer); this is narrated code, not an IDE.
 */
export const CodePanel: React.FC<{
  id?: string;
  lines: string[];
  x: number;
  y: number;
  w: number;
  startFrame?: number;
  highlights?: HighlightSpec[];
  fontSize?: number;
  linesPerSecond?: number;
}> = ({id = 'code', lines, x, y, w, startFrame = 0, highlights = [], fontSize = 28, linesPerSecond = 6}) => {
  const theme = useTheme();
  const frame = useCurrentFrame();
  const p = useEntrance(startFrame);
  const framesPerLine = Math.max(1, Math.round(30 / linesPerSecond));

  const active = [...highlights].reverse().find((hl) => frame >= hl.atFrame);
  const lineH = fontSize * 1.6;

  return (
    <Audit id={id}>
      <div
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: w,
          background: theme.bgPanel,
          borderRadius: theme.radius,
          border: theme.stroke > 0 ? `${theme.stroke}px solid ${theme.inkMuted}44` : undefined,
          boxShadow: theme.softShadow ?? undefined,
          padding: '22px 0',
          opacity: p,
          fontFamily: theme.fontMono,
          fontSize,
          lineHeight: `${lineH}px`,
        }}
      >
        {lines.map((line, i) => {
          const revealed = frame >= startFrame + theme.motionFrames + i * framesPerLine;
          const highlighted = active && i + 1 >= active.from && i + 1 <= active.to;
          const dimmed = active && !highlighted;
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                background: highlighted ? `${theme.accent}22` : 'transparent',
                borderLeft: highlighted ? `3px solid ${theme.accent}` : '3px solid transparent',
                opacity: revealed ? (dimmed ? 0.45 : 1) : 0,
                padding: '0 26px',
              }}
            >
              <span style={{color: theme.inkMuted, width: fontSize * 1.7, flexShrink: 0, userSelect: 'none'}}>
                {i + 1}
              </span>
              <span style={{color: theme.ink, whiteSpace: 'pre'}}>{line}</span>
            </div>
          );
        })}
      </div>
    </Audit>
  );
};
