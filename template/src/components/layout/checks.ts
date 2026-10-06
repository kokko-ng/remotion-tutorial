/**
 * Layout rules enforced by the debug audit and the automated sweep
 * (scripts/layout_sweep.sh). Values are composition pixels at 1920x1080;
 * edit them here if a project adds chrome (a header strip, a side rail).
 */
export const RULES = {
  /** Safe area (5 percent): nothing, text or audited block, outside it. */
  safeX: 96,
  safeY: 54,
  /** Scene content must end above this y (SafeArea y=820; subtitles start at 886). */
  contentBottom: 874,
  /** Scene content must start below this y (raise it when a header strip exists). */
  contentTop: 54,
  /** Minimum gap between separate audited blocks. */
  minGap: 16,
  /** Minimum inset between text and the border of a bordered container. */
  minInset: 8,
  /** Horizontal overflow tolerance in px. */
  overflowTol: 2,
  /** Vertical tolerance as a fraction of font size (font ascent/descent exceed tight line boxes). */
  vTolFrac: 0.3,
  /** Smallest on-screen size, in px, of any diagram label in view on a settled frame. */
  minLabelPx: 16,
  /** A composition at least this wide (fraction of the safe width) must be centred... */
  centreMinWidth: 0.6,
  /** ...within this fraction of the safe width. */
  centreTol: 0.05,
  /** Items at least this wide (fraction of the safe width) are full-width, not a column. */
  fullWidthFrac: 0.85,
  /** Side-by-side columns start within this many px of each other. */
  columnTopTol: 24,
  /** Two arrow heads must be at least this far apart. */
  arrowTipGap: 10,
  /** An arrow end must land within this distance of a box, image or text (or a zone outline). */
  linkEndGap: 10,
  /** Shortest visible connector; anything shorter reads as a stub. */
  minLinkLen: 48,
  /** Segments this close to an axis (degrees) but not on it look like mistakes. */
  skewDeg: 12,
  /** Connectors may touch boxes only within this distance of their own endpoints. */
  linkEndSlack: 16,
  /** Clearance between a connector label and any box, image or text. */
  labelGap: 20,
  /** Arrows landing on one edge of a box must center on it within this fraction of the edge. */
  offCenterFrac: 0.15,
};

export type Rect = {x: number; y: number; w: number; h: number};
export interface Finding {
  id: string;
  rect: Rect;
}

type ToFrame = (r: DOMRect) => Rect;

/** Hidden by an opacity-0 ancestor (a premounted <Sequence>): not on screen. */
const hiddenByAncestor = (el: Element): boolean => {
  for (let n: Element | null = el; n; n = n.parentElement) {
    if (getComputedStyle(n).opacity === '0') return true;
  }
  return false;
};

const textRects = (root: Element): {rect: DOMRect; font: number}[] => {
  const doc = root.ownerDocument;
  const out: {rect: DOMRect; font: number}[] = [];
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const range = doc.createRange();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.textContent || !n.textContent.trim()) continue;
    const parent = n.parentElement;
    // subtitles and the overlay are not scene content; a diagram viewport clips
    // its own text on purpose (the diagram rules judge what is visible)
    if (!parent || parent.closest('[data-subtitles],[data-audit-overlay],[data-clip-intended]')) continue;
    if (hiddenByAncestor(parent)) continue;
    const font = parseFloat(getComputedStyle(parent).fontSize) || 16;
    range.selectNodeContents(n);
    for (const r of Array.from(range.getClientRects())) {
      if (r.width > 0 && r.height > 0) out.push({rect: r, font});
    }
  }
  return out;
};

const safeId = (s: string) => s.replace(/\s+/g, '_');

const unionRects = (rects: DOMRect[]): DOMRect | null => {
  if (rects.length === 0) return null;
  let x1 = Infinity;
  let y1 = Infinity;
  let x2 = -Infinity;
  let y2 = -Infinity;
  for (const r of rects) {
    x1 = Math.min(x1, r.left);
    y1 = Math.min(y1, r.top);
    x2 = Math.max(x2, r.right);
    y2 = Math.max(y2, r.bottom);
  }
  return new DOMRect(x1, y1, x2 - x1, y2 - y1);
};

const intersects = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.w - 0.5 && b.x < a.x + a.w - 0.5 && a.y < b.y + b.h - 0.5 && b.y < a.y + a.h - 0.5;

const distToRect = (px: number, py: number, r: Rect): number =>
  Math.hypot(Math.max(r.x - px, 0, px - (r.x + r.w)), Math.max(r.y - py, 0, py - (r.y + r.h)));

