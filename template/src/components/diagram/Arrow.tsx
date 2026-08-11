import React from 'react';
import {useCurrentFrame} from 'remotion';
import {useTheme} from '../../theme/ThemeProvider';
import {useEntrance} from '../../theme/motion';

/**
 * A connector with an arrowhead, drawn on. Coordinates are SafeArea-relative.
 * Not audited: connectors legitimately cross node boundaries.
 * `pulse` animates a dot along the path to show traffic/data flow.
 */
export const Arrow: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
  startFrame?: number;
  label?: string;
  /** perpendicular offset of the label from the midpoint */
  labelOffset?: {dx: number; dy: number};
  pulse?: boolean;
  dashed?: boolean;
}> = ({x1, y1, x2, y2, color, startFrame = 0, label, labelOffset = {dx: 0, dy: -26}, pulse = false, dashed = false}) => {
  const theme = useTheme();
  const frame = useCurrentFrame();
  const p = useEntrance(startFrame);
  const c = color ?? theme.inkMuted;

  const pad = 30;
  const minX = Math.min(x1, x2) - pad;
  const minY = Math.min(y1, y2) - pad;
  const bw = Math.abs(x2 - x1) + 2 * pad;
  const bh = Math.abs(y2 - y1) + 2 * pad;
  const ax1 = x1 - minX;
  const ay1 = y1 - minY;
  const ax2 = x2 - minX;
  const ay2 = y2 - minY;

  const len = Math.hypot(x2 - x1, y2 - y1);
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  // shorten the line so the arrowhead tip lands on (x2,y2)
  const head = 14;
  const lx2 = ax2 - ux * head;
  const ly2 = ay2 - uy * head;

  const drawn = p * len;
  const pulseT = pulse && p >= 1 ? ((frame - startFrame) % 45) / 45 : null;
  const strokeW = Math.max(2, theme.stroke);

  const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;

  return (
    <div style={{position: 'absolute', left: minX, top: minY, width: bw, height: bh, pointerEvents: 'none'}}>
      <svg width={bw} height={bh}>
        <line
          x1={ax1}
          y1={ay1}
          x2={lx2}
          y2={ly2}
          stroke={c}
          strokeWidth={strokeW}
          strokeDasharray={dashed ? `10 8` : `${len}`}
          strokeDashoffset={dashed ? undefined : len - drawn}
          opacity={dashed ? p : 1}
          strokeLinecap="round"
        />
        <g transform={`translate(${ax2}, ${ay2}) rotate(${angle})`} opacity={p > 0.92 ? 1 : 0}>
          <path d={`M ${-head} ${-head * 0.55} L 0 0 L ${-head} ${head * 0.55} Z`} fill={c} />
        </g>
        {pulseT !== null ? (
          <circle
            cx={ax1 + (lx2 - ax1) * pulseT}
            cy={ay1 + (ly2 - ay1) * pulseT}
            r={7}
            fill={theme.accent2}
            opacity={pulseT < 0.08 ? pulseT / 0.08 : pulseT > 0.85 ? (1 - pulseT) / 0.15 : 1}
          />
        ) : null}
      </svg>
      {label ? (
        <div
          style={{
            position: 'absolute',
            left: (ax1 + ax2) / 2 + labelOffset.dx,
            top: (ay1 + ay2) / 2 + labelOffset.dy,
            transform: 'translate(-50%, -50%)',
            fontFamily: theme.fontMono,
            fontSize: 24,
            color: c,
            opacity: p,
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </div>
      ) : null}
    </div>
  );
};
