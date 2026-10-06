#!/usr/bin/env python3
"""Make dark-background variants of a codebase's own architecture diagrams.

For a codebase walkthrough the video shows the repository's diagrams, unchanged
in content, on the dark terminal background. Each source diagram is an HTML
page (or a standalone .svg) whose figure is one inline SVG: the first
<svg class="figure"> if there is one, else the largest top-level <svg>. This
script takes that SVG and nothing else, keeps every node, arrow, label and
position, and maps the diagram's own light palette onto the theme. Icons
embedded as nested <svg aria-hidden="true"> (for example the official Azure
architecture icons) are lifted out first and put back byte for byte: the icon
terms forbid altering them, so never recolour a diagram with a CSS filter.

Legibility on a dark canvas: strokes are thickened 1.6x (minimum 1.4 units),
every line and border alpha is raised until it reaches 3.2:1 against the
canvas, the two smallest label sizes go up one step, and secondary text
colours are lifted. The source files are only read, never written.

The palette map below is for light diagrams drawn in a warm brown and white
style; edit HEX and RGB (or pass --map palette.json, {"#RRGGBB": "#rrggbb"})
for your source palette, and check the result against the canvas.

Output: one .svg per diagram in --out, and with --module a TypeScript module
(src/assets/diagrams.generated.ts) that inlines every SVG with its viewBox, its
named node regions (each <g id> whose first shape is a <rect>, with its
<title>) and estimated label boxes, which DiagramShot and frameNodes use.

Usage:
    python3 darken_diagrams.py --src /path/to/repo/docs/architecture \
        --out videos/<slug>/public/diagrams-dark \
        --module videos/<slug>/src/assets/diagrams.generated.ts
"""
import argparse
import re
from pathlib import Path

# Diagram palette (light) -> terminal theme (dark). Theme values come from
# src/theme/tokens.ts (terminal preset). Edit for your source palette.
BG = "#101418"
INK = "#d6deeb"
MUTED = "#9aa8ba"
SOFT = "#8394a7"
MAGENTA = "#d16d9e"  # accent3: the diagrams' "decides" and "scale" accent
TEAL = "#7fd6c2"  # accent2: outbound HTTPS calls

HEX = {"#FFFFFF": BG, "#FFF": BG, "#3E332D": INK, "#6B625C": MUTED, "#8F8781": SOFT, "#D40E8C": MAGENTA, "#5990F0": TEAL}
RGB = {"62,51,45": "214,222,235", "107,98,92": "154,168,186", "212,14,140": "209,109,158"}
FONTS = [
    (r"'Geist Mono',\s*ui-monospace,\s*monospace", "'IBM Plex Mono', monospace"),
    (r"'Inter',\s*'Greycliff CF',\s*Arial,\s*sans-serif", "'IBM Plex Sans', sans-serif"),
    (r"'Inter',\s*Arial,\s*sans-serif", "'IBM Plex Sans', sans-serif"),
    (r"'Roboto Slab',\s*'Klinic Slab',\s*Georgia,\s*serif", "'IBM Plex Sans', sans-serif"),
]
ICON = re.compile(r'<svg\b[^>]*aria-hidden="true"[^>]*>.*?</svg>', re.S)


def figure(html):
    """Return the figure SVG: the first <svg class="figure">, else the largest
    top-level <svg>; nested svgs (icons) are included in the returned element."""
    if '<svg class="figure"' not in html:
        tops, depth, start = [], 0, None
        for m in re.finditer(r"<svg\b|</svg>", html):
            if m.group(0) == "<svg":
                if depth == 0:
                    start = m.start()
                depth += 1
            else:
                depth -= 1
                if depth == 0 and start is not None:
                    tops.append(html[start : m.end()])
        if not tops:
            raise ValueError("no <svg> in file")
        return max(tops, key=len).replace("<svg", '<svg class="figure"', 1)
    i = html.index('<svg class="figure"')
    depth = 0
    for m in re.finditer(r"<svg\b|</svg>", html[i:]):
        depth += 1 if m.group(0) == "<svg" else -1
        if depth == 0:
            return html[i : i + m.end()]
    raise ValueError("unterminated figure svg")


def alpha(a):
    """Light-on-dark needs more alpha for faint fills to read at all."""
    a = float(a)
    return f"{min(1.0, a * 2.2 if a < 0.15 else a * 1.15):.2f}"