/** Text cut off inside an element by an overflow-hidden box (not a deliberate clip). */
const clippedText = (root: HTMLElement): string | null => {
  const all = [root, ...Array.from(root.querySelectorAll<HTMLElement>('*'))];
  for (const el of all) {
    if (el.closest('[data-clip-intended]')) continue;
    if (!el.textContent?.trim()) continue;
    const cs = getComputedStyle(el);
    if (cs.overflow === 'visible' && cs.overflowX === 'visible' && cs.overflowY === 'visible') continue;
    if (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1) {
      return el.textContent.trim().slice(0, 32);
    }
  }
  return null;
};

/** Diagram labels inside a camera viewport ([data-diagram-scale]): smallest size and first cut label. */
const diagramLabels = (probe: HTMLElement, pageScale: number): {min: number | null; cropped: string | null} => {
  const camera = parseFloat(probe.dataset.diagramScale ?? '');
  if (!Number.isFinite(camera)) return {min: null, cropped: null};
  const box = probe.getBoundingClientRect();
  let min = Infinity;
  let cropped: string | null = null;
  for (const t of Array.from(probe.querySelectorAll('text'))) {
    const label = t.textContent?.trim();
    if (!label) continue;
    const r = t.getBoundingClientRect();
    if (r.right <= box.left || r.left >= box.right || r.bottom <= box.top || r.top >= box.bottom) continue;
    const inside = r.left >= box.left - 0.5 && r.right <= box.right + 0.5 && r.top >= box.top - 0.5 && r.bottom <= box.bottom + 0.5;
    if (!inside && cropped === null) cropped = label.slice(0, 32);
    const size = parseFloat(t.getAttribute('font-size') ?? '');
    if (size > 0) min = Math.min(min, size * camera);
  }
  return {min: Number.isFinite(min) ? min * pageScale : null, cropped};
};

/**
 * First diagram node at least 30 percent in view whose name is not wholly in
 * view. The name is the node's c4-name text, else its largest label (a type
 * chip does not name a box). Boundaries (groups containing other nodes) are
 * exempt; note the :scope, without it the node's own rect matches.
 */
const unlabelledNode = (probe: HTMLElement): string | null => {
  const box = probe.getBoundingClientRect();
  for (const g of Array.from(probe.querySelectorAll('svg.figure-dark g[id]'))) {
    const shape = g.querySelector(':scope > rect');
    if (!shape || g.querySelector(':scope g[id] > rect')) continue;
    const r = shape.getBoundingClientRect();
    const area = r.width * r.height;
    if (area <= 0) continue;
    const ix = Math.max(0, Math.min(r.right, box.right) - Math.max(r.left, box.left));
    const iy = Math.max(0, Math.min(r.bottom, box.bottom) - Math.max(r.top, box.top));
    if ((ix * iy) / area < 0.3) continue;
    const texts = Array.from(g.querySelectorAll(':scope > text, :scope > g > text')).filter((t) => t.textContent?.trim());
    if (texts.length === 0) continue;
    const size = (t: Element) => parseFloat(t.getAttribute('font-size') ?? '0');
    const named = texts.filter((t) => t.classList.contains('c4-name'));
    const biggest = Math.max(...texts.map(size));
    const names = named.length > 0 ? named : texts.filter((t) => size(t) === biggest);
    const shown = names.some((t) => {
      const q = t.getBoundingClientRect();
      return q.left >= box.left - 0.5 && q.right <= box.right + 0.5 && q.top >= box.top - 0.5 && q.bottom <= box.bottom + 0.5;
    });
    if (!shown) return g.id;
  }
  return null;
};

/** Visible drawing of a diagram viewport: its SVG children clipped to the viewport. */
const diagramInk = (probe: HTMLElement): DOMRect | null => {
  const box = probe.getBoundingClientRect();
  const svg = probe.querySelector('svg.figure-dark');
  if (!svg) return null;
  const parts: DOMRect[] = [];
  for (const child of Array.from(svg.children)) {
    if (['title', 'desc', 'defs'].includes(child.tagName)) continue;
    const r = child.getBoundingClientRect();
    const x1 = Math.max(r.left, box.left);
    const y1 = Math.max(r.top, box.top);
    const x2 = Math.min(r.right, box.right);
    const y2 = Math.min(r.bottom, box.bottom);
    if (x2 > x1 && y2 > y1) parts.push(new DOMRect(x1, y1, x2 - x1, y2 - y1));
  }
  return unionRects(parts);
};

