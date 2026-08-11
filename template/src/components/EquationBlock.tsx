import React, {useMemo} from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import {useTheme} from '../theme/ThemeProvider';
import {useEntrance} from '../theme/motion';
import {Audit} from './layout/audit';

/**
 * A display-mode equation rendered with KaTeX, positioned inside SafeArea.
 */
export const EquationBlock: React.FC<{
  id?: string;
  tex: string;
  x: number;
  y: number;
  fontSize?: number;
  color?: string;
  startFrame?: number;
}> = ({id = 'equation', tex, x, y, fontSize = 44, color, startFrame = 0}) => {
  const theme = useTheme();
  const p = useEntrance(startFrame);
  const html = useMemo(
    () => katex.renderToString(tex, {displayMode: true, throwOnError: false}),
    [tex],
  );
  return (
    <Audit id={id}>
      <div
        style={{
          position: 'absolute',
          left: x,
          top: y,
          fontSize,
          color: color ?? theme.ink,
          opacity: p,
        }}
        dangerouslySetInnerHTML={{__html: html}}
      />
    </Audit>
  );
};
