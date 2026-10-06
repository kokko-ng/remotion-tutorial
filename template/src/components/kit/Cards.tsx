import React from 'react';
import {useCurrentFrame} from 'remotion';
import {useTheme} from '../../theme/ThemeProvider';
import {Audit} from '../layout/audit';
import {snap} from './motion';

export interface AdrOption {
  text: string;
  at: number;
  chosen?: boolean;
}

/**
 * A decision record on screen: the ADR number and question, then each
 * considered option revealed on its word. The chosen option gets the accent2
 * marker; rejected options are struck through in the warn colour once the
 * verdict lands at `verdictAt`. `why` is the record's own reason, verbatim
 * in spirit, shown last.
 */
export const AdrCard: React.FC<{
  id?: string;
  adr: string;
  question: string;
  options: AdrOption[];
  verdictAt: number;
  why?: string;
  whyAt?: number;
  x?: number;
  y?: number;
  w?: number;
  startFrame?: number;
}> = ({id = 'adr', adr, question, options, verdictAt, why, whyAt, x = 164, y = 20, w = 1400, startFrame = 0}) => {
  const theme = useTheme();
  const frame = useCurrentFrame();
  const p = snap(frame, startFrame, 6);
  const verdict = frame >= verdictAt;
  return (
    <Audit id={id}>
      <div
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: w,
          opacity: p > 0 ? 1 : 0,
          background: theme.bgPanel,
          border: `${theme.stroke}px solid ${theme.inkMuted}66`,
          borderRadius: theme.radius,
          padding: '28px 40px 32px',
        }}
      >
        <div style={{display: 'flex', alignItems: 'baseline', gap: 22}}>
          <div style={{fontFamily: theme.fontMono, fontSize: 34, fontWeight: 600, color: theme.accent, flexShrink: 0}}>{`ADR ${adr}`}</div>
          <div style={{fontFamily: theme.fontBody, fontSize: 40, fontWeight: 600, letterSpacing: '-0.01em', color: theme.ink, lineHeight: 1.25}}>{question}</div>
        </div>
        <div style={{marginTop: 22}}>
          {options.map((o, i) => {
            if (frame < o.at) return <div key={i} style={{height: 58}} />;
            const rejected = verdict && !o.chosen;
            const mark = verdict ? (o.chosen ? 'chosen' : 'rejected') : `option ${i + 1}`;
            return (
              <div key={i} style={{display: 'flex', alignItems: 'center', gap: 20, height: 58, opacity: snap(frame, o.at, 4)}}>
                <div
                  style={{
                    width: 150,
                    flexShrink: 0,
                    fontFamily: theme.fontMono,
                    fontSize: 22,
                    color: verdict ? (o.chosen ? theme.accent2 : theme.warn) : theme.inkMuted,
                  }}
                >
                  {mark}
                </div>
                <div
                  style={{
                    fontFamily: theme.fontBody,
                    fontSize: 32,
                    color: rejected ? theme.inkMuted : theme.ink,
                    textDecoration: rejected ? `line-through ${theme.warn}` : 'none',
                    fontWeight: verdict && o.chosen ? 600 : 400,
                  }}
                >
                  {o.text}
                </div>
              </div>
            );
          })}
        </div>
        {why && whyAt !== undefined && frame >= whyAt ? (
          <div style={{marginTop: 18, paddingTop: 16, borderTop: `1px solid ${theme.inkMuted}44`, fontFamily: theme.fontBody, fontSize: 30, color: theme.accent, opacity: snap(frame, whyAt, 4)}}>
            {why}
          </div>
        ) : null}
      </div>
    </Audit>
  );
};

export interface RecapRow {
  term: string;
  def: string;
  at: number;
}

/** Recap: terms and one-line definitions, each revealed as it is spoken. */
export const Recap: React.FC<{rows: RecapRow[]; x?: number; y?: number; w?: number; title?: string; startFrame?: number}> = ({
  rows,
  x = 64,
  y = 0,
  w = 1600,
  title = 'recap',
  startFrame = 0,
}) => {
  const theme = useTheme();
  const frame = useCurrentFrame();
  const rowH = Math.min(118, Math.floor(700 / Math.max(1, rows.length)));
  return (
    <>
      <Audit id="recap-title">
        <div style={{position: 'absolute', left: x, top: y, fontFamily: theme.fontMono, fontSize: 34, color: theme.accent, opacity: snap(frame, startFrame, 4)}}>
          {`$ cat ${title}.txt`}
        </div>
      </Audit>
      {rows.map((r, i) =>
        frame >= r.at ? (
          <Audit key={i} id={`recap-${i}`}>
            <div
              style={{
                position: 'absolute',
                left: x,
                top: y + 80 + i * rowH,
                width: w,
                display: 'flex',
                gap: 32,
                alignItems: 'baseline',
                opacity: snap(frame, r.at, 4),
              }}
            >
              <div style={{width: 430, flexShrink: 0, fontFamily: theme.fontMono, fontWeight: 600, fontSize: 32, color: theme.accent2}}>{r.term}</div>
              <div style={{fontFamily: theme.fontBody, fontSize: 30, lineHeight: 1.35, color: theme.ink}}>{r.def}</div>
            </div>
          </Audit>
        ) : null,
      )}
    </>
  );
};

/**
 * The episode sting at the end of a cold open: the episode number and the
 * title on one baseline, wiped in left to right by a clip-path reveal (the
 * chapter's one authored transition). The number is a real sequence position
 * in a ten-episode series, not decoration.
 */
export const EpisodeSting: React.FC<{ep: string; title: string; at: number; until?: number}> = ({ep, title, at, until}) => {
  const theme = useTheme();
  const frame = useCurrentFrame();
  if (frame < at || (until !== undefined && frame >= until)) return null;
  const p = snap(frame, at, 6);
  return (
    <>
      {/* the sting owns the frame: a hard cut to the bare background */}
      <div style={{position: 'absolute', left: -96, top: -54, width: 1920, height: 1080, background: theme.bg}} />
      <Audit id="episode-sting">
      <div
        style={{
          position: 'absolute',
          left: 120,
          top: 300,
          width: 1488,
          display: 'flex',
          alignItems: 'baseline',
          gap: 40,
          clipPath: `inset(0 ${100 - 100 * p}% 0 0)`,
        }}
      >
        <div style={{fontFamily: theme.fontMono, fontSize: 96, fontWeight: 600, color: theme.accent, flexShrink: 0}}>{ep}</div>
        <div style={{fontFamily: theme.fontBody, fontSize: 80, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.08, color: theme.ink}}>{title}</div>
      </div>
      </Audit>
    </>
  );
};
