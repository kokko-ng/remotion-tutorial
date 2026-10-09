# SSML authoring spec

Each scene gets an `ssml` field: the scene's narration as the inner content of a `<voice>`
element (no `<speak>` or `<voice>` wrapper; the generator adds those, plus the global
pacing). `text` stays the subtitle source of truth. `scripts/validate_ssml.py` fails a scene
whose SSML does not speak exactly its `text`: strip every tag (keep the inner text of `sub`,
`say-as`, `emphasis`, `prosody`), drop `[beat]` from `text`, normalise whitespace, compare.
Never add, drop, or reorder a word.

## Global (added by the generator, do not repeat)

- Base rate: `<prosody rate="<RATE>">` around each run (from narration.json `rate`; tune
  after the A/B sample).
- `<mstts:silence type="Sentenceboundary-exact" value="<SENTENCE GAP>"/>` (narration.json
  `sentenceGap`): tight gaps between sentences, so the pace is set by the writing, not by
  default pauses.

## Elements you may use (Azure-supported, verified on Microsoft Learn)

| Element | Use it for | Rule |
|---|---|---|
| `<break time="300ms"/>` | the `[beat]` after a punchline | One per `[beat]` marker, at its position. 150 to 450 ms. Never anywhere else |
| `<prosody rate="+15%" pitch="-2st">...</prosody>` | a dry aside, a parenthetical, a throwaway clause | At most two per scene. Whole clauses only |
| `<prosody rate="-8%">...</prosody>` | the punchline itself, or a number that must land | At most two per scene. Usually the sentence before a `[beat]` |
| `<prosody pitch="+1st">...</prosody>` | mock surprise ("And yes, there is no A2.") | Rare: at most one per chapter |
| `<emphasis level="moderate">word</emphasis>` | one stressed word in a contrast ("the *model* never decides") | Only kept if the chosen voice supports it (Davis, Guy, Jane). At most three per scene |
| `<sub alias="my package">mypkg</sub>` | identifiers spoken differently from their spelling | Use the alias table below. Inner text must equal the subtitle word |
| `<say-as interpret-as="characters">ARM</say-as>` | acronyms the engine would read as a word | Only where a word reading is wrong (ARM, AMQP, RBAC, OIDC, SKU, CLI, TLS, UTC, PTU) |

Do not use `audio`, `bookmark`, `lexicon`, `mstts:express-as`, `p`,
`s`, `phoneme`, or `voice`. Escape `&`, `<`, `>` in text as entities.

## Alias table (spoken form; subtitles keep the spelling)

| Written | Spoken |
|---|---|
| mypkg (your package name) | my package |
| MYPKG (an env var prefix) | my package |
| uvicorn | you vee corn |
| uv | you vee |
| DuckDB | duck D B |
| NGINX | engine X |
| Traefik | traffic |
| mypy, Mypy | my pie |
| deptry | dep tree |
| adg | A D G |
| MADR | mad R |
| KEDA | keh da |
| B2s | B two S |
| B0 | B zero |
| D2as | D two A S |
| v5 | V five |
| D4ads | D four A D S |
| zizmor | zizz more |
| Pydantic | pie dantic |
| FastAPI | fast A P I |
| Vite | veet |
| Cilium | silly um |
| kubectl | kube control |
| C4 | C four |
| dedupe | dee dupe |
| NoSQL | no sequel |
| kubelet | cube let |
| Vue | view |
| cert-manager | cert manager |
| deduping | dee duping |
| ADR | A D R |
| SKUs | S K Us |

Add a row here when you meet another identifier, and use it everywhere.

## Delivery character

Deadpan, fast, precise. The voice is a tired senior engineer, so sarcasm lands through
timing (a slower punchline after a quick setup, then a beat), not through pitch theatrics.
Lists of real names stay at base rate so each name is audible. Numbers from config are never
sped up.