/**
 * Checks for one scope (a scene, or the chapter chrome).
 * - overlap / tight: audited blocks that intersect or sit closer than minGap
 * - bounds: audited blocks or any text outside the safe area, in the subtitle
 *   band, or (scenes only) above the content top
 * - overflow: content of a [data-fit] container spilling out of it
 * - inset: text closer than minInset to the border of a bordered [data-fit]
 * - duplicate-id: two visible audited blocks share an id
 * - text-overflow: an audited block's text ink spills horizontally out of it
 * - clipped-text: text cut off by an overflow-hidden box (not data-clip-intended)
 * - illegible-text / cropped-label / unlabelled-node: a settled diagram
 *   viewport (kit DiagramShot) shows a label under minLabelPx, slices a label,
 *   or shows a node box without its name
 * - off-center: the composition (union of everything on screen, a whole
 *   diagram by its drawing) is off the frame centre
 * - arrow-pileup: two arrow heads in one spot (detached ends, arrows through
 *   text and crowded labels are link-gap / link-cross / link-label below)
 * - column-top: side-by-side columns that do not start at the same top
 */
export const runLayoutChecks = (opts: {
  scope: Element;
  audited: {id: string; el: HTMLElement; rect: Rect}[];
  toFrame: ToFrame;
  /** Screen px per composition px (preview scaling). */
  scale: number;
  isScene: boolean;
  width: number;
  height: number;
}): Finding[] => {
  const {scope, audited, toFrame, scale, isScene, width, height} = opts;
  const R = RULES;
  const findings: Finding[] = [];
  const add = (id: string, rect: Rect) => findings.push({id: safeId(id), rect});

  // Audited blocks: overlap, gaps, bounds.
  for (let i = 0; i < audited.length; i++) {
    for (let j = i + 1; j < audited.length; j++) {
      const a = audited[i];
      const b = audited[j];
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
      const ar = a.rect;
      const br = b.rect;
      const dx = Math.max(0, br.x - (ar.x + ar.w), ar.x - (br.x + br.w));
      const dy = Math.max(0, br.y - (ar.y + ar.h), ar.y - (br.y + br.h));
      if (dx === 0 && dy === 0) {
        add(`overlap:${a.id}+${b.id}`, ar);
      } else if ((dx === 0 && dy < R.minGap) || (dy === 0 && dx < R.minGap)) {
        add(`tight:${a.id}+${b.id}(${Math.round(Math.max(dx, dy))}px)`, ar);
      }
    }
  }
  const outOfBounds = (r: Rect, vTol = 1) =>
    r.x < R.safeX - 1 ||
    r.x + r.w > width - R.safeX + 1 ||
    r.y < R.safeY - vTol ||
    r.y + r.h > height - R.safeY + vTol ||
    (isScene && (r.y + r.h > R.contentBottom + vTol || r.y < R.contentTop - vTol));
  for (const a of audited) if (outOfBounds(a.rect)) add(`bounds:${a.id}`, a.rect);

  // Every text run in scope: bounds.
  for (const t of textRects(scope)) {
    const r = toFrame(t.rect);
    if (outOfBounds(r, t.font * R.vTolFrac)) {
      add(`text-bounds:${(t.rect.x | 0)},${(t.rect.y | 0)}`, r);
    }
  }

  // Audited blocks: duplicate ids, text spilling out of its own box (nowrap
  // tags, overflow visible: the element box misses it, the ink does not),
  // text clipped by an overflow-hidden box.
  const seen = new Map<string, number>();
  for (const a of audited) seen.set(a.id, (seen.get(a.id) ?? 0) + 1);
  for (const [id, n] of seen) if (n > 1) add(`duplicate-id:${id}(${n})`, audited.find((a) => a.id === id)!.rect);
  for (const a of audited) {
    const ink = unionRects(textRects(a.el).map((t) => t.rect));
    if (ink) {
      const r = toFrame(ink);
      const spill = Math.max(a.rect.x - r.x, r.x + r.w - (a.rect.x + a.rect.w));
      if (spill > R.overflowTol) add(`text-overflow:${a.id}(${Math.round(spill)}px)`, r);
    }
    const clip = clippedText(a.el);
    if (clip) add(`clipped-text:${a.id}`, a.rect);
  }

  // Diagram viewports (kit DiagramShot): legible, no cut labels, named boxes.
  for (const a of audited) {
    for (const probe of Array.from(a.el.querySelectorAll<HTMLElement>('[data-diagram-scale]'))) {
      if (probe.dataset.moving === '1' || probe.dataset.overview === '1') continue;
      const {min, cropped} = diagramLabels(probe, 1 / scale);
      if (min !== null && min < R.minLabelPx) add(`illegible-text:${a.id}(${min.toFixed(1)}px)`, a.rect);
      if (cropped !== null) add(`cropped-label:${a.id}`, a.rect);
      const bare = unlabelledNode(probe);
      if (bare !== null) add(`unlabelled-node:${a.id}(${bare})`, a.rect);
    }
  }

  if (isScene) {
    const safeW = width - 2 * R.safeX;
    // Composition centred: union of everything on screen; a whole-diagram view
    // counts by its drawing; captions opt out with data-composition-ignore.
    const parts: Rect[] = [];
    let skip = false;
    for (const a of audited) {
      if (a.el.querySelector('[data-composition-ignore]')) continue;
      if (a.el.querySelector('[data-layout-intent="asymmetric"]')) skip = true;
      const probe = a.el.querySelector<HTMLElement>('[data-diagram-scale]');
      if (probe && probe.dataset.moving === '1') skip = true;
      const inkRaw = probe && probe.dataset.wholeView === '1' ? diagramInk(probe) : null;
      parts.push(inkRaw ? toFrame(inkRaw) : a.rect);
    }
    if (!skip && parts.length > 0) {
      const x1 = Math.min(...parts.map((r) => r.x));
      const x2 = Math.max(...parts.map((r) => r.x + r.w));
      const off = (x1 + x2) / 2 - width / 2;
      if (x2 - x1 >= safeW * R.centreMinWidth && Math.abs(off) > safeW * R.centreTol) {
        add(`off-center:composition(${Math.round(off)}px)`, {x: x1, y: R.safeY, w: x2 - x1, h: 4});
      }
    }

    // Arrows (diagram/Arrow exposes data-arrow="x1,y1,x2,y2" in its own svg px).
    const tips: {x: number; y: number; from: string}[] = [];
    for (const svgEl of Array.from(scope.querySelectorAll<SVGSVGElement>('svg[data-arrow]'))) {
      if (svgEl.dataset.arrowDrawn !== '1') continue;
      const [ax1, ay1, ax2, ay2] = (svgEl.dataset.arrow ?? '').split(',').map(Number);
      const o = toFrame(svgEl.getBoundingClientRect());
      const k = 1 / scale;
      const sx0 = o.x + ax1 * k;
      const sy0 = o.y + ay1 * k;
      const ex = o.x + ax2 * k;
      const ey = o.y + ay2 * k;
      // Detached ends, arrows through text and crowded labels are covered by the
      // link-gap, link-cross and link-label rules (EXTRA_RULES), which also
      // handle elbowed arrows, free ends and zone outlines.
      const from = `${Math.round(sx0)},${Math.round(sy0)}`;
      if (tips.some((t) => t.from !== from && Math.hypot(t.x - ex, t.y - ey) < R.arrowTipGap)) {
        add(`arrow-pileup:${Math.round(ex)},${Math.round(ey)}`, {x: ex - 6, y: ey - 6, w: 12, h: 12});
      }
      tips.push({x: ex, y: ey, from});
    }

    // Side-by-side columns are top-aligned: cluster blocks by x overlap and
    // compare only the parts of two columns that share vertical span.
    const colItems = audited.filter(
      (a) => a.rect.w < safeW * R.fullWidthFrac && !a.el.querySelector('[data-composition-ignore]') && a.rect.y + a.rect.h < R.contentBottom,
    );
    const cols: {x1: number; x2: number; items: Rect[]; ids: string[]}[] = [];
    for (const a of [...colItems].sort((p, q) => p.rect.x - q.rect.x)) {
      const c = cols.find((k) => a.rect.x < k.x2 - 8 && a.rect.x + a.rect.w > k.x1 + 8);
      if (c) {
        c.x1 = Math.min(c.x1, a.rect.x);
        c.x2 = Math.max(c.x2, a.rect.x + a.rect.w);
        c.items.push(a.rect);
        c.ids.push(a.id);
      } else {
        cols.push({x1: a.rect.x, x2: a.rect.x + a.rect.w, items: [a.rect], ids: [a.id]});
      }
    }
    const span = (rs: Rect[]) => ({top: Math.min(...rs.map((r) => r.y)), bottom: Math.max(...rs.map((r) => r.y + r.h))});
    for (let i = 0; i < cols.length; i++) {
      for (let j = i + 1; j < cols.length; j++) {
        const si = span(cols[i].items);
        const sj = span(cols[j].items);
        const bi = cols[i].items.filter((b) => b.y < sj.bottom && b.y + b.h > sj.top);
        const bj = cols[j].items.filter((b) => b.y < si.bottom && b.y + b.h > si.top);
        if (bi.length === 0 || bj.length === 0) continue;
        const ti = Math.min(...bi.map((b) => b.y));
        const tj = Math.min(...bj.map((b) => b.y));
        if (Math.abs(ti - tj) > R.columnTopTol) add(`column-top:${cols[i].ids[0]}+${cols[j].ids[0]}(${Math.round(Math.abs(ti - tj))}px)`, {x: cols[i].x1, y: Math.min(ti, tj), w: cols[j].x2 - cols[i].x1, h: 4});
      }
    }
  }

  // Bounded containers: overflow and inset.
  scope.querySelectorAll<HTMLElement>('[data-fit]').forEach((el, i) => {
    const name = el.dataset.fit || String(i);
    const cr = el.getBoundingClientRect();
    if (cr.width === 0 && cr.height === 0) return;
    const frameRect = toFrame(cr);
    const hTol = R.overflowTol * scale;
    let over = el.scrollWidth > el.clientWidth + R.overflowTol || el.scrollHeight > el.clientHeight + R.overflowTol;
    const cs = getComputedStyle(el);
    // CSS borders count automatically; SVG-drawn outlines opt in with data-fit-bordered.
    const bordered =
      el.hasAttribute('data-fit-bordered') ||
      (parseFloat(cs.borderLeftWidth) > 0 && parseFloat(cs.borderTopWidth) > 0 && cs.borderLeftStyle !== 'none');
    let tightInset = false;
    for (const t of textRects(el)) {
      const r = t.rect;
      const vTol = t.font * R.vTolFrac * scale;
      if (r.left < cr.left - hTol || r.right > cr.right + hTol || r.top < cr.top - vTol || r.bottom > cr.bottom + vTol) {
        over = true;
      }
      if (bordered) {
        const ins = R.minInset * scale;
        // vertical inset measured on the glyph box minus its ascent/descent slack
        const slack = (r.height - t.font * scale) / 2;
        if (
          r.left - cr.left < ins ||
          cr.right - r.right < ins ||
          r.top + slack - cr.top < ins ||
          cr.bottom - (r.bottom - slack) < ins
        ) {
          tightInset = true;
        }
      }
    }
    if (over) add(`overflow:${name}`, frameRect);
    else if (tightInset) add(`inset:${name}`, frameRect);
  });
  for (const rule of EXTRA_RULES) rule({scope, add, toFrame, scale});
  return findings;
};

