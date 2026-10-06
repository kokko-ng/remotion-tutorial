import React from 'react';
import {useCurrentFrame} from 'remotion';
import {useTheme} from '../../theme/ThemeProvider';
import {Window} from './Window';

export type TermLine =
  | {at: number; cmd: string; prompt?: string}
  | {at: number; out: string; tone?: 'muted' | 'ok' | 'err' | 'accent'};

/**
 * A shell session. Commands type out at `cps` characters a frame from their
 * `at`; output lines appear whole at their `at`. The cursor blinks on elapsed
 * frames (never on entrance progress) and sits on the newest command line.
 * The view scrolls to keep the newest lines inside the window.
 */
export const Terminal: React.FC<{
  id?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  title?: string;
  lines: TermLine[];
  startFrame?: number;
  fontSize?: number;
  cps?: number;
}> = ({id = 'terminal', x, y, w, h, title = 'zsh', lines, startFrame = 0, fontSize = 28, cps = 1.6}) => {
  const theme = useTheme();
  const frame = useCurrentFrame();
  const lineH = Math.round(fontSize * 1.5);
  const visible = lines.filter((l) => frame >= l.at);
  const capacity = Math.floor((h - 44 - 40) / lineH);
  const shown = visible.slice(Math.max(0, visible.length - capacity));
  const tone = (t?: string) =>
    t === 'ok' ? theme.accent2 : t === 'err' ? theme.warn : t === 'accent' ? theme.accent : t === 'muted' ? theme.inkMuted : theme.ink;
  const lastCmd = [...shown].reverse().find((l) => 'cmd' in l);
  const blinkOn = Math.floor((frame - startFrame) / 15) % 2 === 0;

  return (
    <Window id={id} x={x} y={y} w={w} h={h} title={title} startFrame={startFrame}>
      <div style={{padding: '20px 26px', fontFamily: theme.fontMono, fontSize, lineHeight: `${lineH}px`}}>
        {shown.map((l, i) => {
          if ('cmd' in l) {
            const n = Math.max(0, Math.floor((frame - l.at) * cps));
            const typed = l.cmd.slice(0, n);
            const done = n >= l.cmd.length;
            return (
              <div key={i} style={{whiteSpace: 'pre', color: theme.ink}}>
                <span style={{color: theme.accent2}}>{l.prompt ?? '$'} </span>
                {typed}
                {l === lastCmd && (!done || blinkOn) ? (
                  <span style={{display: 'inline-block', width: fontSize * 0.6, height: fontSize, background: theme.accent, verticalAlign: 'text-bottom', marginLeft: 2}} />
                ) : null}
              </div>
            );
          }
          return (
            <div key={i} style={{whiteSpace: 'pre', color: tone(l.tone)}}>
              {l.out}
            </div>
          );
        })}
      </div>
    </Window>
  );
};
