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
| `tight:a+b(Npx)` | two audited blocks closer than 16px (`minGap`) |
| `bounds:<id>` / `text-bounds:x,y` | outside the safe area or inside the subtitle band |
| `duplicate-id:<id>` | two visible audited blocks share an id (the audit would merge them) |
| `text-overflow:<id>` | an audited block's text ink spills sideways out of it (a nowrap tag running off the frame) |
| `clipped-text:<id>` | text cut off by an overflow-hidden box; mark deliberate crops `data-clip-intended` |
| `illegible-text:<id>(Npx)` | a settled diagram view shows a label smaller than 16px (`minLabelPx`): an overview held too long |
| `cropped-label:<id>` | a diagram zoom slices a label at the viewport edge; use `frameNodes` |
| `unlabelled-node:<id>` | a diagram zoom shows a node box without its name |
| `off-center:<id>` | a composition wider than 60 percent of the safe width is more than 5 percent off centre; opt out with `data-layout-intent="asymmetric"` or exclude chrome with `data-composition-ignore` |
| `arrow-detached` | an arrow end is more than 14px from any audited box |
| `arrow-through-text` | an arrow or its label crosses text |
| `arrow-pileup` | two arrow heads from different tails land within 10px of each other |
| `column-top:a+b(Npx)` | side-by-side columns start more than 24px apart vertically (full-width rows are exempt) |
| `wordFrame: "..." not found` | a reveal cue is not in the narration, so it fires at frame 0 |

Every rule except `wordFrame` and `inset` came from a defect a human found in
a still that the sweep had passed. When that happens again, add the rule, add
an element that breaks it to the `devfail` fixture, and extend
`scripts/layout_selftest.sh`.

Exit 0 means clean, 1 means findings, 2 means a render failed (a failed
render is never reported as clean). Fix every finding, rerun the chapter,
and only then move to the stills.

Prove the sweep can fail before trusting it clean:

```bash
scripts/layout_selftest.sh videos/<slug>
```

It sweeps the template's development chapters: `devfail`
(`src/scenes/dev/DevLayoutFixture.tsx`, `DevColumnFixture.tsx`) breaks every
rule on purpose and must report each one; `dev` (`DevPreview.tsx`) is a clean
composition and must report none. Both carry `dev: true` in `scenes.json`, so
the default sweep, stills and renders skip them. Run it after any change to a
rule, `audit.tsx` or a kit component. A rule that suddenly reports nothing
anywhere deserves suspicion: two rules once passed everything because of a
selector bug and an over-generous exemption.

## Stills for a human audit

```bash
scripts/export_stills.sh videos/<slug>        # stills/chNN/<sceneId>.png
```

One still per scene at its fullest moment: the sweep logs a density score
(text runs, images, audited blocks) per sampled second, and the densest frame
with no `[layout]` finding (latest on ties; a frame with findings only when
every sampled frame has one) is rendered at full resolution without
overlays. Scenes that
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
