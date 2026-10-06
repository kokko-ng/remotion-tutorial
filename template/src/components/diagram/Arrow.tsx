import React from 'react';
import {useCurrentFrame} from 'remotion';
import {useTheme} from '../../theme/ThemeProvider';
import {useEntrance} from '../../theme/motion';

type Pt = [number, number];

/**
 * A connector with an arrowhead, drawn on. Coordinates are SafeArea-relative.
 * Not audited as a block, but the layout sweep checks its geometry (ends that
 * touch their targets, minimum length, orthogonal routing, no crossing boxes,
 * label clearance). Route around obstacles with `via` waypoints; segments are
 * expected to be horizontal or vertical unless `diagonal` is set.
 * `pulse` animates a dot along the path to show traffic/data flow.
 */
export const Arrow: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** elbow points between start and end, for orthogonal routing */
  via?: Pt[];
  color?: string;
  startFrame?: number;
  label?: string;
  /** offset of the label from the midpoint of the middle segment */
  labelOffset?: {dx: number; dy: number};
  pulse?: boolean;
  dashed?: boolean;
  /** ends allowed to stop in open space (flow arrows) */
  free?: 'start' | 'end' | 'both';
  /** allow non-orthogonal segments */
  diagonal?: boolean;
}> = ({
  x1,
  y1,
  x2,
  y2,
  via = [],
  color,
  startFrame = 0,
  label,
  labelOffset = {dx: 0, dy: -26},
  pulse = false,
  dashed = false,
  free,
  diagonal,
}) => {
  const theme = useTheme();
  const frame = useCurrentFrame();
  const p = useEntrance(startFrame);
  const c = color ?? theme.inkMuted;

  const pts: Pt[] = [[x1, y1], ...via, [x2, y2]];
  const pad = 30;
  const minX = Math.min(...pts.map((q) => q[0])) - pad;
  const minY = Math.min(...pts.map((q) => q[1])) - pad;
  const bw = Math.max(...pts.map((q) => q[0])) - minX + pad;
  const bh = Math.max(...pts.map((q) => q[1])) - minY + pad;
  const local: Pt[] = pts.map(([x, y]) => [x - minX, y - minY]);

  // shorten the last segment so the arrowhead tip lands on (x2, y2)
  const head = 14;
  const [px, py] = local[local.length - 2];
  const [tx, ty] = local[local.length - 1];
  const segLen = Math.hypot(tx - px, ty - py) || 1;
  const ux = (tx - px) / segLen;
  const uy = (ty - py) / segLen;
  const drawPts: Pt[] = [...local.slice(0, -1), [tx - ux * head, ty - uy * head]];
  const lens = drawPts.slice(1).map((q, i) => Math.hypot(q[0] - drawPts[i][0], q[1] - drawPts[i][1]));
  const len = lens.reduce((a, b) => a + b, 0);
  const d = drawPts.map((q, i) => `${i ? 'L' : 'M'} ${q[0]} ${q[1]}`).join(' ');

  const pointAt = (t: number): Pt => {
    let s = t * len;
    for (let i = 0; i < lens.length; i++) {
      if (s <= lens[i] || i === lens.length - 1) {
        const f = lens[i] ? Math.min(1, s / lens[i]) : 0;
        return [drawPts[i][0] + (drawPts[i + 1][0] - drawPts[i][0]) * f, drawPts[i][1] + (drawPts[i + 1][1] - drawPts[i][1]) * f];
      }
      s -= lens[i];
    }
    return drawPts[drawPts.length - 1];
  };

  const drawn = p * len;
  // Gate the pulse on elapsed frames, not on entrance progress: a spring
  // entrance oscillates around 1 while settling, which made a p >= 1 check
  // flicker the dot on and off at arbitrary positions along the line.
  const pulseDelay = Math.round(theme.motionFrames * 1.5);
  const pulseElapsed = frame - startFrame - pulseDelay;
  const pulseT = pulse && pulseElapsed >= 0 ? (pulseElapsed % 45) / 45 : null;
  const strokeW = Math.max(2, theme.stroke);
  const angle = (Math.atan2(ty - py, tx - px) * 180) / Math.PI;
  const mi = Math.floor((local.length - 1) / 2);
  const mid: Pt = [(local[mi][0] + local[mi + 1][0]) / 2, (local[mi][1] + local[mi + 1][1]) / 2];
  const pulseAt = pulseT !== null ? pointAt(pulseT) : null;

  return (
    <div style={{position: 'absolute', left: minX, top: minY, width: bw, height: bh, pointerEvents: 'none'}}>
      {/* data-arrow: start and tip in this svg's px, read by the arrow pile-up check */}
      <svg
        width={bw}
        height={bh}
        data-arrow={`${local[0][0]},${local[0][1]},${tx},${ty}`}
        data-arrow-drawn={p > 0.92 ? '1' : undefined}
      >
        <path
          data-link={label ?? 'arrow'}
          data-points={JSON.stringify(local)}
          data-free={free}
          data-diagonal={diagonal ? '1' : undefined}
          d={d}
          fill="none"
          stroke={c}
          strokeWidth={strokeW}
          strokeDasharray={dashed ? `10 8` : `${len}`}
          strokeDashoffset={dashed ? undefined : len - drawn}
          opacity={dashed ? p : 1}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <g transform={`translate(${tx}, ${ty}) rotate(${angle})`} opacity={p > 0.92 ? 1 : 0}>
          <path d={`M ${-head} ${-head * 0.55} L 0 0 L ${-head} ${head * 0.55} Z`} fill={c} />
        </g>
        {pulseAt ? (
          <circle
            data-marker="pulse"
            cx={pulseAt[0]}
            cy={pulseAt[1]}
            r={7}
            fill={theme.accent2}
            opacity={pulseT! < 0.08 ? pulseT! / 0.08 : pulseT! > 0.85 ? (1 - pulseT!) / 0.15 : 1}
          />
        ) : null}
      </svg>
      {label ? (
        <div
          data-link-label
          data-arrow-label
          style={{
            position: 'absolute',
            left: mid[0] + labelOffset.dx,
            top: mid[1] + labelOffset.dy,
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
