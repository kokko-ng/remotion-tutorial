import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {diagrams, type DiagramName} from '../../assets/diagrams.generated';
import {useTheme} from '../../theme/ThemeProvider';
import {Audit} from '../layout/audit';
import {snap, snapEase} from './motion';

/** A normalized rectangle on the diagram: [x0, y0, x1, y1], each 0..1. */
export type NRect = [number, number, number, number];

export interface Focus {
  /** scene-relative frame where the camera starts moving to this rect */
  at: number;
  rect: NRect;
}

export interface Mark {
  at: number;
  until?: number;
  rect: NRect;
  label?: string;
}

/** Union of a diagram's node and label boxes, padded, in viewBox units. */
const contentBounds = (name: DiagramName): {x: number; y: number; w: number; h: number} => {
  const d = diagrams[name];
  const boxes: [number, number, number, number][] = [
    ...Object.values(d.regions as Record<string, {box: [number, number, number, number]}>).map((r) => r.box),
    ...(d.labels as [number, number, number, number][]),
  ];
  if (boxes.length === 0) return {x: 0, y: 0, w: d.vbW, h: d.vbH};
  const pad = 16;
  const x0 = Math.max(0, Math.min(...boxes.map((b) => b[0])) - pad);
  const y0 = Math.max(0, Math.min(...boxes.map((b) => b[1])) - pad);
  const x1 = Math.min(d.vbW, Math.max(...boxes.map((b) => b[0] + b[2])) + pad);
  const y1 = Math.min(d.vbH, Math.max(...boxes.map((b) => b[1] + b[3])) + pad);
  return {x: x0, y: y0, w: x1 - x0, h: y1 - y0};
};

/** Frames a whole-diagram establishing view may last before the first zoom. */
export const OVERVIEW_MAX_FRAMES = 45;

/**
 * One of the repository's architecture diagrams, drawn straight onto the
 * dark background. `name` keys src/assets/diagrams.generated.ts, produced by
 * tools/darken_diagrams.py from the diagram's own HTML source: same nodes,
 * arrows, labels and Azure icons, recoloured for the terminal theme. Inline
 * SVG keeps text sharp at any zoom. The camera snaps between focus
 * rectangles (Fireship-style punch-ins) and marks outline a region. `source`
 * is the repository path shown as a small credit in the corner.
 */
export const DiagramShot: React.FC<{
  id?: string;
  name: DiagramName;
  source: string;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  startFrame?: number;
  focus?: Focus[];
  marks?: Mark[];
}> = ({id = 'diagram', name, source, x = 0, y = 0, w = 1728, h = 800, startFrame = 0, focus = [], marks = []}) => {
  const theme = useTheme();
  const frame = useCurrentFrame();
  const {svg, vbW, vbH} = diagrams[name];
  // Content bounds (nodes and labels), so a whole-diagram view is centred on the
  // drawing rather than on a viewBox that may carry empty margins on one side.
  const content = contentBounds(name);
  const labelH = 48; // label (about 29px) plus the 16px minimum gap to the diagram
  const vw = w;
  const vh = h - labelH;
  const fit = Math.min(vw / content.w, vh / content.h);

  const cam = (r: NRect) => {
    const rw = (r[2] - r[0]) * vbW;
    const rh = (r[3] - r[1]) * vbH;
    return {s: Math.min(vw / rw, vh / rh), cx: ((r[0] + r[2]) / 2) * vbW, cy: ((r[1] + r[3]) / 2) * vbH};
  };
  const whole = {s: fit, cx: content.x + content.w / 2, cy: content.y + content.h / 2};
  // Moves chain: each focus starts from the previous target. Focus stops are
  // spaced further apart than the 9-frame move, so a move always completes.
  let prev = whole;
  let cur = whole;
  for (const f of [...focus].sort((a, b) => a.at - b.at)) {
    if (frame < f.at) break;
    const target = cam(f.rect);
    const t = interpolate(frame, [f.at, f.at + 9], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: snapEase,
    });
    cur = {s: prev.s + (target.s - prev.s) * t, cx: prev.cx + (target.cx - prev.cx) * t, cy: prev.cy + (target.cy - prev.cy) * t};
    prev = target;
  }
  const {s, cx, cy} = cur;
  const p = snap(frame, startFrame, 6);
  const sortedFocus = [...focus].sort((a, b) => a.at - b.at);
  const moving = sortedFocus.some((f) => frame >= f.at && frame < f.at + 9);
  // A whole-diagram view is allowed only as a short establishing shot before
  // the first zoom; after that every label in view must be legible.
  const firstFocus = sortedFocus.length > 0 ? sortedFocus[0].at : Infinity;
  const overview = frame < firstFocus && frame - startFrame <= OVERVIEW_MAX_FRAMES;

  // Legibility probe: the viewport carries the camera scale; the layout
  // audit measures every diagram label in view against MIN_TEXT_PX (SVG font
  // size in viewBox units times this scale, in page pixels).

  return (
    <>
      <Audit id={id}>
        <div
          data-clip-intended
          data-diagram-scale={s}
          data-moving={moving ? '1' : undefined}
          data-overview={overview ? '1' : undefined}
          data-whole-view={frame < firstFocus ? '1' : undefined}
          style={{position: 'absolute', left: x, top: y + labelH, width: vw, height: vh, overflow: 'hidden', opacity: p}}
        >
          <div
            style={{position: 'absolute', left: vw / 2 - cx * s, top: vh / 2 - cy * s, width: vbW * s, height: vbH * s}}
          >
            <div
              style={{width: '100%', height: '100%'}}
              // The SVG is generated locally from the repository's own diagram sources.
              dangerouslySetInnerHTML={{__html: svg.replace('<svg class="figure-dark"', '<svg class="figure-dark" width="100%" height="100%"')}}
            />
            {marks
              .filter((m) => frame >= m.at && (m.until === undefined || frame < m.until))
              .map((m, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `${m.rect[0] * 100}%`,
                    top: `${m.rect[1] * 100}%`,
                    width: `${(m.rect[2] - m.rect[0]) * 100}%`,
                    height: `${(m.rect[3] - m.rect[1]) * 100}%`,
                    outline: `3px solid ${theme.accent}`,
                    outlineOffset: 6,
                    borderRadius: theme.radius,
                  }}
                >
                  {m.label ? (
                    <div
                      style={{
                        position: 'absolute',
                        left: 'calc(100% + 14px)',
                        top: -6,
                        background: theme.accent,
                        color: theme.bg,
                        fontFamily: theme.fontMono,
                        fontSize: 22,
                        fontWeight: 600,
                        padding: '3px 10px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {m.label}
                    </div>
                  ) : null}
                </div>
              ))}
          </div>
        </div>
      </Audit>
      <Audit id={`${id}-source`}>
        <div data-composition-ignore style={{position: 'absolute', left: x, top: y, fontFamily: theme.fontMono, fontSize: 22, color: theme.inkMuted, opacity: p}}>
          {`// ${source}`}
        </div>
      </Audit>
    </>
  );
};
