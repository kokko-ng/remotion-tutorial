# Aesthetic review loop

The review is not optional and it is not one pass. Frames that were never
looked at are frames that ship broken. The loop was designed so that the
second look is a genuinely different look, not a rubber stamp.

## Automated layout sweep (run first)

```bash
scripts/layout_sweep.sh videos/<slug>          # all chapters
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

Exit 0 means clean, 1 means findings, 2 means a render failed (a failed
render is never reported as clean). Fix every finding, rerun the chapter,
and only then move to the stills. Prove the sweep on a new component by
seeding a too-narrow box once and confirming it is flagged.

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
