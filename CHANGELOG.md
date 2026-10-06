# Changelog

## 1.1.0

- Automated layout sweep: `scripts/layout_sweep.sh` renders a new
  `LayoutCheck` composition (every scene every 2 seconds plus its last frame)
  with the layout audit on and fails on text overflowing `[data-fit]` boxes,
  text too close to a bordered edge, blocks overlapping or closer than 12px,
  anything outside the safe area or in the subtitle band, and missing
  `wordFrame` cues. Render failures exit 2 and are never reported as clean.
- Layout audit rewritten around `components/layout/checks.ts` (`RULES`,
  `runLayoutChecks`): ink-level text bounds via ranges, minimum gaps and
  insets, nested audited blocks exempt from overlap, audit overlay excluded
  from its own measurements, scene-scoped DOM queries.
- `data-fit` on Node (with `data-fit-bordered`), Callout and CodePanel;
  subtitles marked `data-subtitles` and skipped by the checks.
- `generate_voiceover.py`: SSML mode (`--ssml`, prosody rate, `[beat]`
  breaks, `--lexicon` sub-alias pronunciations); plain-text mode strips
  `[beat]`; `--resource-name` and `--resource-group` are now required
  (removed author-specific defaults).
- `wordFrame` matches multi-word phrases.
- Chapter: `audio` prop (the sweep renders without voiceover); scene
  `Sequence` and `Audio` premount one second, per Remotion best practice.

## 1.0.0

- Initial release.
