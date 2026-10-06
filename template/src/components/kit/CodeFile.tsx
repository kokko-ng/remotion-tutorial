import React from 'react';
import {useCurrentFrame} from 'remotion';
import {useTheme} from '../../theme/ThemeProvider';
import {Window} from './Window';

export interface LineMark {
  from: number; // 1-based, inclusive
  to: number;
  at: number;
  until?: number;
}

/**
 * A real file excerpt in a window titled with its repository path. `firstLine`
 * is the line number of lines[0] in the real file, so the gutter matches the
 * repository. Comment lines (# or //) render muted. Highlights dim the rest.
 */
export const CodeFile: React.FC<{
  id?: string;
  path: string;
  lines: string[];
  firstLine?: number;
  x: number;
  y: number;
  w: number;
  h: number;
  startFrame?: number;
  marks?: LineMark[];
  fontSize?: number;
}> = ({id = 'code', path, lines, firstLine = 1, x, y, w, h, startFrame = 0, marks = [], fontSize = 26}) => {
  const theme = useTheme();
  const frame = useCurrentFrame();
  const lineH = Math.round(fontSize * 1.55);
  const active = [...marks].reverse().find((m) => frame >= m.at && (m.until === undefined || frame < m.until));
  const gutter = String(firstLine + lines.length - 1).length * fontSize * 0.62 + 18;
  return (
    <Window id={id} x={x} y={y} w={w} h={h} title={path} startFrame={startFrame}>
      <div style={{padding: '18px 0', fontFamily: theme.fontMono, fontSize, lineHeight: `${lineH}px`}}>
        {lines.map((line, i) => {
          const n = firstLine + i;
          const lit = active && n >= active.from && n <= active.to;
          const dim = active && !lit;
          const comment = /^\s*(#|\/\/)/.test(line);
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                padding: '0 22px 0 16px',
                background: lit ? `${theme.accent}26` : 'transparent',
                opacity: dim ? 0.4 : 1,
              }}
            >
              <span style={{width: gutter, flexShrink: 0, color: theme.inkMuted}}>{n}</span>
              <span style={{whiteSpace: 'pre', color: comment ? theme.inkMuted : theme.ink}}>{line}</span>
            </div>
          );
        })}
      </div>
    </Window>
  );
};
