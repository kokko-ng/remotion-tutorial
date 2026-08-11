import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {useTheme} from '../theme/ThemeProvider';
import {useEntrance} from '../theme/motion';
import {Audit} from './layout/audit';

/**
 * Full-screen title. Keep titles to one line and subtitles to one sentence.
 */
export const TitleCard: React.FC<{
  title: string;
  subtitle?: string;
  startFrame?: number;
}> = ({title, subtitle, startFrame = 0}) => {
  const theme = useTheme();
  const p = useEntrance(startFrame, 1.4);
  const pSub = useEntrance(startFrame + Math.round(theme.motionFrames * 0.8), 1.4);
  const scale = theme.motion === 'spring' ? 0.9 + 0.1 * p : 1;

  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <Audit id="title-card">
        <div style={{textAlign: 'center', transform: `scale(${scale})`, maxWidth: '80%'}}>
          <div
            style={{
              fontFamily: theme.fontHeading,
              fontSize: 96,
              fontWeight: 700,
              color: theme.ink,
              opacity: p,
              lineHeight: 1.15,
            }}
          >
            {title}
          </div>
          <div
            style={{
              height: 4,
              width: interpolate(p, [0, 1], [0, 340]),
              background: theme.accent,
              margin: '28px auto 0',
              borderRadius: 2,
            }}
          />
          {subtitle ? (
            <div
              style={{
                fontFamily: theme.fontBody,
                fontSize: 40,
                fontWeight: 400,
                color: theme.inkMuted,
                opacity: pSub,
                marginTop: 30,
                lineHeight: 1.4,
              }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>
      </Audit>
    </AbsoluteFill>
  );
};
