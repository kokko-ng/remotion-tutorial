# Changelog

## 1.2.0

- Codebase walkthrough mode: `references/codebase-walkthrough.md` is the
  default structure for Fireship-style onboarding videos about a repository
  (outline, parallel writers, humanizer, three audits, SSML voice, assets,
  design craft floor, scenes, linter, human stills review, temporary cloud
  resources). `references/gotchas.md` records every pitfall the method hit,
  and `references/briefs/` holds the subagent brief templates (style, audit,
  fix, SSML, scene guide).
- New layout rules in `checks.ts`: `duplicate-id`, `text-overflow`,
  `clipped-text`, `illegible-text`, `cropped-label`, `unlabelled-node`,
  `off-center`, `arrow-detached`, `arrow-through-text`, `arrow-pileup`,
  `column-top`. `minGap` is 16px (was 12px).
- `scripts/layout_selftest.sh` and the `dev`/`devfail` template chapters
  prove every rule trips on a fixture and none on a clean preview. Chapters
  marked `"dev": true` are skipped by default sweeps, stills and renders.
- `export_stills.sh` prefers the fullest frame with no layout finding.
- Scene kit (`template/src/components/kit/`): `DiagramShot` with
  label-safe `frameNodes` zooms, `CodeFile`, `Terminal`, `Window`, `Slam`,
  `Tag`, `Stamp`, `Note`, `AdrCard`, `Recap`, `EpisodeSting`, `ImageCut`,
  `AzureIcon`, `useSceneWords` (wraps `wordFrame`).
- `generate_voiceover.py`: authored per-scene `ssml`; prosody is flattened so
  `<break>` and `<emphasis>` never sit inside `<prosody>` (Azure ignores or
  rejects them there, which the whole-scene wrap triggered); emphasis is
  unwrapped for voices that do not support it; `sentenceGap`; word events are
  aligned to the subtitle words by sequence.
- New scripts: `validate_ssml.py`, `darken_diagrams.py` (recolour repository
  SVG diagrams for dark presets and emit node and label regions),
  `generate_images.py` (FLUX.2 [pro] on Azure AI Foundry with provenance
  sidecars), `build_credits.py`.
- Word budgets are calibrated per voice and rate instead of a fixed 155 wpm.

## 1.1.2

- `wordFrame` matches across multi-word boundary tokens (Azure returns some
  numbers with units as one token, "99.99 percent"), so such cues no longer
  silently resolve to frame 0.
- Chapter renders each scene only after its word timings load (`SceneGate`),
  so premounting scenes no longer flash every reveal at frame 0 or produce
  false overlaps in the sweep.
- New `scripts/export_stills.sh`: one full-resolution still per scene at its
  fullest moment (density logged by the layout audit), for a user audit
  before rendering.

## 1.1.1

- `generate_voiceover.py`: SSML `<sub alias>` word boundaries are mapped back
  to the display text (Azure returns the alias plus a stray `">` token), so
  lexicon entries no longer corrupt words.json or subtitles.
- New `scripts/pronunciation_qa.py`: transcribes each scene with Azure fast
  transcription and diffs it against the narration to find misread acronyms
  and names.

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
