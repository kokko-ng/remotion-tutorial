import React from 'react';
import {useCurrentFrame} from 'remotion';
import {useTheme} from '../../theme/ThemeProvider';
import {Audit} from '../layout/audit';
import {snap} from './motion';

/**
 * Big on-screen text that slams in (scales down from 115 percent in five
 * frames): the scene's punchline. Prose uses the sans display role; pass
 * `mono` only for a literal value (a command, a key, a number from config).
 * Display size is capped at 96px. Use at most one per beat.
 */
export const Slam: React.FC<{
  id: string;
  text: string;
  x: number;
  y: number;
  w: number;
  at: number;
  until?: number;
  size?: number;
  color?: string;
  align?: 'left' | 'center';
  mono?: boolean;
}> = ({id, text, x, y, w, at, until, size = 72, color, align = 'center', mono = false}) => {
  const theme = useTheme();
  const frame = useCurrentFrame();
  if (frame < at || (until !== undefined && frame >= until)) return null;
  const p = snap(frame, at, 5);
  return (
    <Audit id={id}>
      <div
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: w,
          textAlign: align,
          scale: String(1.15 - 0.15 * p),
          // a left-aligned slam grows from its left edge, so its entry never crosses the margin
          transformOrigin: align === 'left' ? 'left center' : 'center',
          fontFamily: mono ? theme.fontMono : theme.fontBody,
          fontWeight: 700,
          fontSize: Math.min(96, size),
          letterSpacing: mono ? 0 : '-0.02em',
          lineHeight: 1.12,
          color: color ?? theme.ink,
        }}
      >
        {text}
      </div>
    </Audit>
  );
};

/**
 * A small mono label in a bordered chip. `tilt` rotates text only (never an
 * Azure icon). Used for gags: price tags, "chosen", "rejected", file names.
 */
export const Tag: React.FC<{
  id: string;
  text: string;
  x: number;
  y: number;
  at: number;
  until?: number;
  color?: string;
  size?: number;
  tilt?: number;
  filled?: boolean;
}> = ({id, text, x, y, at, until, color, size = 28, tilt = 0, filled = false}) => {
  const theme = useTheme();
  const frame = useCurrentFrame();
  if (frame < at || (until !== undefined && frame >= until)) return null;
  const c = color ?? theme.accent;
  const slap = tilt !== 0 ? 1.25 - 0.25 * snap(frame, at, 5) : 1;
  return (
    <Audit id={id}>
      <div
        style={{
          position: 'absolute',
          left: x,
          top: y,
          rotate: `${tilt}deg`,
          scale: String(slap),
          border: `2px solid ${c}`,
          background: filled ? c : theme.bg,
          color: filled ? theme.bg : c,
          fontFamily: theme.fontMono,
          fontWeight: 600,
          fontSize: size,
          padding: '6px 14px',
          borderRadius: theme.radius,
          whiteSpace: 'nowrap',
        }}
      >
        {text}
      </div>
    </Audit>
  );
};

/** A rubber-stamp verdict ("REFUSED", "FAIL CLOSED") slapped over a shot. */
export const Stamp: React.FC<{id: string; text: string; x: number; y: number; at: number; until?: number; color?: string}> = ({
  id,
  text,
  x,
  y,
  at,
  until,
  color,
}) => {
  const theme = useTheme();
  return <Tag id={id} text={text} x={x} y={y} at={at} until={until} color={color ?? theme.warn} size={56} tilt={-8} />;
};

/** Plain body text block (one or two sentences) for definitions and notes. */
export const Note: React.FC<{id: string; text: string; x: number; y: number; w: number; at: number; until?: number; size?: number; muted?: boolean}> = ({
  id,
  text,
  x,
  y,
  w,
  at,
  until,
  size = 34,
  muted = false,
}) => {
  const theme = useTheme();
  const frame = useCurrentFrame();
  if (frame < at || (until !== undefined && frame >= until)) return null;
  return (
    <Audit id={id}>
      <div
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: w,
          fontFamily: theme.fontBody,
          fontSize: size,
          lineHeight: 1.4,
          color: muted ? theme.inkMuted : theme.ink,
        }}
      >
        {text}
      </div>
    </Audit>
  );
};
