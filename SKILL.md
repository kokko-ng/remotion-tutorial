---
name: remotion-tutorial
description: >-
  Produce a long-form technical tutorial video (math and computer science
  focus) with Remotion: a narrated, animated explainer in the visual style of
  3Blue1Brown or Primer, with an Azure TTS voiceover, burned-in subtitles, and
  an exported .srt file. Use when the user asks for a tutorial video, explainer
  video, narrated video, video course, animated lesson, or "turn this topic
  into a video". Also produces Fireship-style codebase walkthroughs
  (architecture onboarding videos grounded in a repository's docs, decision
  records, code and diagrams): use when the user asks for a video tour,
  onboarding video or architecture walkthrough of a codebase. Parameterized by
  topic, duration (default 60 minutes), aesthetic preset, and audience level. Requires macOS/Linux with node, ffmpeg,
  python3, and an Azure subscription with a Speech or AIServices resource.
---

# remotion-tutorial

Build a complete tutorial video from a topic string. The pipeline: outline,
narration script, Azure batch TTS with word-level timestamps, React scenes
keyed to the spoken words, a mandatory two-pass aesthetic review of rendered
frames, per-chapter renders, and a lossless concat into the final mp4 plus a
sidecar .srt.

The quality bar has two halves. The narration must sound like a person
explaining something they love (see `references/narration-voice.md` and
`references/humanizer.md`). The visuals must look like a hand-crafted math
channel, not a slide deck (see `references/aesthetics.md`). Neither is
optional.

## Codebase walkthrough mode

When the subject is a codebase (an architecture walkthrough, an onboarding
tour, "explain this repo as a video"), follow
`references/codebase-walkthrough.md` as the structure for the whole job: it
replaces Steps 2 and 3 below (episodic chapters with cold opens and recaps,
parallel writers, a humanizer pass, three sequential audits) and adds the
asset, diagram, design and review steps on top of Steps 4 to 10. Its
known pitfalls are in `references/gotchas.md`, and the briefs it hands to
subagents are templates in `references/briefs/`. Default preset: `terminal`. Grounding
comes from the repository, not the web (`references/grounding.md` still
applies to any external claim).

## Step 0: Preflight

Check the environment before promising anything:

```bash
node --version        # needs 18+; template pins typescript@^5 (TS 7 breaks Remotion's bundler)
ffmpeg -version
python3 --version
az account show       # must be logged in
az cognitiveservices account list --query "[].{name:name, kind:kind, rg:resourceGroup}" -o table
```

A `kind` of `SpeechServices` or `AIServices` both work for TTS. If no resource
exists, ask the user before creating anything in their subscription.

