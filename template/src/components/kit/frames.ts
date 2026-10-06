import {diagrams, type DiagramName} from '../../assets/diagrams.generated';
import type {NRect} from './DiagramShot';

/** Viewport of a default DiagramShot (1728 wide, 800 tall minus the 48px label row). */
export const DEFAULT_VIEW = {w: 1728, h: 752};

/**
 * A camera focus rectangle that frames whole diagram nodes. Pass region ids
 * (or node titles) from src/assets/diagrams.generated.ts; the union of their
 * boxes is padded by `pad` viewBox units and then grown to the viewport's
 * aspect ratio around its centre, so the nodes are wholly in view. The layout
 * test still decides: if a neighbouring label is cut at the edge
 * (`cropped-label`) or the zoom is too far out (`illegible-text`), change the
 * nodes or the padding.
 */
export const frameNodes = (
  name: DiagramName,
  nodes: string[],
  pad = 24,
  view: {w: number; h: number} = DEFAULT_VIEW,
): NRect => {
  const d = diagrams[name];
  const regions = d.regions as Record<string, {title: string; box: [number, number, number, number]}>;
  const boxes = nodes.map((key) => {
    const hit = regions[key] ?? Object.values(regions).find((r) => r.title === key);
    if (!hit) throw new Error(`frameNodes: no node "${key}" in diagram "${name}"`);
    return hit.box;
  });
  const nx0 = Math.min(...boxes.map((b) => b[0])) - pad;
  const ny0 = Math.min(...boxes.map((b) => b[1])) - pad;
  const nx1 = Math.max(...boxes.map((b) => b[0] + b[2])) + pad;
  const ny1 = Math.max(...boxes.map((b) => b[1] + b[3])) + pad;
  const aspect = view.w / view.h;
  // Smallest frame of the viewport's aspect that holds the nodes.
  const baseW = Math.max(nx1 - nx0, (ny1 - ny0) * aspect);
  const cx = (nx0 + nx1) / 2;
  const cy = (ny0 + ny1) / 2;
  const labels = d.labels as [number, number, number, number][];
  const straddles = (x0: number, y0: number, x1: number, y1: number) =>
    labels.filter(([lx, ly, lw, lh]) => {
      const hit = lx < x1 && lx + lw > x0 && ly < y1 && ly + lh > y0;
      const inside = lx >= x0 && lx + lw <= x1 && ly >= y0 && ly + lh <= y1;
      return hit && !inside;
    }).length;
  // Search scales (tightest first) and centre offsets for a frame that holds
  // the nodes and slices no label; fall back to the fewest sliced labels.
  let best: {x0: number; y0: number; x1: number; y1: number; cut: number} | null = null;
  for (let k = 1; k <= 2.2 && !(best && best.cut === 0); k += 0.04) {
    const w = baseW * k;
    const h = w / aspect;
    for (const dx of [0, -0.06, 0.06, -0.12, 0.12, -0.18, 0.18]) {
      for (const dy of [0, -0.06, 0.06, -0.12, 0.12, -0.18, 0.18]) {
        const x0 = cx - w / 2 + dx * w;
        const y0 = cy - h / 2 + dy * h;
        const x1 = x0 + w;
        const y1 = y0 + h;
        if (x0 > nx0 || y0 > ny0 || x1 < nx1 || y1 < ny1) continue; // nodes must stay whole
        const cut = straddles(x0, y0, x1, y1);
        if (!best || cut < best.cut) best = {x0, y0, x1, y1, cut};
        if (cut === 0) break;
      }
      if (best && best.cut === 0) break;
    }
  }
  const f = best ?? {x0: cx - baseW / 2, y0: cy - baseW / aspect / 2, x1: cx + baseW / 2, y1: cy + baseW / aspect / 2};
  return [f.x0 / d.vbW, f.y0 / d.vbH, f.x1 / d.vbW, f.y1 / d.vbH];
};

/** On-screen size (px) a label of `fontSize` viewBox units would have when `rect` fills the view. */
export const labelPxAt = (name: DiagramName, rect: NRect, fontSize = 7, view = DEFAULT_VIEW): number => {
  const d = diagrams[name];
  const s = Math.min(view.w / ((rect[2] - rect[0]) * d.vbW), view.h / ((rect[3] - rect[1]) * d.vbH));
  return fontSize * s;
};
