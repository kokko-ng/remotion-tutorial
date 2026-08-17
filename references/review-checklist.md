# Aesthetic review loop

The review is not optional and it is not one pass. Frames that were never
looked at are frames that ship broken. The loop was designed so that the
second look is a genuinely different look, not a rubber stamp.

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

The same exemption covers captions that annotate a shared track rather than
occupying their own space: the labels sitting on a timeline or progress bar
overlap the bar by design, exactly as an arrow label does. Auditing them
produces red on a layout that is correct. Audit the track, not its captions.

The overlay is worth trusting over your own eye on reserved space. Elements
that are invisible at the sampled frame still reserve their box, so a
collision can be real while every still looks clean. Scanning the debug
frames for the violation color (`#ff0033`) catches these in one pass and is
far quicker than reading every still twice.