/** Context handed to each additional rule. */
export interface RuleCtx {
  scope: Element;
  add: (id: string, rect: Rect) => void;
  toFrame: (r: DOMRect) => Rect;
  /** screen px per composition px */
  scale: number;
}

const isZone = (el: HTMLElement) => (el.dataset.fit ?? '').startsWith('zone:');
const distTo = (x: number, y: number, r: DOMRect) =>
  Math.hypot(Math.max(r.left - x, 0, x - r.right), Math.max(r.top - y, 0, y - r.bottom));
const linkEls = (scope: Element) =>
  Array.from(scope.querySelectorAll<SVGGeometryElement>('[data-link]')).filter((el) => !hiddenByAncestor(el));
/** Bounded boxes that are actually on screen (premounted, hidden sequences excluded). */
const fitEls = (scope: Element) =>
  Array.from(scope.querySelectorAll<HTMLElement>('[data-fit]')).filter((el) => !hiddenByAncestor(el));
const imgEls = (scope: Element) => Array.from(scope.querySelectorAll('img')).filter((el) => !hiddenByAncestor(el));
/** An element's rect clipped by every overflow-hidden ancestor (what is actually painted). */
const paintedRect = (el: Element): DOMRect | null => {
  let r = el.getBoundingClientRect();
  for (let a = el.parentElement; a; a = a.parentElement) {
    const cs = getComputedStyle(a);
    if (cs.overflow === 'visible' && cs.overflowX === 'visible' && cs.overflowY === 'visible') continue;
    const c = a.getBoundingClientRect();
    const l = Math.max(r.left, c.left), tp = Math.max(r.top, c.top), rr = Math.min(r.right, c.right), b = Math.min(r.bottom, c.bottom);
    if (rr <= l || b <= tp) return null;
    r = new DOMRect(l, tp, rr - l, b - tp);
  }
  return r;
};
/** A connector's points (data-points, in its SVG's user space) mapped to screen coordinates. */
const linkPoints = (el: SVGGeometryElement): {x: number; y: number}[] => {
  const pts: [number, number][] = JSON.parse(el.getAttribute('data-points') ?? '[]');
  const m = el.getScreenCTM();
  return m ? pts.map(([x, y]) => ({x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f})) : [];
};

