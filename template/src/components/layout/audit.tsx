import React, {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';

/**
 * Layout audit for the aesthetic review loop. Scenes wrap elements that must
 * never overlap each other (and must stay inside the 5% safe margin) in
 * <Audit id="...">. When the chapter is rendered with
 * --props='{"debugLayout":true}', an overlay outlines every audited element:
 * blue when fine, red when it overlaps a sibling or breaks the safe margin.
 * Do not wrap connectors (arrows/edges); they legitimately cross nodes.
 */

type Rect = {x: number; y: number; w: number; h: number};
type Registry = Map<string, HTMLElement>;

interface AuditApi {
  register: (id: string, el: HTMLElement) => void;
  unregister: (id: string) => void;
}

const AuditContext = createContext<AuditApi | null>(null);

export const AuditProvider: React.FC<{
  enabled: boolean;
  children: React.ReactNode;
}> = ({enabled, children}) => {
  const [registry] = useState<Registry>(() => new Map());
  // bumped on every register/unregister so the overlay re-measures after
  // scenes mount content asynchronously (e.g. once word timings load)
  const [version, setVersion] = useState(0);
  const [api] = useState<AuditApi>(() => ({
    register: (id, el) => {
      registry.set(id, el);
      setVersion((v) => v + 1);
    },
    unregister: (id) => {
      registry.delete(id);
      setVersion((v) => v + 1);
    },
  }));
  if (!enabled) return <>{children}</>;
  return (
    <AuditContext.Provider value={api}>
      {children}
      <AuditOverlay registry={registry} version={version} />
    </AuditContext.Provider>
  );
};

export const Audit: React.FC<{id: string; children: React.ReactNode}> = ({
  id,
  children,
}) => {
  const api = useContext(AuditContext);
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (api && el) {
      api.register(id, el);
      return () => api.unregister(id);
    }
  }, [api, id]);
  return (
    <div ref={ref} style={{display: 'contents'}}>
      {children}
    </div>
  );
};

const unionChildRects = (el: HTMLElement): DOMRect | null => {
  let acc: DOMRect | null = null;
  for (const child of Array.from(el.children)) {
    const r = (child as HTMLElement).getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (!acc) {
      acc = DOMRect.fromRect(r);
    } else {
      const x1 = Math.min(acc.x, r.x);
      const y1 = Math.min(acc.y, r.y);
      const x2 = Math.max(acc.right, r.right);
      const y2 = Math.max(acc.bottom, r.bottom);
      acc = new DOMRect(x1, y1, x2 - x1, y2 - y1);
    }
  }
  return acc;
};

const intersects = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

const AuditOverlay: React.FC<{registry: Registry; version: number}> = ({
  registry,
  version,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const containerRef = useRef<HTMLDivElement>(null);
  const [boxes, setBoxes] = useState<{id: string; rect: Rect; bad: boolean}[]>([]);

  useLayoutEffect(() => {
    const c = containerRef.current?.getBoundingClientRect();
    if (!c || c.width === 0) return;
    const sx = width / c.width;
    const sy = height / c.height;
    const items: {id: string; rect: Rect}[] = [];
    for (const [id, el] of registry) {
      const m = unionChildRects(el);
      if (!m) continue;
      items.push({
        id,
        rect: {x: (m.x - c.x) * sx, y: (m.y - c.y) * sy, w: m.width * sx, h: m.height * sy},
      });
    }
    const bad = new Set<string>();
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        if (intersects(items[i].rect, items[j].rect)) {
          bad.add(items[i].id);
          bad.add(items[j].id);
        }
      }
    }
    const mx = width * 0.05;
    const my = height * 0.05;
    for (const it of items) {
      const r = it.rect;
      if (r.x < mx - 1 || r.y < my - 1 || r.x + r.w > width - mx + 1 || r.y + r.h > height - my + 1) {
        bad.add(it.id);
      }
    }
    const next = items.map((it) => ({...it, bad: bad.has(it.id)}));
    setBoxes((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
  }, [frame, registry, version, width, height]);

  const mx = width * 0.05;
  const my = height * 0.05;
  return (
    <AbsoluteFill ref={containerRef} style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          left: mx,
          top: my,
          width: width - 2 * mx,
          height: height - 2 * my,
          border: '1px dashed rgba(0,180,255,0.5)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: height * 0.82,
          width,
          borderTop: '1px dashed rgba(255,180,0,0.5)',
        }}
      />
      {boxes.map((b) => (
        <div
          key={b.id}
          style={{
            position: 'absolute',
            left: b.rect.x,
            top: b.rect.y,
            width: b.rect.w,
            height: b.rect.h,
            outline: `3px solid ${b.bad ? '#ff0033' : 'rgba(0,150,255,0.65)'}`,
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: -22,
              left: 0,
              fontSize: 16,
              fontFamily: 'monospace',
              color: b.bad ? '#ff0033' : 'rgba(0,150,255,0.9)',
              whiteSpace: 'nowrap',
            }}
          >
            {b.id}
          </span>
        </div>
      ))}
    </AbsoluteFill>
  );
};
