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
  minGap: 12,
  /** Minimum inset between text and the border of a bordered container. */
  minInset: 8,
  /** Horizontal overflow tolerance in px. */
  overflowTol: 2,
  /** Vertical tolerance as a fraction of font size (font ascent/descent exceed tight line boxes). */
  vTolFrac: 0.3,
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
};

export type Rect = {x: number; y: number; w: number; h: number};
export interface Finding {
  id: string;
  rect: Rect;
}

type ToFrame = (r: DOMRect) => Rect;

const textRects = (root: Element): {rect: DOMRect; font: number}[] => {
  const doc = root.ownerDocument;
  const out: {rect: DOMRect; font: number}[] = [];
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const range = doc.createRange();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.textContent || !n.textContent.trim()) continue;
    const parent = n.parentElement;
    if (!parent || parent.closest('[data-subtitles],[data-audit-overlay]')) continue;
    const font = parseFloat(getComputedStyle(parent).fontSize) || 16;
    range.selectNodeContents(n);
    for (const r of Array.from(range.getClientRects())) {
      if (r.width > 0 && r.height > 0) out.push({rect: r, font});
    }
  }
  return out;
};

const safeId = (s: string) => s.replace(/\s+/g, '_');

/**
 * Checks for one scope (a scene, or the chapter chrome).
 * - overlap / tight: audited blocks that intersect or sit closer than minGap
 * - bounds: audited blocks or any text outside the safe area, in the subtitle
 *   band, or (scenes only) above the content top
 * - overflow: content of a [data-fit] container spilling out of it
 * - inset: text closer than minInset to the border of a bordered [data-fit]
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
const linkEls = (scope: Element) => Array.from(scope.querySelectorAll<SVGGeometryElement>('[data-link]'));
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
  scope.querySelectorAll<HTMLElement>('[data-fit]').forEach((el) => (isZone(el) ? zones : targets).push(el.getBoundingClientRect()));
  scope.querySelectorAll('img').forEach((el) => targets.push(el.getBoundingClientRect()));
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
  scope.querySelectorAll<HTMLElement>('[data-fit]').forEach((el) => {
    if (!isZone(el)) obstacles.push(el.getBoundingClientRect());
  });
  scope.querySelectorAll('img').forEach((el) => obstacles.push(el.getBoundingClientRect()));
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
    scope.querySelectorAll<HTMLElement>('[data-fit]').forEach((el) => {
      if (!isZone(el)) boxes.push(el.getBoundingClientRect());
    });
    scope.querySelectorAll('img').forEach((el) => boxes.push(el.getBoundingClientRect()));
    for (const t of textRects(scope)) boxes.push(t.rect);
    const own = textRects(lab).map((x) => x.rect);
    const hit = boxes.find((o) => !encloses(o) && near(o) && !own.some((w) => w.left === o.left && w.top === o.top));
    if (hit) add(`link-label:${(lab.textContent ?? '').trim().slice(0, 24).replace(/\s+/g, '_')}#${k}`, toFrame(lr));
  });
};
EXTRA_RULES.push(linkLabel);