/** Additional rules, each a self-contained check (see README of each rule below). */
const EXTRA_RULES: ((c: RuleCtx) => void)[] = [];

/** link-gap: both ends of every connector touch something, unless declared free. */
const linkGap = ({scope, add, scale}: RuleCtx) => {
  const targets: DOMRect[] = [];
  const zones: DOMRect[] = [];
  fitEls(scope).forEach((el) => (isZone(el) ? zones : targets).push(el.getBoundingClientRect()));
  imgEls(scope).forEach((el) => targets.push(el.getBoundingClientRect()));
  for (const t of textRects(scope)) targets.push(t.rect);
  linkEls(scope).forEach((el, k) => {
    const pts = linkPoints(el);
    if (pts.length < 2) return;
    const free = el.getAttribute('data-free') ?? '';
    const ends: [string, {x: number; y: number}][] = [['start', pts[0]], ['end', pts[pts.length - 1]]];
    for (const [which, {x, y}] of ends) {
      if (free === 'both' || free === which) continue;
      // a zone counts only by its outline
      const zoneEdge = (r: DOMRect) =>
        x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
          ? Math.min(x - r.left, r.right - x, y - r.top, r.bottom - y)
          : distTo(x, y, r);
      const near = Math.min(Infinity, ...targets.map((r) => distTo(x, y, r)), ...zones.map(zoneEdge));
      if (near > RULES.linkEndGap * scale) {
        add(`link-gap:${el.getAttribute('data-link')}#${k}:${which}(${Math.round(near / scale)}px)`, {x, y, w: 1, h: 1});
      }
    }
  });
};
EXTRA_RULES.push(linkGap);

