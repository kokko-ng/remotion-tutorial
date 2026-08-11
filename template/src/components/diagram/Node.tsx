import React from 'react';
import {useTheme} from '../../theme/ThemeProvider';
import {useEntrance} from '../../theme/motion';
import {Audit} from '../layout/audit';

/**
 * A labeled box, the basic unit of architecture and circuit diagrams.
 * Positioned absolutely inside SafeArea. Entrance follows the preset:
 * chalkboard draws the outline on, paper springs in filled, terminal snaps,
 * print fades.
 */
export const Node: React.FC<{
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  sublabel?: string;
  color?: string;
  startFrame?: number;
  /** filled=true uses a translucent fill of the color; paper always fills */
  filled?: boolean;
}> = ({id, x, y, w, h, label, sublabel, color, startFrame = 0, filled = false}) => {
  const theme = useTheme();
  const p = useEntrance(startFrame);
  const c = color ?? theme.accent;
  const isPaper = theme.motion === 'spring';
  const scale = isPaper ? 0.7 + 0.3 * p : 1;

  const perimeter = 2 * (w + h);
  const strokeProgress = Math.min(1, p / 0.75);
  const fillOpacity = Math.max(0, (p - 0.6) / 0.4);

  return (
    <Audit id={id}>
      <div
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: w,
          height: h,
          opacity: isPaper ? Math.min(1, p * 2) : p < 0.02 ? 0 : 1,
          transform: `scale(${scale})`,
          transformOrigin: 'center',
        }}
      >
        {isPaper ? (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: c,
              borderRadius: theme.radius,
              boxShadow: theme.softShadow ?? undefined,
            }}
          />
        ) : (
          <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
            <rect
              x={theme.stroke}
              y={theme.stroke}
              width={w - 2 * theme.stroke}
              height={h - 2 * theme.stroke}
              rx={theme.radius}
              fill={filled ? c : theme.bgPanel}
              fillOpacity={filled ? 0.18 * fillOpacity : fillOpacity}
              stroke={c}
              strokeWidth={theme.stroke}
              strokeDasharray={perimeter}
              strokeDashoffset={perimeter * (1 - strokeProgress)}
            />
          </svg>
        )}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            padding: '0 12px',
            opacity: isPaper ? p : fillOpacity,
          }}
        >
          <div
            style={{
              fontFamily: theme.fontBody,
              fontSize: Math.min(34, h * 0.3),
              fontWeight: 600,
              color: isPaper ? theme.bg : theme.ink,
              lineHeight: 1.2,
            }}
          >
            {label}
          </div>
          {sublabel ? (
            <div
              style={{
                fontFamily: theme.fontMono,
                fontSize: Math.min(22, h * 0.19),
                color: isPaper ? theme.bg : theme.inkMuted,
                opacity: isPaper ? 0.75 : 1,
                marginTop: 6,
              }}
            >
              {sublabel}
            </div>
          ) : null}
        </div>
      </div>
    </Audit>
  );
};
