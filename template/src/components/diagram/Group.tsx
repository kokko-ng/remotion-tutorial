import React from 'react';
import {useTheme} from '../../theme/ThemeProvider';
import {useEntrance} from '../../theme/motion';
import {Audit} from '../layout/audit';

/**
 * A boundary box that visually contains other nodes (VNet, subnet, module).
 * The title sits inside the top-left corner. Children are NOT rendered by
 * this component; place Nodes at coordinates inside the group's area.
 * Audited via its own frame only; contained nodes overlapping the group
 * area is intended, so the audit box is the title, not the outline.
 */
export const Group: React.FC<{
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  color?: string;
  startFrame?: number;
}> = ({id, x, y, w, h, title, color, startFrame = 0}) => {
  const theme = useTheme();
  const p = useEntrance(startFrame);
  const c = color ?? theme.inkMuted;
  const perimeter = 2 * (w + h);
  return (
    <>
      <div style={{position: 'absolute', left: x, top: y, width: w, height: h, pointerEvents: 'none'}}>
        <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
          <rect
            x={1.5}
            y={1.5}
            width={w - 3}
            height={h - 3}
            rx={theme.radius}
            fill="none"
            stroke={c}
            strokeWidth={1.5}
            strokeDasharray={theme.motion === 'draw' ? perimeter : '8 8'}
            strokeDashoffset={theme.motion === 'draw' ? perimeter * (1 - p) : undefined}
            opacity={theme.motion === 'draw' ? 1 : p}
          />
        </svg>
      </div>
      <Audit id={id}>
        <div
          style={{
            position: 'absolute',
            left: x + 18,
            top: y + 12,
            fontFamily: theme.fontMono,
            fontSize: 24,
            fontWeight: 600,
            color: c,
            opacity: p,
            background: theme.bg,
            padding: '0 8px',
          }}
        >
          {title}
        </div>
      </Audit>
    </>
  );
};