/** link-short: connectors are at least RULES.minLinkLen long. */
const linkShort = ({scope, add, toFrame, scale}: RuleCtx) => {
  linkEls(scope).forEach((el, k) => {
    const pts = linkPoints(el);
    let len = 0;
    for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    if (pts.length >= 2 && len < RULES.minLinkLen * scale) {
      add(`link-short:${el.getAttribute('data-link')}#${k}(${Math.round(len / scale)}px)`, toFrame(el.getBoundingClientRect()));
    }
  });
};
EXTRA_RULES.push(linkShort);

/** link-skew / link-diagonal: segments are horizontal or vertical. */
const linkGeometry = ({scope, add, toFrame}: RuleCtx) => {
  linkEls(scope).forEach((el, k) => {
    const pts: [number, number][] = JSON.parse(el.getAttribute('data-points') ?? '[]');
    for (let i = 1; i < pts.length; i++) {
      const dx = Math.abs(pts[i][0] - pts[i - 1][0]);
      const dy = Math.abs(pts[i][1] - pts[i - 1][1]);
      if (dx <= 1.5 || dy <= 1.5) continue;
      const ang = (Math.atan2(Math.min(dx, dy), Math.max(dx, dy)) * 180) / Math.PI;
      const r = toFrame(el.getBoundingClientRect());
      const name = `${el.getAttribute('data-link')}#${k}`;
      if (ang < RULES.skewDeg) add(`link-skew:${name}(${ang.toFixed(1)}deg)`, r);
      else if (!el.getAttribute('data-diagonal')) add(`link-diagonal:${name}`, r);
      break;
    }
  });
};
EXTRA_RULES.push(linkGeometry);

/** link-cross: nothing but the endpoints may touch a box or text. */
const linkCross = ({scope, add, toFrame, scale}: RuleCtx) => {
  const obstacles: DOMRect[] = [];
  fitEls(scope).forEach((el) => {
    if (!isZone(el)) obstacles.push(el.getBoundingClientRect());
  });
  imgEls(scope).forEach((el) => obstacles.push(el.getBoundingClientRect()));
  for (const t of textRects(scope)) obstacles.push(t.rect);
  linkEls(scope).forEach((el, k) => {
    const pts = linkPoints(el);
    if (pts.length < 2) return;
    const box = el.getBoundingClientRect();
    const own = obstacles.filter(
      (o) => !(box.left >= o.left - 1 && box.right <= o.right + 1 && box.top >= o.top - 1 && box.bottom <= o.bottom + 1),
    );
    const segs = pts.slice(1).map((q, i) => ({a: pts[i], b: q, len: Math.hypot(q.x - pts[i].x, q.y - pts[i].y)}));
    const total = segs.reduce((s, g) => s + g.len, 0);
    const slack = RULES.linkEndSlack * scale;
    let walked = 0;
    for (const g of segs) {
      for (let s = 0; s <= g.len; s += 6 * scale) {
        const at = walked + s;
        if (at < slack || at > total - slack) continue;
        const f = g.len ? s / g.len : 0;
        const x = g.a.x + (g.b.x - g.a.x) * f;
        const y = g.a.y + (g.b.y - g.a.y) * f;
        const hit = own.find((o) => x > o.left + 3 && x < o.right - 3 && y > o.top + 3 && y < o.bottom - 3);
        if (hit) {
          add(`link-cross:${el.getAttribute('data-link')}#${k}`, toFrame(hit));
          return;
        }
      }
      walked += g.len;
    }
  });
};
EXTRA_RULES.push(linkCross);