def _lum(rgb):
    def f(c):
        c = c / 255
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = rgb
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)


def _contrast(a, b):
    la, lb = sorted([_lum(a), _lum(b)], reverse=True)
    return (la + 0.05) / (lb + 0.05)


BG_RGB = (0x10, 0x14, 0x18)
MIN_LINE_CONTRAST = 3.2  # WCAG 1.4.11 asks 3:1 for graphical objects; a little headroom


def line_alpha(rgb, a):
    """Smallest alpha >= a at which this colour, blended over the canvas, reaches
    MIN_LINE_CONTRAST. Lines and borders must read against the dark background."""
    a = float(a)
    while a < 1.0:
        blended = tuple(round(c * a + bg * (1 - a)) for c, bg in zip(rgb, BG_RGB))
        if _contrast(blended, BG_RGB) >= MIN_LINE_CONTRAST:
            break
        a = min(1.0, a + 0.02)
    return f"{a:.2f}"


def legible(body):
    """Make lines, borders and labels read on the dark canvas: thicker strokes,
    stroke and border alphas raised to 3.2:1 against the canvas, faint group
    opacity raised, and secondary label colours lifted one step."""
    body = re.sub(r'stroke-width="([\d.]+)"', lambda m: f'stroke-width="{max(1.4, float(m.group(1)) * 1.6):.2f}"', body)

    def stroke_rgba(m):
        r, g, b, a = int(m[1]), int(m[2]), int(m[3]), m[4]
        return f'stroke="rgba({r},{g},{b},{line_alpha((r, g, b), a)})"'

    body = re.sub(r'stroke="rgba\((\d+),(\d+),(\d+),([\d.]+)\)"', stroke_rgba, body)
    body = body.replace('opacity="0.40"', 'opacity="0.75"')
    # the two smallest label sizes (chips, group captions) go up one step so a
    # legible zoom can hold more of the diagram
    body = re.sub(r'font-size="(7|8)"', lambda m: f'font-size="{int(m.group(1)) + 1}"', body)
    body = body.replace(f'fill="{SOFT}"', f'fill="{MUTED}"')

    def text_rgba(m):
        a = max(0.88, float(m[4]))
        return f'fill="rgba({m[1]},{m[2]},{m[3]},{a:.2f})"'

    body = re.sub(r'(?<=<text)([^>]*?)fill="rgba\((\d+),(\d+),(\d+),([\d.]+)\)"',
                  lambda m: m.group(1) + text_rgba(type("M", (), {"__getitem__": lambda self, k: m.group(k + 1)})()), body)
    return body


def recolour(svg):
    icons = []

    def lift(m):
        icons.append(m.group(0))
        return f"@@ICON{len(icons) - 1}@@"

    body = ICON.sub(lift, svg)
    # the full-canvas paper rect goes: the figure sits on the video background
    body = re.sub(r'<rect width="100%" height="100%" fill="#FFFFFF"\s*/>', "", body, count=1)
    body = re.sub(r"#[0-9a-fA-F]{6}\b|#[fF]{3}\b", lambda m: HEX.get(m.group(0).upper(), m.group(0)), body)
    body = re.sub(
        r"rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)",
        lambda m: f"rgba({RGB.get(f'{m[1]},{m[2]},{m[3]}', f'{m[1]},{m[2]},{m[3]}')},{alpha(m[4])})",
        body,
    )
    for pat, rep in FONTS:
        body = re.sub(pat, rep, body)
    body = legible(body)
    # responsive sizing is the page's job; the scene sets width and height
    body = body.replace('class="figure"', 'class="figure-dark"', 1)
    for n, icon in enumerate(icons):
        body = body.replace(f"@@ICON{n}@@", icon, 1)
    return body, len(icons)


def regions(svg):
    """Named node boxes in viewBox units: each <g id="..."> whose first child
    element is a <rect>. Scenes frame camera zooms around these."""
    out = {}
    for m in re.finditer(r'<g id="([^"]+)"[^>]*>\s*(?:<title>([^<]*)</title>\s*)?<rect ([^>]*)>', svg):
        attrs = dict(re.findall(r'([\w-]+)="([^"]*)"', m.group(3)))
        try:
            box = [float(attrs["x"]), float(attrs["y"]), float(attrs["width"]), float(attrs["height"])]
        except (KeyError, ValueError):
            continue
        out[m.group(1)] = {"title": (m.group(2) or "").strip(), "box": box}
    return out


