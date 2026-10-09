# Narration audit brief

You audit the narration of a <DURATION> architecture video about the repository at
`<REPO_PATH>` (<PRODUCT NAME>). You are one of three sequential auditors. Earlier passes may have fixed things;
judge the current text only.

## Inputs

- `script/ch01.json` to `script/chNN.json` (under `<VIDEO_PROJECT>/`).
  Each scene has `text` (the narration, which is also the subtitles), `visual`, `sources`,
  `inferred`, `sec`, `targetWords`.
- `script/STYLE.md`: the style and grounding rules. `outline.md`: the plan.
- Earlier audit reports in `script/audits/` (read them so you do not re-report fixed items,
  but re-check that each claimed fix actually landed).

## What to check, in priority order

1. **Factual accuracy.** Every technical claim, number, name, SKU, default, file name, and
   described behaviour must match the repository (code, config, Bicep, workflows, docs, ADRs).
   Open the cited sources and verify. Also check claims whose source is missing or wrong.
   Where docs and code disagree, the code wins and the narration should not state the doc
   version. A joke that bends a fact is a factual error.
2. **Rationale honesty.** A reason that no document gives must be spoken as inference and
   listed in `inferred`. A reason given only as "the product owner decided" must not be
   dressed up as a technical reason.
3. **Content rules.** Nothing from the repository's local-only or ignored reference
   folders (do not open them). Apply every naming rule the repository's own CLAUDE.md or
   AGENTS.md sets (for example which products, customers or examples may be named). <ADD
   THE PROJECT'S CONTENT RULES HERE>. The client or owner of the reference deployment must not be named or guessed.
   No real people's names (fictional names from the repository's synthetic fixtures are allowed if labelled).
   No Fireship branding or catchphrases, no other creator named.
4. **Humanizer rules.** First invoke the Skill tool with `anthropic-skills:humanizer` and apply its full pattern list and its "what NOT to flag" guidance. Also check the STYLE.md hard rules (dashes, banned vocabulary, curly quotes,
   "not just X but Y", "serves as", -ing tack-ons, rule-of-three padding, runs of fragments,
   aphorism formulas, fake-candid openers, announcements, generic upbeat endings,
   classroom gimmicks) plus any cluster of AI tells.
5. **Style and pacing.** Fireship-like: cold-open hook in the first sentence of each chapter,
   dense, dry, sarcastic, jokes landing on a real technical point. Flag flat or padded
   passages, repeated jokes across chapters, and the same phrase reused too often. Each
   chapter must stand alone (no unexplained term from another chapter) and end with a plain
   recap. Sentences must work as subtitles (no lists, no very long comma-free clauses).
   Words that TTS will likely mispronounce or read oddly (symbols, paths, acronyms) are
   findings with a spoken-form fix.
6. **Budget.** Scene word count within plus or minus 8 percent of `targetWords`, chapter
   within plus or minus 4 percent. Report outliers only.

## Output

Write `script/audits/pass-N.md` (N given in your task). For each finding:

```
### <id> [severity: blocker|major|minor] <chapter>/<scene>
Problem: one or two sentences, quoting the text.
Evidence: file:line from the repository (for factual findings).
Fix: the exact replacement text, or a precise instruction.
```

Blockers are factual errors and content-rule breaches. End with a short summary: counts by
severity, and the three most important fixes. Do not edit the chapter files yourself.
Do not touch Azure. Do not edit the repository.