/** link-label: labels on connectors keep RULES.labelGap clear of boxes, images and text. */
const linkLabel = ({scope, add, toFrame, scale}: RuleCtx) => {
  scope.querySelectorAll<HTMLElement>('[data-link-label]').forEach((lab, k) => {
    const lr = lab.getBoundingClientRect();
    const g = RULES.labelGap * scale;
    const encloses = (o: DOMRect) => o.left <= lr.left + 1 && o.right >= lr.right - 1 && o.top <= lr.top + 1 && o.bottom >= lr.bottom - 1;
    const near = (o: DOMRect) => o.left < lr.right + g && o.right > lr.left - g && o.top < lr.bottom + g && o.bottom > lr.top - g;
    const boxes: DOMRect[] = [];
    fitEls(scope).forEach((el) => {
      if (!isZone(el)) boxes.push(el.getBoundingClientRect());
    });
    imgEls(scope).forEach((el) => boxes.push(el.getBoundingClientRect()));
    for (const t of textRects(scope)) boxes.push(t.rect);
    const own = textRects(lab).map((x) => x.rect);
    const hit = boxes.find((o) => !encloses(o) && near(o) && !own.some((w) => w.left === o.left && w.top === o.top));
    if (hit) add(`link-label:${(lab.textContent ?? '').trim().slice(0, 24).replace(/\s+/g, '_')}#${k}`, toFrame(lr));
  });
};
EXTRA_RULES.push(linkLabel);

/** link-offcenter: landings on each box edge are centered on that edge. */
const linkOffCenter = ({scope, add, toFrame, scale}: RuleCtx) => {
  const boxes: {el: HTMLElement; r: DOMRect}[] = [];
  fitEls(scope).forEach((el) => {
    if (!isZone(el)) boxes.push({el, r: el.getBoundingClientRect()});
  });
  const hits = new Map<string, {r: DOMRect; edge: string; pts: number[]; name: string}>();
  const tol = RULES.linkEndGap * scale;
  linkEls(scope).forEach((el) => {
    const pts = linkPoints(el);
    if (pts.length < 2) return;
    for (const {x, y} of [pts[0], pts[pts.length - 1]]) {
      for (const b of boxes) {
        const r = b.r;
        const edges: [string, number, number, boolean][] = [
          ['left', Math.abs(x - r.left), y, y >= r.top - tol && y <= r.bottom + tol],
          ['right', Math.abs(x - r.right), y, y >= r.top - tol && y <= r.bottom + tol],
          ['top', Math.abs(y - r.top), x, x >= r.left - tol && x <= r.right + tol],
          ['bottom', Math.abs(y - r.bottom), x, x >= r.left - tol && x <= r.right + tol],
        ];
        for (const [edge, d, along, within] of edges) {
          if (d > tol || !within) continue;
          const key = `${b.el.dataset.fit}|${edge}`;
          const e = hits.get(key) ?? {r, edge, pts: [], name: b.el.dataset.fit ?? 'box'};
          e.pts.push(along);
          hits.set(key, e);
        }
      }
    }
  });
  hits.forEach((h) => {
    const vertical = h.edge === 'left' || h.edge === 'right';
    const lo = vertical ? h.r.top : h.r.left;
    const len = vertical ? h.r.height : h.r.width;
    const centroid = h.pts.reduce((a, b) => a + b, 0) / h.pts.length;
    if (Math.abs(centroid - (lo + len / 2)) > RULES.offCenterFrac * len) add(`link-offcenter:${h.name}:${h.edge}`, toFrame(h.r));
  });
};
EXTRA_RULES.push(linkOffCenter);

