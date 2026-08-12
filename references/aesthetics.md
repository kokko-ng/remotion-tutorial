# Aesthetic presets and anti-slop rules

Every visual value comes from `template/src/theme/tokens.ts`. Scenes never
hardcode colors, fonts, radii, or easing. The presets are designed after
hand-crafted math channels (3Blue1Brown, Primer), and the fastest way to ruin
that is to freestyle.

## Presets

| Token | chalkboard | paper | terminal | print |
|---|---|---|---|---|
| Modeled on | 3Blue1Brown | Primer | code/systems videos | editorial print |
| bg | #0e1117 dark navy | #faf3e3 warm cream | #101418 near black | #f4f1ea off white |
| ink | #e8e6e3 | #3d3733 | #d6deeb | #1a1a1a |
| accents | manim blue #58c4dd, yellow #f5d547, green #83c167, red #fc6255 | blue #4f7ec2, coral #e07856, leaf #7ca465 | amber #ffb454, teal #7fd6c2, magenta #d16d9e | vermilion #d0402b, slate #33506b |
| heading font | STIX Two Text (serif) | Nunito | IBM Plex Mono | Source Serif 4 |
| shapes | 4px radius, 2.5px strokes, filled panels | 24px radius, flat filled, no strokes | 2px radius, 1.5px strokes | square, hairline rules |
| motion | SVG draw-on, 22 frames, gentle bezier | springs with slight overshoot | hard snaps, typewriter | fades and hard cuts |
| subtitles | plain white, soft shadow | plain warm ink, no background | karaoke amber highlight | hairline top rule |
| vignette | yes (only preset allowed one) | no | no | no |

When to pick which: chalkboard for math and theory, paper for friendly ELI5
and metaphor-driven explainers, terminal for systems, infrastructure, and
code walkthroughs, print for history, proofs, and editorial tone.

## Samples

One scene and one title card per preset, all rendered from the same source,
so the difference between two presets is only the tokens. Show these to the
user when they are picking a preset.

| preset | scene | title card |
|---|---|---|
| chalkboard | [chalkboard.png](../samples/chalkboard.png) | [chalkboard-title.png](../samples/chalkboard-title.png) |
| paper | [paper.png](../samples/paper.png) | [paper-title.png](../samples/paper-title.png) |
| terminal | [terminal.png](../samples/terminal.png) | [terminal-title.png](../samples/terminal-title.png) |
| print | [print.png](../samples/print.png) | [print-title.png](../samples/print-title.png) |

The showcase scene lives in `samples/showcase/`. After changing any token in
`template/src/theme/tokens.ts`, or any component the showcase uses, rerun
`samples/render_samples.sh` so the images still describe the presets.

## Hard anti-slop rules

These are what separate the output from generic AI-generated UI. Violating
any of them is a review finding:

- No gradients. The single exception is the chalkboard vignette that ships in
  the template background.
- No glassmorphism, no backdrop blur, no frosted cards.
- No drop shadows, except paper's one built-in 4 percent soft shadow.
- No emoji, no icon fonts, no clip art, no stock imagery.
- Maximum two typefaces plus the mono, and they come from the preset.
- One emphasis accent per scene. The other accents carry stable meaning
  across the whole video (e.g. green = data tier everywhere), never
  decoration.
- Empty space is good. A scene with one diagram and honest margins beats a
  scene stuffed with panels. If a scene needs more than 7 audited elements,
  split it.
- Motion is meaning: an element animates when the narration introduces it,
  not because idle motion looks lively. No floating, no pulsing except the
  Arrow traffic dot, no parallax.

## Motion correctness

Two bugs shipped once and are now rules:

- Gate looping animations (traffic pulses, blinking cursors) on elapsed
  frames, never on entrance progress reaching 1. Spring entrances overshoot
  and oscillate around 1 while settling, so a `progress >= 1` check turns the
  loop on and off for several frames and the element flickers at arbitrary
  positions. The Arrow pulse starts at `startFrame + 1.5 x motionFrames` and
  advances monotonically from there.
- A marker riding a dash-revealed path must be positioned by cumulative arc
  length, the same measure `strokeDashoffset` reveals by. Indexing points by
  draw progress desyncs the marker wherever arc length is not uniform in x
  (a sigmoid's steep middle draws slower than its flat ends). GraphPlot
  interpolates the tip position from cumulative segment lengths; reuse that
  approach for any new path-following element.

## Composition habits that read as hand-crafted

- Reveal on the spoken word (`wordFrame`), stagger siblings by 4 to 8 frames.
- Draw-on for structure (groups, arrows, axes), then fill content.
- Sublabels in the mono font carry the precise term (an IP, a CIDR, a type
  signature) while the label carries the friendly name.
- Recap scenes reuse the video's own vocabulary: the same colors and shapes
  the concepts wore when they were taught, stated plainly (term plus a short
  definition, no quiz framing).
