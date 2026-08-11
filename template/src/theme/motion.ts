import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {useTheme} from './ThemeProvider';

const drawEase = Easing.bezier(0.33, 0, 0.15, 1);

/**
 * Entrance progress (0..1) for an element appearing at `startFrame`
 * (scene-relative), following the preset's motion language.
 */
export const useEntrance = (startFrame: number, durationScale = 1): number => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const theme = useTheme();
  const f = frame - startFrame;
  const dur = Math.max(1, Math.round(theme.motionFrames * durationScale));
  if (f < 0) return 0;
  switch (theme.motion) {
    case 'spring':
      return spring({frame: f, fps, config: {damping: 14, mass: 0.8}});
    case 'snap': {
      const steps = 3;
      const raw = Math.min(1, (f + 1) / dur);
      return Math.ceil(raw * steps) / steps;
    }
    case 'fade':
      return interpolate(f, [0, dur], [0, 1], {extrapolateRight: 'clamp'});
    case 'draw':
    default:
      return interpolate(f, [0, dur], [0, 1], {
        easing: drawEase,
        extrapolateRight: 'clamp',
      });
  }
};
