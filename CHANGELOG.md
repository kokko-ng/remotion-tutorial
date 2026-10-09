# Changelog

## 1.3.1

- Prompt audit of the skill and its references: removed the retired
  `arrow-detached` and `arrow-through-text` rows from the review checklist
  and gotchas (superseded by `link-gap`, `link-cross` and `link-label`),
  fixed the scene guide's import paths and layout sweep command, aligned the
  narration example with the default voice (Ava) and the walkthrough sweep
  with 1-second sampling, replaced fixed rate, gap and words-per-second
  figures in the brief templates with placeholders, and trimmed history
  narratives and a word cap from the instructions.

## 1.3.0

- Codebase walkthrough mode: `references/codebase-walkthrough.md` is the
  default structure for Fireship-style onboarding videos about a repository
  (outline, parallel writers, humanizer, three audits, SSML voice, assets,
  design craft floor, scenes, linter, human stills review, temporary cloud
  resources). `references/gotchas.md` records every pitfall the method hit,
  and `references/briefs/` holds the subagent brief templates (style, audit,
  fix, SSML, scene guide).
- New layout rules in `checks.ts`: `duplicate-id`, `text-overflow`,
  `clipped-text`, `illegible-text`, `cropped-label`, `unlabelled-node`,
  `off-center`, `arrow-pileup`, `column-top`. `minGap` is 16px (was 12px).
- Merged with 1.2.0's connector rules: the straight-arrow `arrow-detached` and
  `arrow-through-text` checks are superseded by `link-gap`, `link-cross` and
  `link-label`, which also handle elbowed arrows, `free` ends and zone
  outlines; the self-test fixture now trips every rule of both sets.
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

## 1.2.0

Layout rules learned from a human audit of a 120-minute video, each one a
class of blemish the earlier checks passed:

- `Arrow` routes with `via` elbows and exposes its geometry to the audit.
- New sweep rules: `link-gap` (dangling arrow ends), `link-short` (stubs
  under 48px), `link-skew` / `link-diagonal` (orthogonal routing),
  `link-cross` (arrows through boxes or text), `link-label` (crowded arrow
  labels), `link-offcenter` (landings centered on box edges), `marker-over`
  (packets or dots on boxes), `content-bounds` (content leaving its content
  box), `void` (empty lower third) and `zone-offcenter` (content off center in
  a Group).
- `Group` marks its outline as a zone; `SafeArea` marks the content box.
- `build_srt.py` attaches opening quotes and brackets to the next word.
- `generate_voiceover.py` drops the sentence copies Azure emits at SSML breaks.

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
