# Gotchas

Every issue hit while producing a 90-minute codebase walkthrough video, with the fix
that worked. Most are now enforced by the template, the scripts or the layout
linter; the rest are process rules. Read before starting a walkthrough
(`codebase-walkthrough.md`) and add to this file when something new breaks.

## Environment and sandbox

- `az` fails inside the Claude Code sandbox: it writes `~/.azure/commands/*.log` and
  `~/.azure/az.sess`. `AZURE_LOGGING_ENABLE_LOG_FILE=false` fixes the log file only; the
  session file still needs the sandbox disabled for az calls. Network needs
  `management.azure.com` and `login.microsoftonline.com`.
- The video project lives outside the repository being explained (repo hooks, file-length
  and cleanliness rules). Writes there need the sandbox disabled; the Write tool works.
- `$TMPDIR` differs inside and outside the sandbox (a sandbox-specific tmp path vs
  `/var/folders/...`): use absolute paths in commands that cross the boundary.
- Generated subagent transcripts are huge; never tail them.

## Planning and narration

- Fireship pace with Azure Davis at +8% is about 210 wpm, so a word budget computed at the
  skill's 155 wpm comes out about 20 percent short of the target. Calibrate on a real
  sample, then set the rate: a 15,100-word script landed at 90.07 minutes with Davis,
  rate -6%, sentence gap 260 ms, 0.6 s scene pad.
- Parallel chapter writers repeat each other's jokes and openers ("that is the design",
  "Then there is", the same running gag). Give each recurring gag one owner chapter.
- Auditors find real errors where docs and code disagree; the narration follows the docs.
  Three audits found 109, 63 and 42 issues (18, 7 and 4 blockers). Fixers must reopen the
  code for every factual change and grep all chapters for repeats of a fixed claim, or
  corrections fail to propagate.
- The repository under explanation moves during production (new commits, CLAUDE.md gate
  changes, new ADRs): verify against the current HEAD at every pass and record it.
- Never put a real person's name or email on screen; config files (for example a Bicep
  parameter file) can carry one.
- Fixers wrote "I D" for subtitle correctness of speech; subtitles must keep "ID" and SSML
  handles pronunciation.

## SSML and Azure TTS

- `<emphasis>` works only on en-US-GuyNeural, DavisNeural and JaneNeural, not on the
  multilingual voices.
- `<prosody>` may not contain `<break>` or `<emphasis>`. Wrapping the whole scene in a
  base-rate prosody is invalid: flatten the markup into runs, each wrapped in its prosody
  stack, with breaks and emphasis between runs.
- Word-boundary text is unreliable: multilingual voices put the rest of the sentence into
  punctuation events, and `<sub alias>` reports the alias words plus a markup fragment
  (`">identifier nextword`). Align events to the planned spoken words by sequence and keep only
  their timings; emit tokens equal to the subtitle words.
- Keep `text` as the subtitle truth and validate that the SSML's visible text equals it.

## Images

- Azure FLUX: models deploy on an AIServices account (Black Forest Labs format). The BFL
  route is `https://<resource>.cognitiveservices.azure.com/providers/blackforestlabs/v1/flux-2-pro?api-version=preview`
  (the documented `api.cognitive.microsoft.com` host does not resolve for custom-domain
  resources), and the body's `model` must be the deployment name.
- GlobalStandard FLUX quota may already be consumed by other resources in the
  subscription; DataZoneStandard had separate quota.
- FLUX miscounts objects ("eight hats", "seven locks", "three layers"); state the count
  twice and say "one column, no more", then check every count-bearing image.
- Ask for no text in images; put labels on top in Remotion.

## Diagrams

- The repository's diagrams are white-background PNGs. Recolour the source SVG (from the
  diagram's HTML) onto the theme, never with a CSS filter: lift the Azure icons out first
  and put them back byte for byte (icon terms forbid altering them).
- Dark recolouring alone leaves faint lines: raise stroke alpha to at least 3:1 against the
  canvas, thicken strokes 1.6x, lift secondary text colours.
- Diagram labels are 7 to 12 viewBox units: a whole-diagram view is illegible. Enforce a
  minimum on-screen label size (16 px) in the layout test, allow only a short overview, and
  zoom by node with a label-safe frame search (no label cut by the viewport edge).
