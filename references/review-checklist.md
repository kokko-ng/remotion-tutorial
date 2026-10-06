# Aesthetic review loop

The review is not optional and it is not one pass. Frames that were never
looked at are frames that ship broken. The loop was designed so that the
second look is a genuinely different look, not a rubber stamp.

## Automated layout sweep (run first)

```bash
SWEEP_EVERY_SEC=1 scripts/layout_sweep.sh videos/<slug>   # all chapters
scripts/layout_sweep.sh videos/<slug> ch03     # one chapter after a fix
```

Stills sample a handful of frames; overflow often lives between them (a
label that only appears for two seconds, a callout that wraps once a later
line lands). The sweep renders the `LayoutCheck` composition: every scene
every 2 seconds (`SWEEP_EVERY_SEC` to change) plus its last frame, with the
audit overlay running `runLayoutChecks` (template
`src/components/layout/checks.ts`). Rules, all in composition pixels and
editable in `RULES`:

| Finding | Meaning |
|---|---|
| `overflow:<name>` | text or content spills out of a `[data-fit]` box |
| `inset:<name>` | text closer than 8px to a bordered `[data-fit]` box's edge |
| `overlap:a+b` | two audited blocks intersect (nested blocks are exempt) |
| `tight:a+b(Npx)` | two audited blocks closer than 12px |
| `bounds:<id>` / `text-bounds:x,y` | outside the safe area or inside the subtitle band |
| `wordFrame: "..." not found` | a reveal cue is not in the narration, so it fires at frame 0 |
| `link-gap:<arrow>:<end>(Npx)` | an arrow end does not touch a box, image, text or zone outline (10px); `free` opts a flow arrow out |
| `link-short` | an arrow shorter than 48px reads as a stub; move the boxes apart |
| `link-skew` / `link-diagonal` | a segment a few degrees off an axis, or any diagonal without `diagonal`; route with `via` elbows |
| `link-cross` | an arrow runs through a box or text between its ends |
| `link-label` | an arrow label sits closer than 20px to a box, image or text |
| `link-offcenter:<box>:<edge>` | arrows landing on that edge are not centered on it (15 percent) |
| `marker-over` | a visible `data-marker` (packet, pulse dot) sits on a box or text |
| `content-bounds` | content crosses the left or right edge of `[data-content-box]` |
| `void:content-ends-at-yN` | the scene never paints below y=760 (`SWEEP_MIN_BOTTOM`) |
| `zone-offcenter:<zone>` | content held in a zone for 2 s or more is off center (12 / 15 percent) |

Every rule came from a blemish a human reviewer spotted in a rendered frame
that the earlier checks passed. When a reviewer finds a new class of blemish,
add a rule for the class (and prove it on a seeded example) rather than
fixing only the instance.

Exit 0 means clean, 1 means findings, 2 means a render failed (a failed
render is never reported as clean). Fix every finding, rerun the chapter,
and only then move to the stills. Prove the sweep on a new component by
seeding a too-narrow box once and confirming it is flagged.

## Stills for a human audit

```bash
scripts/export_stills.sh videos/<slug>        # stills/chNN/<sceneId>.png
```

One still per scene at its fullest moment: the sweep logs a density score
(text runs, images, audited blocks) per sampled second, and the densest frame
(latest on ties) is rendered at full resolution without overlays. Scenes that
cut between shots show their busiest shot. Hand `stills/` to the user before
rendering.

## Sampling

`scripts/review_stills.py` renders stills per scene at 15/40/65/90 percent of
the scene's duration (4 per scene), mapping scene-relative positions to
absolute chapter frames from `scenes.json`. `--debug` adds one mid-scene
still with the LayoutAudit overlay. `--shift 5` moves every sample point by
5 percent so pass 2 inspects different animation states than pass 1.

## Pass 1: visual inspection

Render stills, then open every PNG with the Read tool and check, in order:

1. Text clipping or overflow: labels cut off, wrapped mid-word, or escaping
   their box.
2. Unintended overlap: any two elements that visually collide. Transitional
   draw-on states are fine; settled collisions are findings.
3. Safe margins: nothing outside the 5 percent border (the debug overlay
   draws it dashed).
4. Subtitle band: scene content at the bottom 18 percent of the frame
   collides with subtitles. Content must end by y=820 in SafeArea
   coordinates.
5. Contrast: every text legible at a glance; muted ink only for secondary
   labels.
6. Alignment and spacing: rows share baselines, gaps are even, centered
   things are actually centered.
7. Token conformity: any color or font not in the preset is a finding even
   if it looks fine.
8. Dead air: a still showing only the heading means the scene starts too
   late. Start structure (axes, group outlines) within the first 2 seconds.
9. Temporal spot-check: stills cannot show flicker or drift, so for any
   scene with a looping animation (Arrow pulse) or a path-following marker
   (GraphPlot dot), render two extra stills a few frames apart around the
   entrance settle and mid-loop, and confirm the element is present in both
   and sits on its path. See "Motion correctness" in aesthetics.md for the
   two failure modes this catches (progress-gated loops flickering during
   spring settle, and markers desyncing from arc-length dash reveals).

Record findings per still, fix the scene code, and re-render the stills for
the scenes you touched.

## Pass 2: the double-check

Mandatory even when pass 1 was clean, because a clean pass 1 mostly proves
you sampled lucky frames:

```bash
python3 scripts/review_stills.py --project videos/<slug> --shift 5 --debug
```

Inspect the shifted stills with the same checklist, plus the debug stills:
every audited element gets an outline, blue when fine, red when it overlaps a
sibling or breaks the margin. Red anywhere is a finding, including on
elements that are invisible at that frame (their reserved space still
collides). The overlay caught a 2-pixel title-over-box collision the eye
missed; trust it.

## Exit criteria and escalation

A scene passes when one full pass over it yields zero findings and its debug
still shows no red. Cap the loop at 3 fix cycles per scene; if a scene still
fails, attach the offending still and ask the user how they want it resolved
rather than thrashing.

## Audit hygiene in scene code

Wrap in `<Audit id>`: title blocks, headings, nodes, equations, plots, code
panels, callouts. Do not wrap: arrows and edges (they cross boxes by
design), backgrounds, the subtitle layer (it has its own reserved band).
Group boxes audit only their title chip, since nodes inside a group overlap
the group's area on purpose.
