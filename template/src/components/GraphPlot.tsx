import React from 'react';
import {interpolate} from 'remotion';
import {useTheme} from '../theme/ThemeProvider';
import {useEntrance} from '../theme/motion';
import {Audit} from './layout/audit';

export interface PlotPoint {
  x: number; // 0..1 across the plot width
  y: number; // 0..1 up the plot height
}

/**
 * Axes plus one animated curve that draws on. Points are normalized (0..1).
 * A marker dot rides the tip of the curve while it draws.
 */
export const GraphPlot: React.FC<{
  id?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  points: PlotPoint[];
  xLabel?: string;
  yLabel?: string;
  color?: string;
  startFrame?: number;
  /** frames the curve takes to draw after the axes appear */
  drawFrames?: number;
  /** frames after startFrame before the curve begins (defaults to the
   * entrance duration, so the curve follows the axes immediately) */
  curveDelayFrames?: number;
  showDot?: boolean;
}> = ({id = 'graph', x, y, w, h, points, xLabel, yLabel, color, startFrame = 0, drawFrames = 50, curveDelayFrames, showDot = true}) => {
  const theme = useTheme();
  const pAxes = useEntrance(startFrame);
  const curveStart = startFrame + (curveDelayFrames ?? theme.motionFrames);
  const pCurve = useEntrance(curveStart, drawFrames / theme.motionFrames);
  const c = color ?? theme.accent;

  const margin = 54;
  const plotW = w - margin * 2;
  const plotH = h - margin * 2;
  const px = (pt: PlotPoint) => margin + pt.x * plotW;
  const py = (pt: PlotPoint) => margin + (1 - pt.y) * plotH;

  const path = points
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${px(pt).toFixed(2)} ${py(pt).toFixed(2)}`)
    .join(' ');
  let pathLen = 0;
  for (let i = 1; i < points.length; i++) {
    pathLen += Math.hypot(px(points[i]) - px(points[i - 1]), py(points[i]) - py(points[i - 1]));
  }

  const tipIndex = Math.max(
    1,
    Math.min(points.length - 1, Math.floor(pCurve * (points.length - 1))),
  );
  const tip = points[tipIndex];

  return (
    <Audit id={id}>
      <div style={{position: 'absolute', left: x, top: y, width: w, height: h}}>
        <svg width={w} height={h}>
          {/* axes */}
          <line
            x1={margin}
            y1={h - margin}
            x2={margin + plotW * pAxes}
            y2={h - margin}
            stroke={theme.inkMuted}
            strokeWidth={2}
          />
          <line
            x1={margin}
            y1={h - margin}
            x2={margin}
            y2={h - margin - plotH * pAxes}
            stroke={theme.inkMuted}
            strokeWidth={2}
          />
          <path
            d={path}
            fill="none"
            stroke={c}
            strokeWidth={Math.max(3, theme.stroke)}
            strokeLinecap="round"
            strokeDasharray={pathLen}
            strokeDashoffset={pathLen * (1 - pCurve)}
          />
          {showDot && pCurve > 0.01 && pCurve < 1 ? (
            <circle cx={px(tip)} cy={py(tip)} r={8} fill={c} />
          ) : null}
        </svg>
        {xLabel ? (
          <div
            style={{
              position: 'absolute',
              bottom: 6,
              left: margin,
              width: plotW,
              textAlign: 'center',
              fontFamily: theme.fontBody,
              fontSize: 26,
              color: theme.inkMuted,
              opacity: pAxes,
            }}
          >
            {xLabel}
          </div>
        ) : null}
        {yLabel ? (
          <div
            style={{
              position: 'absolute',
              top: margin - 40,
              left: 0,
              fontFamily: theme.fontBody,
              fontSize: 26,
              color: theme.inkMuted,
              opacity: pAxes,
              whiteSpace: 'nowrap',
            }}
          >
            {yLabel}
          </div>
        ) : null}
      </div>
    </Audit>
  );
};
