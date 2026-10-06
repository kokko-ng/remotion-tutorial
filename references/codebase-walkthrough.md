# Codebase walkthrough videos (Fireship-style onboarding)

The default structure for a narrated video that walks engineers through a
codebase: its architecture, modules, design decisions and cloud services. It
was proven on a 90-minute, 10-chapter, 78-scene architecture walkthrough.
Read `gotchas.md` alongside; every rule below exists because something broke.

The briefs this method uses are templates in `references/briefs/`:
`STYLE.md` (narration voice and grounding), `AUDIT-BRIEF.md`, `FIX-BRIEF.md`,
`SSML-SPEC.md`, `SCENE-GUIDE.md`. Copy them into the video project and fill
the placeholders.

## 0. Ground rules

- **Grounding is the product.** Every claim on screen or in the narration
  comes from the repository: docs, decision records (ADRs), code, config, IaC,
  CI workflows. Where docs and code disagree, the code wins. A reason that no
  document gives is either cut or spoken as inference ("the docs do not say
  why; the likely reason is...") and listed in the scene's `inferred` field.
  A decision recorded only as "the product owner decided" is said exactly that
  way; never invent a technical reason for it.
- **Respect the repository's own rules.** Read its CLAUDE.md, AGENTS.md or
  CONTRIBUTING first. Never open, quote or describe a local-only or ignored
  reference folder; never show anything a repository rule keeps out of commits
  (client names, real people's names or emails, credentials). Config files can
  carry an email (a deployment parameter file, a CODEOWNERS file): crop it.
- **The video project lives outside the repository** it explains (its hooks,
  file limits and cleanliness rules are not yours to break). Use a dedicated
  git worktree for any change you make to the repository itself; other agents
  may share the main checkout.
- **The repository moves during production.** Record the commit you verified
  against at every audit pass, and re-verify against the current HEAD.

## 1. Outline (user checkpoint)

- One **through-line**: a single sentence the whole video returns to, ideally
  one that every chapter can test against (for example "nothing is trusted
  until something checks it: not the input, not the model, not the config,
  not the bill").
- **6 to 10 chapters, each a self-contained episode**: a cold open that hooks
  in the first sentence (a failure, a gag, a surprising fact), an episode
  sting (number and title on a cleared frame), 4 to 8 beats, and a plain
  recap. A viewer who starts at chapter 6 must not hit an unexplained term.
- Cover, across chapters: what the system does and its end-to-end flow; the
  key modules, their boundaries and how they interact; the key decisions with
  the alternatives considered and the trade-offs; and each cloud service with
  why it was chosen and how it fits.
- **Scenes**: one visual idea each, 30 to 120 seconds. List per scene the
  visual idea, the seconds, and the repository files that ground it. Assign
  every repository diagram to a scene.
- **Timing budget** per chapter that sums to the target, and a word budget
  per scene. Do not trust a fixed words-per-minute figure: a Fireship pace is
  far faster than an explainer pace. Measure a sample in the chosen voice and
  rate (for example Davis at +8 percent ran about 210 wpm; the 155 wpm
  default undershot a 90-minute target by 20 percent). Final chapter lengths
  come from the synthesized audio; adjust the global rate and sentence gap to
  land the total, not the words.
- List up front: rationale you are inferring, doc and code discrepancies,
  content rules you apply. Get sign-off before writing prose.

## 2. Narration

- **Parallel writers**, two chapters each, all reading `STYLE.md` and the
  outline, each reading every file it cites before writing a scene. Output per
  chapter: `script/chNN.json` with `text`, `visual` (shot list), `sources`,
  `inferred`, `sec`, `targetWords` per scene.
- **Gag ownership**: parallel writers reuse the same jokes and openers.
  Assign each recurring gag and stock opener to one chapter.
- **Humanizer pass** with the humanizer skill (load it explicitly in every
  agent that rewrites text), keeping word counts within a few percent.
- **Three sequential audits**, each by a fresh strong-model agent following
  `AUDIT-BRIEF.md` (facts against the code, rationale honesty, content rules,
  humanizer patterns, Fireship pacing, budget). Between audits, fixers follow
  `FIX-BRIEF.md`: verify every finding against the code before applying it
  (auditors are wrong sometimes), reopen the cited file for every factual
  change, grep all chapters for repeats of a fixed claim, re-check visual line
  ranges against the moved repository. Expect each audit to find real errors:
  three passes found 109, 63 and 42 issues (18, 7 and 4 blockers), mostly
  places where the docs said one thing and the code another.
- Final consistency sweep yourself: repeated gags, dashes, banned words,
  spellings that subtitles must keep ("ID", not a phonetic "I D").
- Deliver `NARRATION.md` (all chapters, scenes in order, inferred rationale
  flagged inline).

## 3. Voice

- **SSML per scene** (`SSML-SPEC.md`): the narration as inner `<voice>`
  content with `<sub alias>` for identifiers (the subtitle keeps the
  spelling), short prosody asides and slowed punchlines, a `<break>` at each
  `[beat]`, emphasis on contrast words. `scripts/validate_ssml.py` must report
  0 problems: the SSML's visible text equals the subtitle text, breaks equal
  beats, only allowed elements.
- **Voice A/B** on one scene before synthesizing everything: `<emphasis>`
  works only on en-US-GuyNeural, DavisNeural and JaneNeural; multilingual
  voices sound more natural but ignore emphasis and return messier word
  boundaries. Save both samples for the user.
- `scripts/generate_voiceover.py` (SSML mode, authored `ssml` fields,
  `sentenceGap`) flattens prosody so `<break>` and `<emphasis>` never sit
  inside `<prosody>`, and aligns word events to the subtitle words.
- Build subtitles (`build_srt.py`), check chapter lengths against the budget,
  re-synthesize only changed scenes with `--scenes`.

## 4. Assets

- **Image gags** (`scripts/generate_images.py`, FLUX.2 [pro] on Azure AI
  Foundry, or openly licensed stock): about two per chapter, each landing on a
  real technical point (a bouncer with a guest list for a host allow-list, an
  expired milk carton for a shelf-life rule). One shared style suffix in the
  terminal palette; no text in images (labels go on top in Remotion); check
  every count-bearing image (models miscount); every image gets a provenance
  sidecar and a `CREDITS.md` row (`scripts/build_credits.py`).
- **Official cloud icons** (for example the Azure architecture icons) only
  unmodified and at uniform scale, each with its service name nearby, only for
  the product it represents (no Cache for Redis icon on Azure Managed Redis),
  never drawn over (strike a name through instead).
- **Repository diagrams on the dark background**: `scripts/darken_diagrams.py`
  recolours each diagram's own SVG (icons kept byte for byte), raises line
  contrast and label sizes, and emits `src/assets/diagrams.generated.ts` with
  node regions and label boxes. Never a CSS filter, never a redraw.
- **C4 naming**: if the codemaps are C4 diagrams, name each on screen by its
  C4 type (system context, container, component), never "code-level" for a
  container diagram; label non-C4 figures "not a C4 diagram". Shared libraries
  are not C4 containers; if the repository's codemaps get that wrong, fixing
  them is a separate, reviewed change to the repository (with a decision
  record), not something the video papers over.

## 5. Design

- The `terminal` preset is the base. Apply a design craft floor (for example
  the Impeccable skill: `detect` plus its craft-floor, type, colour, layout and
  motion references): muted ink at 4.5:1, no side-stripe borders above 1px, no
  eyebrows above headings, no decorative window chrome, mono only for code,
  paths and literal values, one focal motion per beat (the diagram camera
  snap), hard cuts for everything else. Record it in a `DESIGN.md`.
- Fireship pacing: a cut or reveal every 2 to 5 seconds, a Slam for one
  punchline per beat, a Stamp for a verdict, an image cut-in for the gag.

## 6. Scenes

- Scaffold from `template/`. The kit (`src/components/kit/`): `DiagramShot`
  (dark diagram, camera focus, marks; `frameNodes` frames whole nodes without
  slicing labels), `CodeFile` (real excerpt with real line numbers), `Terminal`,
  `Window`, `Slam`, `Tag`, `Stamp`, `Note`, `AdrCard` (question, options,
  verdict, the record's own reason), `AzureIcon`, `ImageCut` (credit in the
  title bar), `Recap`, `EpisodeSting`, `useSceneWords`. See `SCENE-GUIDE.md`.
- **Parallel builders**, two chapters each, with per-chapter registries
  (`src/scenes/chNN/index.ts`) so nobody edits a shared file. A builder may
  not change the kit, the audit or the tests; it reports a kit bug instead.
  After all builders finish, typecheck and sweep every chapter again (a kit
  fix by one changes all).
- Repository text on screen is copied verbatim from the current repository.
  Mock cards, terminals and outputs are labelled "illustrative".

## 7. Layout linter (must be green before any render)

`scripts/layout_sweep.sh` runs every rule in `checks.ts` on every scene
every 2 seconds. Run `scripts/layout_selftest.sh` after changing any rule or
kit component: it proves the fixture (`src/scenes/dev/`) trips every rule and
the clean preview trips none. A rule that suddenly reports zero issues gets
suspicion, not relief: two rules once passed everything because of a selector
bug and a too-generous exemption. When a human reviewer finds a layout bug in
a still, add a rule that catches it and a fixture element that breaks it,
then sweep again.

## 8. Human review, then render

- `scripts/export_stills.sh` writes one still per scene (its fullest clean
  frame) to `stills/`. Hand the folder to the user before rendering; expect
  real findings (overflow off the frame, a left-indented showcase, detached
  arrows, columns that start lower than their neighbours) and turn each into
  a rule.
- Render per chapter, concat, deliver the mp4, the .srt, `NARRATION.md` and
  `CREDITS.md`.

## 9. Temporary cloud resources

- Confirm the CLI's subscription before creating anything. Put temporary
  resources (a Speech resource, an AI Services resource with an image model
  deployment) in a **dedicated, uniquely named resource group** tagged
  `lifecycle=temporary`, so they cannot clash with anything else in a shared
  group. Record names in an `AZURE-RESOURCES.md`.
- If a resource or model is unavailable in the subscription, stop and tell
  the user rather than using another subscription. Regions within the same
  subscription are fine to choose.
- When every asset is final: delete the model deployment, delete each
  Cognitive Services account, **purge** it (soft delete keeps the name), then
  delete the resource group.
