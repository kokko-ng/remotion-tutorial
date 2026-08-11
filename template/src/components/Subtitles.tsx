import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {useJson} from '../manifest/useJson';
import type {SubtitleChunk} from '../manifest/types';
import {useTheme} from '../theme/ThemeProvider';

/**
 * Burned-in subtitles for one scene, driven by the phrase chunks that
 * build_srt.py derives from Azure word boundaries. Rendered inside the
 * scene's Sequence, so frame 0 is the start of the scene audio.
 * Occupies the bottom band (below 82% height); keep scene content above it.
 */
export const Subtitles: React.FC<{sceneId: string}> = ({sceneId}) => {
  const theme = useTheme();
  const frame = useCurrentFrame();
  const {fps, height, width} = useVideoConfig();
  const chunks = useJson<SubtitleChunk[]>(`audio/${sceneId}.chunks.json`);
  if (!chunks) return null;

  const t = (frame / fps) * 1000;
  const active = chunks.find((c) => t >= c.startMs && t <= c.endMs + 180);
  if (!active) return null;

  const st = theme.subtitle;
  const tokens = active.text.split(' ');

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          marginBottom: height * 0.05,
          maxWidth: width * 0.78,
          padding: st.background ? '13px 30px' : 0,
          background: st.background ?? 'transparent',
          borderRadius: st.borderRadius,
          borderTop: st.topRule ? `1px solid ${theme.inkMuted}` : undefined,
          paddingTop: st.topRule ? 12 : undefined,
          fontFamily: st.fontFamily,
          fontSize: st.fontSize,
          fontWeight: 600,
          color: st.color,
          textAlign: 'center',
          textShadow: st.textShadow ?? undefined,
          lineHeight: 1.25,
        }}
      >
        <div
          style={{
            // optical correction: half the descender depth, so the cap-to-
            // descender extent of a typical line centers inside the pill
            transform: st.background ? 'translateY(-0.02em)' : undefined,
          }}
        >
          {st.karaoke && tokens.length === active.words.length
            ? tokens.map((tok, i) => (
                <span
                  key={i}
                  style={{color: t >= active.words[i].startMs ? st.karaokeColor : st.color}}
                >
                  {tok}
                  {i < tokens.length - 1 ? ' ' : ''}
                </span>
              ))
            : active.text}
        </div>
      </div>
    </AbsoluteFill>
  );
};
