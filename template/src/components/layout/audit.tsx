import React, {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {runLayoutChecks, type Rect} from './checks';

/**
 * Layout audit for the aesthetic review loop. Scenes wrap elements that must
 * never overlap each other (and must stay inside the 5% safe margin) in
 * <Audit id="...">. When the chapter is rendered with
 * --props='{"debugLayout":true}', an overlay outlines every audited element:
 * blue when fine, red when it overlaps a sibling or breaks the safe margin.
 * Do not wrap connectors (arrows/edges); they legitimately cross nodes.
 *
 * The overlay also runs runLayoutChecks (checks.ts): text overflowing any
 * [data-fit] container, text too close to a bordered container's edge, blocks
 * closer than RULES.minGap, and anything outside the safe area or inside the
 * subtitle band. Every finding is logged as "[layout] <scene> f<frame> <id>"
 * so scripts/layout_sweep.sh can collect them across a whole chapter.
 */

type Registry = Map<string, HTMLElement>;

interface AuditApi {
  register: (id: string, el: HTMLElement) => void;
  unregister: (id: string) => void;
}

const AuditContext = createContext<AuditApi | null>(null);

export const AuditProvider: React.FC<{
  enabled: boolean;
  sceneId?: string;
  children: React.ReactNode;
}> = ({enabled, sceneId = '', children}) => {
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
      <AbsoluteFill data-audit-scope>
        {children}
        <AuditOverlay registry={registry} version={version} sceneId={sceneId} />
      </AbsoluteFill>
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

const AuditOverlay: React.FC<{registry: Registry; version: number; sceneId: string}> = ({
  registry,
  version,
  sceneId,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const containerRef = useRef<HTMLDivElement>(null);
  const [boxes, setBoxes] = useState<{id: string; rect: Rect; bad: boolean}[]>([]);

  useLayoutEffect(() => {
    const c = containerRef.current?.getBoundingClientRect();
    const scope = containerRef.current?.parentElement;
    if (!c || c.width === 0 || !scope) return;
    const sx = width / c.width;
    const sy = height / c.height;
    const toFrame = (m: DOMRect): Rect => ({x: (m.x - c.x) * sx, y: (m.y - c.y) * sy, w: m.width * sx, h: m.height * sy});
    const audited: {id: string; el: HTMLElement; rect: Rect}[] = [];
    for (const [id, el] of registry) {
      const m = unionChildRects(el);
      if (!m) continue;
      audited.push({id, el, rect: toFrame(m)});
    }
    const findings = runLayoutChecks({
      scope,
      audited,
      toFrame,
      scale: 1 / sx,
      isScene: !sceneId.endsWith(':chrome'),
      width,
      height,
    });
    const badIds = new Set(findings.map((f) => f.id.split(':')[1]?.split(/[+(]/)[0]));
    const next = [
      ...audited.map((a) => ({id: a.id, rect: a.rect, bad: badIds.has(a.id)})),
      ...findings.map((f) => ({id: f.id, rect: f.rect, bad: true})),
    ];
    for (const f of findings) console.warn(`[layout] ${sceneId} f${frame} ${f.id}`);
    // Visual density (text runs, images, audited blocks): scripts/export_stills.sh
    // uses it to pick each scene's fullest frame.
    const walker = scope.ownerDocument.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
    let runs = 0;
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const p = n.parentElement;
      if (n.textContent?.trim() && p && !p.closest('[data-subtitles],[data-audit-overlay]')) runs++;
    }
    const imgs = scope.querySelectorAll('img').length;
    // Lowest painted content (frame y), for the scene-level empty-space rule.
    let bottom = 0;
    const scan = scope.ownerDocument.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
    const rg = scope.ownerDocument.createRange();
    for (let n = scan.nextNode(); n; n = scan.nextNode()) {
      const p = n.parentElement;
      if (!n.textContent?.trim() || !p || p.closest('[data-subtitles],[data-audit-overlay]')) continue;
      rg.selectNodeContents(n);
      const r = rg.getBoundingClientRect();
      if (r.height > 0) bottom = Math.max(bottom, (r.bottom - c.y) * sy);
    }
    scope.querySelectorAll('img,svg,[data-fit]').forEach((el) => {
      if ((el as HTMLElement).closest('[data-audit-overlay],[data-subtitles]')) return;
      const r = el.getBoundingClientRect();
      if (r.height > 0) bottom = Math.max(bottom, (r.bottom - c.y) * sy);
    });
    console.log(`[density] ${sceneId} f${frame} ${runs + imgs * 4 + audited.length} b${Math.round(bottom)}`);
    setBoxes((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
  }, [frame, registry, version, width, height, sceneId]);

  const mx = width * 0.05;
  const my = height * 0.05;
  return (
    <AbsoluteFill ref={containerRef} data-audit-overlay style={{pointerEvents: 'none'}}>
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