Tell the user: Remotion requires a paid company license for companies with
more than 3 employees (https://remotion.dev/license). Individuals and small
teams use it free. Surface this once per project before the first render.

## Step 1: Parameters

Collect or infer:

- **topic** (required), e.g. "eigenvalues", "Raft consensus", "Azure Front Door"
- **duration** in minutes, default 60
- **aesthetic**: one of `chalkboard` (3Blue1Brown-like dark), `paper`
  (Primer-like warm light), `terminal` (systems/code dark), `print`
  (editorial light). Show the user the one-line descriptions and point them
  at the sample stills in `samples/` (`<preset>.png` is a scene,
  `<preset>-title.png` a title card), then let them pick.
- **audience**: beginner, practitioner, or interview prep

Word budget: duration x the words per minute of the chosen voice and rate.
Measure it on one sample scene before budgeting; do not assume a figure.
Explainer pace is about 155 wpm (en-US-AvaMultilingualNeural at -4%, so 60
minutes is roughly 9,300 words); Fireship pace is far faster (en-US-
DavisNeural at +8% runs about 210 wpm). Land the final length with the
global rate and sentence gap, not by padding words.

## Step 2: Outline and grounding (user checkpoint)

For a 60-minute video: 8 to 12 chapters of 4 to 8 minutes; each chapter is 3
to 6 scenes of 45 to 120 seconds. One scene = one visual idea = one React
component. Write `outline.md` listing chapters, scenes, the through-line
sentence (the single organizing idea the whole video hangs on), and per-scene
word targets. Get the user's sign-off before writing prose. Skip this
checkpoint only for videos under 5 minutes.

While outlining, ground the content per `references/grounding.md`: verify
every technical claim against an official source (vendor docs, the original
paper, the standard), record the sources in `sources.md`, and confirm each
source's license permits use in an educational video posted publicly. Facts
are restated in your own words; anything reproduced verbatim (a figure, a
quote, a diagram) needs a license that allows it plus attribution.

## Step 3: Narration

Write the narration scene by scene following `references/narration-voice.md`
(three-beat rhythm, verbal signposting, one analogy per hard idea, plain
recap ending). Then run the mandatory humanizer pass from
`references/humanizer.md`: grep for banned vocabulary and em dashes, read a
paragraph aloud in your head, check sentence-length variance. The narration is
also the subtitle text, so every sentence must survive being read on screen.

Save as `narration.json`:

```json
{
  "voice": "en-US-AvaMultilingualNeural",
  "rate": "-4%",
  "scenes": [{"id": "s01", "text": "..."}, {"id": "s02", "text": "..."}]
}
```

Scene ids are `s01`, `s02`, ... in playback order.

## Step 4: Scaffold the project

```bash
cp -R template videos/<slug>
cd videos/<slug> && npm install
```

Edit `scenes.json`: set `preset`, `title`, the chapter list, and one scene
entry per narration scene (`durationSec: 0` until TTS runs; `padOutSec` 0.5
to 0.8 for breathing room). Composition ids equal chapter ids (`ch01`...).

## Step 5: Voiceover

```bash
python3 scripts/generate_voiceover.py \
  --narration videos/<slug>/narration.json \
  --project videos/<slug> \
  --resource-name <resource> --resource-group <rg> [--subscription <id>]
```

One batch job synthesizes every scene and returns per-word timestamps. Outputs
per scene: `public/audio/sNN.wav` and `public/audio/sNN.words.json`, and the
measured `durationSec` is written back into `scenes.json`. Details, endpoint
notes, and the SDK fallback: `references/azure-tts.md`.

For pacing control use SSML mode: add `--ssml` (or `"ssml": true` in
narration.json). The rate becomes a prosody rate, `[beat]` markers in the
narration become short breaks, and `--lexicon lexicon.json` maps on-screen
terms to spoken aliases (`{"GiB": "gibibytes"}`). Then run
`scripts/pronunciation_qa.py` (speech-to-text diff against the narration) and
fix misread terms with lexicon entries before building subtitles.

## Step 6: Subtitles

```bash
python3 scripts/build_srt.py --project videos/<slug>
```

Produces `public/audio/sNN.chunks.json` (consumed by the Subtitles component)
and `out/final.srt` with timings that mirror the Remotion timeline exactly.

## Step 7: Scenes

Write one component per scene in `src/scenes/`, register it in
`src/scenes/index.ts`. Rules:

- Compose only from the component library (`TitleCard`, `SectionHeading`,
  `diagram/Node`, `diagram/Group`, `diagram/Arrow`, `EquationBlock`,
  `GraphPlot`, `CodePanel`, `Callout`), the kit in `src/components/kit/`
  (`DiagramShot`, `CodeFile`, `Terminal`, `Window`, `Slam`, `Tag`, `Stamp`,
  `Note`, `AdrCard`, `AzureIcon`, `ImageCut`, `Recap`, `EpisodeSting`,
  `useSceneWords`; see `references/briefs/SCENE-GUIDE.md`) and theme tokens.
  Never hardcode a color, font, or radius.
- Place content inside `<SafeArea>` (the 5 percent margin). SafeArea
  coordinates run 0 to 1728 x 0 to 972 at 1080p. Keep everything above y=820:
  the bottom band belongs to subtitles.
- Key each visual reveal to the narration with
  `wordFrame(words, 'subnet')`, where `words` comes from
  `useJson<WordToken[]>(`audio/${sceneId}.words.json`)`. The element appears
  the moment the word is spoken.
- Avoid dead air: something should be drawing within the first 2 seconds of
  every scene (start axes or a group outline early, keep the payload keyed to
  its word).
- Wrap every element that must never overlap a sibling in
  `<Audit id="...">`. Do not wrap arrows; connectors legitimately cross boxes.
- Mark every bounded box you write (a fixed-width label, chip, card or cell)
  with `data-fit="<name>"` so the layout sweep checks that its text fits and
  keeps its inset. Node, Callout and CodePanel already do.
- `wordFrame` accepts phrases (`wordFrame(words, 'encryption at host')`).
- Connectors (`Arrow`): route orthogonally with `via` elbows; both ends must
  touch what they connect (`free="end"` only for deliberate flow arrows);
  at least 48px long; never through a box or text; labels 20px clear of
  boxes; arrows landing on one edge of a box center on it.
- Anything that moves along a diagram (packets, dots, cursors) carries
  `data-marker` and travels on connector segments only, never on a box.
- Content inside a `Group` (a zone) stays centered in it whenever it holds
  still for 2 seconds; every scene's content reaches below y=760.

Run `npx tsc --noEmit` in the project until clean.

## Step 8: Aesthetic review (mandatory, two passes)

Follow `references/review-checklist.md` exactly. Summary:

```bash
SWEEP_EVERY_SEC=1 scripts/layout_sweep.sh videos/<slug>              # automated, whole video
python3 scripts/review_stills.py --project videos/<slug>            # pass 1
python3 scripts/review_stills.py --project videos/<slug> --shift 5 --debug   # pass 2
```

The layout sweep runs first and must exit 0 at 1-second sampling
(`SWEEP_EVERY_SEC=1`). It renders every scene with the layout audit on and
fails on every rule in `src/components/layout/checks.ts` (table in
`references/review-checklist.md`): text overflowing its box or the frame,
text closer than 8px to a bordered edge, blocks overlapping or closer than
16px, anything outside the safe area, the content box or in the subtitle
band, clipped text, duplicate audit ids, illegible, sliced or unnamed diagram
labels, an off-centre composition, side-by-side columns with different tops,
connector problems (dangling ends, stubs, skewed or diagonal segments,
arrows through boxes or text, crowded labels, off-center landings, piled-up
heads), markers sitting on boxes, off-center zones, scenes that leave the
lower third empty, and any `wordFrame` cue that is not in the narration.
After changing a rule or a kit component, run
`scripts/layout_selftest.sh videos/<slug>`: the `devfail` fixture must trip
every rule and the `dev` preview none. Stills sample 4 to 5 frames per scene;
the sweep covers the rest. Before rendering,
`scripts/export_stills.sh videos/<slug>` writes one full-resolution still per
scene (its fullest frame with no layout finding) to `stills/` for the user's
visual audit; turn every finding the user makes there into a rule.

Pass 1: look at every still with the Read tool against the checklist
(clipping, overlap, margins, subtitle collisions, contrast, token
conformity). Fix findings in scene code. Pass 2 is a genuine double-check:
shifted sample points plus the LayoutAudit debug overlay, which draws red
outlines on any overlap or safe-margin violation. A scene passes only when the
layout sweep is clean, a full pass has zero findings, and the debug still
shows no red. Never render the final video before every scene passes.

## Step 9: Render per chapter

```bash
cd videos/<slug>
npx remotion render src/index.ts ch01 out/ch01.mp4 --crf 18
npx remotion render src/index.ts ch02 out/ch02.mp4 --crf 18
...
```

Chapters are the retry unit. Expect roughly 15 to 30x realtime on Apple
Silicon for these scene types (a 60-minute video takes about 2 to 4 hours;
budget for it and render chapters in the background). Verify each chapter's
audio with `ffmpeg -af volumedetect` (mean around -21 dB, never -inf).

## Step 10: Concat and deliver

```bash
scripts/concat_chapters.sh videos/<slug>    # lossless concat -> out/final.mp4
```

Deliver `final.mp4` and `final.srt`. Spot-check the first and last seconds of
two chapter boundaries for audio truncation. Report total duration, file
size, and where the files live. Keep the delivery message short.

## Layout constants worth memorizing

- Frame: 1920x1080 at 30 fps. SafeArea: 1728x972, origin at (96, 54).
- Subtitle band: bottom 18 percent of the frame. SafeArea y above 820 is off
  limits to scene content.
- Scene length: `ceil((durationSec + padOutSec) * fps)` frames. All timing
  math lives in `src/manifest/timing.ts`; never duplicate it.