- Loading SVG text asynchronously races the layout audit (it measures an empty diagram);
  inline the SVGs as a generated module.
- C4 semantics: label elements `[Type: technology]`, relationships with intent and
  protocol, titles and keys; shared libraries are not containers. Narration must call a
  container diagram a container diagram, not "code-level".

## Remotion and layout testing

- Template is on Remotion 4.0.507; the installed agent skills target 4.0.533
  (`Interactive`, `CanvasImage`): upgrade first with `npx remotion upgrade --version`.
- `premountFor` on `<Sequence>` is not allowed with `layout="none"`.
- An `<Audit>` around a full-frame backdrop always fails the margin rule: keep backdrops
  outside audited boxes.
- The layout test must be proven to fail (a fixture that breaks every rule) before its
  clean result means anything.
- The audit overlay must measure in the same commit as the content; anything set in a
  child's state after layout is invisible to it.

## Design (Impeccable)

- The impeccable engine downloads on first use (GitHub releases); set `IMPECCABLE_HOME` to a
  writable path in the sandbox.
- Static `detect` on TSX catches only literal styles; most kit styles are template
  strings, so apply the craft floor by reading it, then detect.
- Craft-floor changes applied: no side-stripe borders above 1px, no eyebrows above
  headings, no decorative window dots, mono only for code and data, muted ink raised to
  4.5:1, one focal motion per beat.

## Azure resources

- Use a dedicated, uniquely named resource group for temporary resources so another agent's
  work in a shared group cannot clash; record names in AZURE-RESOURCES.md; delete then
  purge Cognitive Services accounts (soft delete keeps the name).

## Scene building (from the five parallel builders)

- Parallel builders must not edit shared files: give each chapter its own registry
  (`src/scenes/chNN/index.ts`, keyed by scene id) and make the scene id the component key
  in scenes.json, with a placeholder for unbuilt scenes.
- Shared kit fixes made by one builder change every chapter: after all builders finish,
  re-run typecheck and the full layout test on every chapter (one builder saw a type error
  in another chapter caused by a kit change).
- `<Sequence premountFor>` mounts the next shot early at opacity 0; the layout audit must
  skip premounted, hidden subtrees or it reports false overlaps.
- A `Window` body 2px wider than its border tripped `clipped-text`: the clip check is
  sensitive to off-by-border sizing, which is the point.
- `frameNodes` cannot frame very tall nodes at 16px label size; a legible-frame helper
  that trades whole-node framing for label legibility was needed (a per-chapter legible-frame helper).
- `at('word')` matches the first occurrence: common words ("nothing", "the") key to the
  wrong moment. Use phrases or the occurrence argument, and check every key resolves.
- Builders render many review stills: a single-bundle still renderer (`tools/stills.mjs`)
  is far faster than `npx remotion still` per frame.
- There is no official Azure icon for Azure Managed Redis; the Cache for Redis icon may only
  represent Cache for Redis, so the Managed Redis shot uses no icon.
- Mock cards, terminals and REPL output must be labelled "illustrative" on screen.

## Layout linter hardening (after the user found overflow in review stills)

- Measuring element boxes misses text that spills out of its own box (nowrap tags, overflow
  visible). Measure real text ink with Range.getClientRects on every text node, use the ink
  for margin and band checks, and flag horizontal spill (`text-overflow`). Vertical glyph
  boxes are taller than a tight line box by design, so vertical spill is not a finding.
- Text outside every audited box can still leave the frame: scan all text nodes in the page
  (`unaudited-overflow`), excluding the subtitles and the overlay (`data-audit-ignore`).