def label_boxes(svg):
    """Estimated boxes [x, y, w, h] (viewBox units) of every text label, from its
    position, font size, anchor, length and letter spacing (mono advance 0.6 em,
    sans 0.56 em). Icons are excluded. Used to keep camera frames from slicing a
    label; the rendered layout test is the final check."""
    body = ICON.sub("", svg[svg.index(">") + 1 :])
    out = []
    for m in re.finditer(r"<text ([^>]*)>(.*?)</text>", body, re.S):
        attrs = dict(re.findall(r'([\w-]+)="([^"]*)"', m.group(1)))
        text = re.sub(r"<[^>]+>", "", m.group(2)).strip()
        if not text or "x" not in attrs or "y" not in attrs:
            continue
        try:
            x, y, fs = float(attrs["x"]), float(attrs["y"]), float(attrs.get("font-size", "9"))
        except ValueError:
            continue
        mono = "Mono" in attrs.get("font-family", "")
        ls = attrs.get("letter-spacing", "0")
        ls_em = float(ls[:-2]) if ls.endswith("em") else 0.0
        width = len(text) * fs * ((0.64 if mono else 0.6) + ls_em) + fs  # small safety margin
        anchor = attrs.get("text-anchor", "start")
        x0 = x - width / 2 if anchor == "middle" else x - width if anchor == "end" else x
        out.append([round(x0, 1), round(y - fs * 1.0, 1), round(width, 1), round(fs * 1.35, 1)])  # measured glyph boxes run about 1.4 units taller than fs * 1.1
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True, help="folder holding the source diagrams (searched recursively)")
    ap.add_argument("--out", required=True)
    ap.add_argument("--module", help="also write a TypeScript module with every SVG inlined")
    ap.add_argument("--map", help="JSON palette map {source hex: theme hex} merged over the defaults")
    ap.add_argument("--glob", default="*.html", help="file pattern (default *.html; use *.svg for standalone SVGs)")
    args = ap.parse_args()
    if args.map:
        import json as _json
        HEX.update({k.upper(): v for k, v in _json.loads(Path(args.map).read_text()).items()})
    root = Path(args.src)
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    module = {}
    for html in sorted(root.rglob(args.glob)):
        rel = html.relative_to(root)
        # the name is the relative path with "/" as "__": a/b/container.html -> a__b__container
        name = "__".join(rel.with_suffix("").parts)
        try:
            svg, n = recolour(figure(html.read_text()))
        except ValueError as exc:
            print(f"skip {rel}: {exc}")
            continue
        vb = re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', svg)
        (out / f"{name}.svg").write_text(svg)
        module[name] = (svg, vb.group(1), vb.group(2), regions(svg), label_boxes(svg))
        print(f"{name}.svg  viewBox {vb.group(1)}x{vb.group(2)}  icons kept: {n}")
    if args.module:
        import json as _json
        lines = [
            "/**",
            " * Dark variants of the repository diagrams, generated by tools/darken_diagrams.py.",
            " * Inlined as strings so a diagram renders in the same commit as its scene (the",
            " * layout audit measures its labels synchronously). Do not edit.",
            " */",
            "export interface DarkDiagram {",
            "  svg: string;",
            "  vbW: number;",
            "  vbH: number;",
            "  /** named node boxes [x, y, w, h] in viewBox units, with the node's title */",
            "  regions: Record<string, {title: string; box: [number, number, number, number]}>;",
            "  /** estimated label boxes [x, y, w, h] in viewBox units */",
            "  labels: [number, number, number, number][];",
            "}",
            "",
            "export const diagrams = {",
        ]
        for name, (svg, w, h, regs, labs) in sorted(module.items()):
            lines.append(f"  {_json.dumps(name)}: {{svg: {_json.dumps(svg)}, vbW: {w}, vbH: {h}, regions: {_json.dumps(regs)}, labels: {_json.dumps(labs)}}},")
        lines += ["} satisfies Record<string, DarkDiagram>;", "", "export type DiagramName = keyof typeof diagrams;", ""]
        Path(args.module).write_text("\n".join(lines))
        print(f"module: {args.module}")


if __name__ == "__main__":
    main()
