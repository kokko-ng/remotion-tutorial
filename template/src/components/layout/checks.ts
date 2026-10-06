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
  return findings;
};