- Centring must be judged on the whole composition (the union of everything on screen; a
  whole-diagram view by its drawing's ink), not per element: two-column layouts are
  deliberate. Whole-diagram views must centre on the drawing's content bounds, not on a
  viewBox that has an empty margin on one side.
- Build-ups that reveal left to right sit off-centre in early frames: put the full frame of
  the composition on screen from the start and light parts as they are spoken.
- The audit registry keyed by element id silently dropped every element that shared an id
  (every `CodeFile` defaulted to `code`), hiding a 354px overflow. Key by a unique React id
  and fail duplicate ids (`duplicate-id`).
- Estimated SVG label boxes ran about 1.4 viewBox units short in height; measure real glyph
  boxes once in headless Chrome or bias the estimate (top at y - 1.0 em, height 1.35 em).
- Slams scale in from 115 percent: place them so the scaled box still clears the margin.
- Every new rule gets a fixture element that breaks it, and the fixture run must show the
  rule failing before a clean run is trusted.

## C4 and the repository

- A C4 linter that rebuilds the model from renderer markup fails every hand-drawn figure on
  provenance (T1). Either regenerate from specs (which changes ids and layout) or add the
  semantic markup to the hand-drawn SVG; the second keeps node ids stable for the video.
- Non-C4 supplementary views need an explicit "not a C4 diagram" mode in the linter, reported
  as skipped, never as passed.
- `NOT_A_CONTAINER` style rules must read the element's own name and type, not its technology
  list: "Python 3.12, azure-eventhub SDK" does not make a container a library.
- `adg edit --criteria` appends; pass all drivers in one multi-line value, and check for
  duplicates. New Markdown files fail the doc-links hook until they are staged.
- Merging to the repository: separate worktree and branch (other agents share the checkout),
  ADR for a convention that constrains future work, hooks on commit and pre-push, PR from the
  template, wait for every required check, rebase merge only (no squash).

## Review stills

- One still per scene is chosen by sweeping each chapter with the audit overlay
  (`renderFrames` with `everyNthFrame`, cheap JPEGs, audit reports from the browser log) and
  picking the settled frame with the most components and no issues, latest on a tie; the
  chosen frames are then rendered clean.

## Arrows, columns and named boxes (from the user's still review)

- Arrows drawn from a fixed x float off tags of different widths, cut through their own
  tag's text, and pile their heads into one point. Rules: `arrow-detached` (both ends
  within 14px of an audited box), `arrow-through-text` (line or label over text ink),
  `arrow-pileup` (heads at least 10px apart). The Arrow exposes its real endpoints as
  `data-arrow` so the audit reads geometry, not intent. Compute arrow ends from the boxes
  they connect.
- Side-by-side columns must be top-aligned (`column-top`, 24px). Compare only the parts of
  two columns that share vertical span, so a header above both does not count, and do not
  exclude wide windows from column detection (a 1,100px code window beside a stack is
  still a column; only near-full-width content, 85 percent, is excluded).
- A diagram zoom can show a node box without its name (`unlabelled-node`): require the
  node's name text (`c4-name`, else its largest label) to be wholly in view. A type chip
  ("IN SCOPE") does not name a box. Boundaries are groups that contain other nodes; note
  `el.querySelector('g[id] > rect')` matches the element's own child, use
  `:scope g[id] > rect`.
- A rule that suddenly reports zero issues needs suspicion: two of the new rules passed
  everything on first run because of a selector bug and a too-generous exemption.
- An Azure icon may only represent its own product: no Cache for Redis icon on Azure
  Managed Redis (no official icon: use a plain name tile), and never draw over an icon to
  cross it out (strike the name instead).
- The stills exporter keyed audit reports by scene-relative frame, so scenes in one chapter
  overwrote each other; key by scene id and frame.

## Final render

- Fonts loaded from a CDN at render time (`@remotion/google-fonts`) can time the render out
  after 30 s when the CDN is unreachable. The template self-hosts every face from
  `@fontsource` packages (the bundler serves the woff2 files locally) and loads only the
  active preset's faces. `@remotion/fonts` must match the installed `remotion` version
  exactly, or `fetchFontData is not a function` is thrown at load.
- Load every weight the scenes use. A loader that fetches 400 and 600 only makes every 700
  a synthesised bold, and switching to the real face changes text widths: re-run the layout
  sweep and re-render every chapter after a font change.
- Scenes that compute `durationInFrames` from word times throw "durationInFrames must be
  positive" in a full render if they mount before the words file loads. The Chapter gates
  each scene on its word timings; a missing file resolves to `[]` so an unvoiced scene still
  renders (without that fallback the preset samples rendered blank). Stills do not surface
  this; a render of the first chapters does.
- Make the per-chapter render loop resumable (skip finished chapters). In zsh,
  `rm -f out/ch*.mp4` with no matches aborts an `&&` chain; use `find -delete`.
