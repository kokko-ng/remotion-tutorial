import React from 'react';
import {Img, staticFile, useCurrentFrame} from 'remotion';
import {useTheme} from '../../theme/ThemeProvider';
import {Audit} from '../layout/audit';
import {images, type ImageId, type ImageMeta} from '../../assets/images';
import {snap} from './motion';
import {Window} from './Window';

/**
 * A full image cut: an image from the credits registry in a window, with a
 * caption under it and the short credit line in the window's title bar, so
 * every image on screen carries its source. A slow push-in (3 percent over
 * the shot) keeps a still image from reading as a freeze frame.
 */
export const ImageCut: React.FC<{
  id?: string;
  image: ImageId;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  at: number;
  until?: number;
  caption?: string;
}> = ({id = 'image', image, x = 264, y = 20, w = 1200, h = 700, at, until, caption}) => {
  const theme = useTheme();
  const frame = useCurrentFrame();
  if (frame < at || (until !== undefined && frame >= until)) return null;
  const meta: ImageMeta | undefined = (images as Record<string, ImageMeta>)[image];
  if (!meta) throw new Error(`image "${image}" is not in the credits registry`);
  const span = until !== undefined ? until - at : 120;
  const push = 1 + 0.03 * Math.min(1, (frame - at) / Math.max(1, span));
  return (
    <>
      <Window id={id} x={x} y={y} w={w} h={h} title={meta.credit} startFrame={at}>
        <Img
          src={staticFile(`images/${meta.file}`)}
          style={{width: '100%', height: '100%', objectFit: 'cover', scale: String(push)}}
        />
      </Window>
      {caption ? (
        <Audit id={`${id}-caption`}>
          <div
            style={{
              position: 'absolute',
              left: x,
              top: y + h + 18,
              width: w,
              textAlign: 'center',
              fontFamily: theme.fontMono,
              fontSize: 30,
              color: theme.accent,
              opacity: snap(frame, at + 4, 4),
            }}
          >
            {caption}
          </div>
        </Audit>
      ) : null}
    </>
  );
};

/**
 * An official Azure architecture icon with its full service name beneath it.
 * The icon is shown exactly as published, at uniform scale: the icon terms
 * forbid cropping, flipping, rotating, distorting or drawing over it, and
 * require the name nearby. An icon may only represent the service it was made
 * for, so a service without its own icon (for example Azure Managed Redis)
 * passes no `icon` and gets a plain name tile instead. `crossed` marks a
 * service that is not used by striking through its name, never the icon.
 */
export const AzureIcon: React.FC<{
  id: string;
  /** file in public/icons without .svg; omit when the service has no official icon */
  icon?: string;
  name: string;
  sub?: string;
  x: number;
  y: number;
  size?: number;
  at: number;
  until?: number;
  dim?: boolean;
  crossed?: boolean;
}> = ({id, icon, name, sub, x, y, size = 120, at, until, dim = false, crossed = false}) => {
  const theme = useTheme();
  const frame = useCurrentFrame();
  if (frame < at || (until !== undefined && frame >= until)) return null;
  const p = snap(frame, at, 5);
  const w = Math.max(size * 2, 260);
  return (
    <Audit id={id}>
      <div style={{position: 'absolute', left: x - w / 2, top: y, width: w, textAlign: 'center', opacity: dim ? 0.45 : 1, scale: String(0.9 + 0.1 * p)}}>
        {icon ? (
          <Img src={staticFile(`icons/${icon}.svg`)} style={{width: size, height: size, display: 'block', margin: '0 auto'}} />
        ) : (
          <div
            style={{
              width: size,
              height: size,
              margin: '0 auto',
              border: `2px solid ${theme.inkMuted}`,
              borderRadius: theme.radius,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: theme.fontMono,
              fontSize: Math.round(size * 0.14),
              color: theme.inkMuted,
              padding: 8,
              boxSizing: 'border-box',
            }}
          >
            no official icon
          </div>
        )}
        <div
          style={{
            marginTop: 14,
            fontFamily: theme.fontBody,
            fontWeight: 600,
            fontSize: 28,
            color: crossed ? theme.inkMuted : theme.ink,
            textDecoration: crossed ? `line-through 3px ${theme.warn}` : 'none',
          }}
        >
          {name}
        </div>
        {crossed ? <div style={{marginTop: 4, fontFamily: theme.fontMono, fontSize: 22, color: theme.warn}}>not used</div> : null}
        {sub ? <div style={{marginTop: 4, fontFamily: theme.fontMono, fontSize: 22, color: theme.inkMuted}}>{sub}</div> : null}
      </div>
    </Audit>
  );
};
