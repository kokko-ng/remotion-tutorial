import {Easing, interpolate} from 'remotion';

/** Snap easing for Fireship-style punch-ins: fast attack, no overshoot. */
export const snapEase = Easing.bezier(0.2, 0.9, 0.1, 1);

/** 0..1 progress of a quick move that starts at `start` and lasts `dur` frames. */
export const snap = (frame: number, start: number, dur = 7): number =>
  interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: snapEase,
  });

/** Visible window helper: true from `from` (inclusive) until `to` (exclusive). */
export const within = (frame: number, from: number, to = Infinity): boolean =>
  frame >= from && frame < to;
