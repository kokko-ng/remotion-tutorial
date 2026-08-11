/**
 * Aesthetic presets. Every color, font, radius, and motion parameter a scene
 * uses must come from here; scenes never hardcode visual values.
 */

export type MotionKind = 'draw' | 'spring' | 'snap' | 'fade';

export interface SubtitleStyle {
  fontFamily: string;
  fontSize: number;
  color: string;
  karaoke: boolean;
  karaokeColor: string;
  background: string | null;
  borderRadius: number;
  textShadow: string | null;
  topRule: boolean;
}

export interface Theme {
  name: string;
  bg: string;
  bgPanel: string;
  ink: string;
  inkMuted: string;
  /** Semantic accents. primary = current emphasis, others reserved for stable
   * diagram semantics within a video. */
  accent: string;
  accent2: string;
  accent3: string;
  warn: string;
  fontHeading: string;
  fontBody: string;
  fontMono: string;
  radius: number;
  stroke: number;
  motion: MotionKind;
  /** entrance duration in frames at 30fps */
  motionFrames: number;
  vignette: boolean;
  softShadow: string | null;
  subtitle: SubtitleStyle;
}

export const themes: Record<string, Theme> = {
  chalkboard: {
    name: 'chalkboard',
    bg: '#0e1117',
    bgPanel: '#161b26',
    ink: '#e8e6e3',
    inkMuted: '#9aa4b2',
    accent: '#58c4dd',
    accent2: '#f5d547',
    accent3: '#83c167',
    warn: '#fc6255',
    fontHeading: "'STIX Two Text', serif",
    fontBody: "'Inter', sans-serif",
    fontMono: "'JetBrains Mono', monospace",
    radius: 4,
    stroke: 2.5,
    motion: 'draw',
    motionFrames: 22,
    vignette: true,
    softShadow: null,
    subtitle: {
      fontFamily: "'Inter', sans-serif",
      fontSize: 44,
      color: '#e8e6e3',
      karaoke: false,
      karaokeColor: '#f5d547',
      background: null,
      borderRadius: 0,
      textShadow: '0 2px 12px rgba(14,17,23,0.9), 0 0 4px rgba(14,17,23,0.9)',
      topRule: false,
    },
  },
  paper: {
    name: 'paper',
    bg: '#faf3e3',
    bgPanel: '#f1e7d0',
    ink: '#3d3733',
    inkMuted: '#7a7166',
    accent: '#4f7ec2',
    accent2: '#e07856',
    accent3: '#7ca465',
    warn: '#c94f38',
    fontHeading: "'Nunito', sans-serif",
    fontBody: "'Nunito', sans-serif",
    fontMono: "'JetBrains Mono', monospace",
    radius: 24,
    stroke: 0,
    motion: 'spring',
    motionFrames: 20,
    vignette: false,
    softShadow: '0 6px 24px rgba(61,55,51,0.04)',
    subtitle: {
      fontFamily: "'Nunito', sans-serif",
      fontSize: 44,
      color: '#3d3733',
      karaoke: false,
      karaokeColor: '#4f7ec2',
      background: null,
      borderRadius: 0,
      textShadow: null,
      topRule: false,
    },
  },
  terminal: {
    name: 'terminal',
    bg: '#101418',
    bgPanel: '#171d24',
    ink: '#d6deeb',
    inkMuted: '#6b7a8c',
    accent: '#ffb454',
    accent2: '#7fd6c2',
    accent3: '#d16d9e',
    warn: '#ff6b6b',
    fontHeading: "'IBM Plex Mono', monospace",
    fontBody: "'IBM Plex Sans', sans-serif",
    fontMono: "'IBM Plex Mono', monospace",
    radius: 2,
    stroke: 1.5,
    motion: 'snap',
    motionFrames: 8,
    vignette: false,
    softShadow: null,
    subtitle: {
      fontFamily: "'IBM Plex Sans', sans-serif",
      fontSize: 42,
      color: '#d6deeb',
      karaoke: true,
      karaokeColor: '#ffb454',
      background: null,
      borderRadius: 0,
      textShadow: '0 2px 10px rgba(16,20,24,0.95)',
      topRule: false,
    },
  },
  print: {
    name: 'print',
    bg: '#f4f1ea',
    bgPanel: '#eae5da',
    ink: '#1a1a1a',
    inkMuted: '#5c5c56',
    accent: '#d0402b',
    accent2: '#33506b',
    accent3: '#7a7a5c',
    warn: '#d0402b',
    fontHeading: "'Source Serif 4', serif",
    fontBody: "'Inter', sans-serif",
    fontMono: "'IBM Plex Mono', monospace",
    radius: 0,
    stroke: 1,
    motion: 'fade',
    motionFrames: 10,
    vignette: false,
    softShadow: null,
    subtitle: {
      fontFamily: "'Inter', sans-serif",
      fontSize: 42,
      color: '#1a1a1a',
      karaoke: false,
      karaokeColor: '#d0402b',
      background: null,
      borderRadius: 0,
      textShadow: null,
      topRule: true,
    },
  },
};

export type PresetName = keyof typeof themes;
