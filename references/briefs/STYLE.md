# Narration style spec (all chapters)

## Voice

Fireship-style: dense, fast, dry, deadpan sarcasm. Short declarative sentences mixed with
the occasional longer one that carries a real mechanism. Jokes land on a real technical
point (the joke IS the trade-off, the failure mode, or the rejected alternative). Never a
joke that bends a fact. Second person is fine ("you"), the narrator is a slightly tired senior
engineer who respects the design and mocks the problems it solves.

Do not use Fireship's branding or catchphrases: no "in 100 seconds", no "hit like and
subscribe", no "thanks for watching and I will see you in the next one", no "it's go time",
no "this has been...", no mention of Fireship or any creator.

## Structure per chapter

Each chapter is a self-contained episode:
1. Cold open (first scene): a hook in the first sentence. A failure, a gag, a surprising
   fact. No meta intro ("in this chapter we will").
2. Beats (middle scenes): one visual idea per scene, three-beat rhythm per concept: what it
   is, why it exists (the problem it removes), a concrete hook. One analogy per hard idea.
3. Recap (last scene): plain one-sentence restatement of each key term, in the video's own
   vocabulary. No questions, no gimmicks. One closing sentence at most, may tee up the next
   episode.
Return to the through-line at least once per chapter: "<THROUGH-LINE SENTENCE>".

## Word budget

<WORDS PER SECOND> words per scene-second, measured on a synthesized sample in the chosen
voice and rate (Davis at +8 percent runs about 3.5). Each scene's `targetWords` =
round(sec * <WORDS PER SECOND>).
Stay within plus or minus 8 percent per scene, plus or minus 4 percent per chapter.

## Grounding (non-negotiable)

- Every technical claim must come from the repository: code, config, IaC, docs, ADRs. Open
  and read the files before writing the scene. Record them in the scene's `sources` as
  `path` or `path:line`.
- If you state a reason that no document gives, say so in the narration ("the docs don't
  say why; the likely reason is ...") and list it in `inferred`. Prefer cutting it.
- Where an ADR's only reason is that the product owner or repository owner decided, say that
  plainly (it can be the joke), then give the documented trade-offs.
- Numbers must match the source exactly (currency figures, seconds, tiers, SKUs).
- Never use anything from the repository's local-only or ignored reference folders. Apply
  the repository's own naming rules (<CONTENT RULES>). Never name or guess a client or a
  real person. Product name: "<PRODUCT NAME>", or "<SHORT NAME>".

## Writing for the ear and the screen

- The narration is also the subtitles. No lists, no markdown, no code blocks in the text.
- Speak code in words ("the formula sums points over the window"), the screen shows code.
- Speak file and module names naturally ("the gates file in the default config", "grounding dot
  py" only when the name is the point). Keep spoken paths short.
- Mention on-screen terms out loud so reveals can key to them.
- Numbers: write them as you want them spoken ("three hundred Australian dollars a month",
  "USD 300" is fine too; be consistent within a chapter). Write "Event Hubs", "Cosmos DB",
  "AKS", "Entra ID".
- `[beat]` marks a short pause after a punchline (250 ms unless the project sets `--beat`). Use sparingly (at most about one per 40
  seconds). It is stripped from subtitles.

## Humanizer hard rules (apply while drafting)

No em or en dashes. No emojis. Straight quotes. Banned words: delve, pivotal, crucial, vital,
testament, tapestry, landscape (abstract), vibrant, showcase, underscore (verb), highlight
(verb), foster, garner, intricate, enduring, seamless, robust (figurative), journey
(figurative), unlock (figurative), elevate, leverage (verb). No "not just X but Y". No
"serves as/stands as/acts as". No -ing tack-ons. No rule-of-three padding. At most one short
fragment in a row. No aphorism formulas. No "Honestly?", "Here's the thing", "Let's dive in",
"Buckle up". No generic upbeat ending. Vary sentence length.

## Output file format: `script/chNN.json`

```json
{
  "chapter": "ch01",
  "title": "The whole thing in nine minutes",
  "budgetSec": 540,
  "scenes": [
    {
      "id": "s01",
      "sec": 45,
      "targetWords": 122,
      "text": "Narration, plain prose, may contain [beat].",
      "visual": "Short shot list: what is on screen, callout texts, code snippet paths and line ranges, image ideas (AI-generated or stock), zoom targets on embedded diagrams.",
      "sources": ["docs/adr/0003-<decision>.md", "src/<package>/<module>.py:149"],
      "inferred": []
    }
  ]
}
```

Scene ids, seconds, and titles come from `outline.md`. Keep them.