/** marker-over: visible [data-marker] elements do not overlap boxes or text. */
const markerOver = ({scope, add, toFrame}: RuleCtx) => {
  scope.querySelectorAll<HTMLElement | SVGElement>('[data-marker]').forEach((mk, k) => {
    if (hiddenByAncestor(mk)) return;
    const mr = mk.getBoundingClientRect();
    if (mr.width === 0 && mr.height === 0) return;
    const cs = getComputedStyle(mk);
    if (parseFloat(cs.opacity || '1') < 0.5 || cs.visibility === 'hidden') return;
    const over = (o: DOMRect) => o.left < mr.right && o.right > mr.left && o.top < mr.bottom && o.bottom > mr.top;
    let hit = false;
    fitEls(scope).forEach((el) => {
      if (hit || isZone(el) || el.contains(mk)) return;
      const r = el.getBoundingClientRect();
      const wrapsDiagram = r.width > 600 && r.height > 300;
      if (!wrapsDiagram && over(r)) hit = true;
    });
    if (!hit) for (const t of textRects(scope)) if (over(t.rect)) { hit = true; break; }
    if (hit) add(`marker-over:${mk.getAttribute('data-marker') || k}`, toFrame(mr));
  });
};
EXTRA_RULES.push(markerOver);

/** content-bounds: nothing crosses the left or right edge of [data-content-box]. */
const contentBounds = ({scope, add, toFrame, scale}: RuleCtx) => {
  scope.querySelectorAll<HTMLElement>('[data-content-box]').forEach((cb) => {
    const box = cb.getBoundingClientRect();
    const tol = 2 * scale;
    const outside = (r: DOMRect) => r.width > 0 && (r.right > box.right + tol || r.left < box.left - tol);
    for (const t of textRects(cb)) if (outside(t.rect)) add(`content-bounds:text@${Math.round(t.rect.x)}`, toFrame(t.rect));
    cb.querySelectorAll<Element>('[data-fit],img,svg:not(:has([data-link])),[data-link]').forEach((el, k) => {
      if (hiddenByAncestor(el)) return;
      const r = paintedRect(el);
      if (r && outside(r)) add(`content-bounds:${el.getAttribute('data-fit') ?? el.tagName.toLowerCase()}#${k}`, toFrame(r));
    });
  });
};
EXTRA_RULES.push(contentBounds);

/**
 * Zone balance data: for each zone ([data-fit^="zone:"]), the union of content
 * fully inside it and how far that union's center sits from the zone
 * interior's center, as fractions of the interior. The interior starts below
 * the zone's title: data-zone-inset (px) when set, else the first child.
 * The sweep flags any zone whose content stays off center for 2 s or more.
 */
export const zoneBalance = (scope: Element): {name: string; count: number; dx: number; dy: number}[] => {
  const out: {name: string; count: number; dx: number; dy: number}[] = [];
  const items: DOMRect[] = [];
  scope.querySelectorAll<HTMLElement>('[data-fit]:not([data-fit^="zone:"]),img').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) items.push(r);
  });
  scope.querySelectorAll<HTMLElement>('[data-fit^="zone:"]').forEach((z) => {
    const zr = z.getBoundingClientRect();
    const inset = z.dataset.zoneInset ? parseFloat(z.dataset.zoneInset) * (zr.height / (z.offsetHeight || zr.height)) : null;
    const first = z.firstElementChild as HTMLElement | null;
    const top = inset !== null ? zr.top + inset : first ? Math.max(zr.top, first.getBoundingClientRect().bottom) : zr.top;
    const inside = items.filter(
      (r) => r.left >= zr.left - 1 && r.right <= zr.right + 1 && r.top >= zr.top - 1 && r.bottom <= zr.bottom + 1 &&
        !(r.width >= zr.width - 2 && r.height >= zr.height - 2),
    );
    const outer = inside.filter((r) => !inside.some((o) => o !== r && o.left <= r.left && o.right >= r.right && o.top <= r.top && o.bottom >= r.bottom));
    if (!outer.length) return;
    const l = Math.min(...outer.map((r) => r.left));
    const rr = Math.max(...outer.map((r) => r.right));
    const t = Math.min(...outer.map((r) => r.top));
    const b = Math.max(...outer.map((r) => r.bottom));
    const w = zr.width;
    const h = zr.bottom - top;
    if (w <= 0 || h <= 0) return;
    out.push({
      name: (z.dataset.fit ?? 'zone').replace(/\s+/g, '_'),
      count: outer.length,
      dx: ((l + rr) / 2 - (zr.left + zr.right) / 2) / w,
      dy: ((t + b) / 2 - (top + zr.bottom) / 2) / h,
    });
  });
  return out;
};
