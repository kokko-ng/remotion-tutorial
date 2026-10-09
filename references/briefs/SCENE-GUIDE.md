# Scene guide

How to build one scene component. Read `DESIGN.md` (visual rules, Impeccable craft floor)
and `PRODUCT.md` first. Every scene is one file `src/scenes/chNN/SNN_Name.tsx`, registered
in that chapter's `src/scenes/chNN/index.ts` under its scene id (`s20: S20_Poller`).
Do not edit `src/scenes/index.ts` or `scenes.json`; the scene id is already the component
key there, and unbuilt scenes render a placeholder.

## Inputs per scene

- `../script/chNN.json`: the scene's `text` (narration and subtitles), `visual` (shot list),
  `sources` (files to show), `sec`.
- `public/audio/sNN.words.json`: word timings. Key every reveal to a spoken word.
- Assets: `src/assets/diagrams.generated.ts` (dark repository diagrams with named node
  regions and label boxes), `public/icons/*.svg` (official Azure icons), `public/images/*.png`
  (FLUX illustrations; ids in `src/assets/images.ts`, gag notes in `../images/manifest.json`).

## Skeleton

```tsx
import React from 'react';
import {Sequence, useVideoConfig} from 'remotion';
import {SafeArea} from '../../components/layout/SafeArea';
import {useSceneWords} from '../../components/kit/words';
import type {SceneProps} from '../index';

export const S20_FeedPoller: React.FC<SceneProps> = ({sceneId}) => {
  const {fps} = useVideoConfig();
  const {at, end} = useSceneWords(sceneId, fps);
  return (
    <SafeArea>
      <Sequence name="Diagram" from={0} durationInFrames={at('cursor')} premountFor={fps}>
        {/* shot 1 */}
      </Sequence>
      <Sequence name="Code" from={at('cursor')} premountFor={fps}>
        {/* shot 2: a child's frame 0 is the Sequence start, so subtract the offset
            when you key a reveal inside it: at('publish') - at('cursor') */}
      </Sequence>
    </SafeArea>
  );
};
```

- Shots are `<Sequence>`s (hard cuts) with `premountFor={fps}` and a `name`. A scene has 2 to
  6 shots; a cut lands on a spoken word.
- `at('phrase', n, offset)` gives the scene-relative frame of a word or phrase. Never
  hard-code a frame for a reveal.
- Something is on screen within the first 30 frames of every scene.

## Kit (`src/components/kit/`)

| Component | Use |
|---|---|
| `DiagramShot` | a repository diagram on the dark background. Props: `name` (a key of `diagrams` in `src/assets/diagrams.generated.ts`), `source` (repository path of the HTML source), `focus` (`{at, rect}` camera snaps), `marks` (`{at, until, rect, label}`). Build every focus rect with `frameNodes(name, [nodeIdOrTitle, ...], pad)` from `kit/frames.ts`, which frames whole nodes without slicing labels. The camera snap is the scene's focal motion |
| `CodeFile` | a real file excerpt. `path`, `lines` (copied from the repository, exactly), `firstLine` (real line number), `marks` (`{from, to, at}` highlight rows). At most 12 lines; font 26 |
| `Terminal` | a shell session. `lines`: `{at, cmd}` or `{at, out, tone}`. Commands must be real commands from the repository docs, outputs real or clearly illustrative |
| `Window` | the frame the above use; use directly only for custom content |
| `Slam` | one punchline per beat. Prose: sans; `mono` only for literal values |
| `Tag`, `Stamp` | small labels; `Stamp` (tilted) only for refusals and verdicts |
| `Note` | one or two sentences of body text |
| `AdrCard` | a decision: `adr`, `question`, `options` (`{text, at, chosen}`), `verdictAt`, `why`, `whyAt`. The `why` must be the record's own reason |
| `AzureIcon` | an official icon with its full service name; uniform scale only |
| `ImageCut` | a FLUX illustration in a window; its credit shows in the title bar automatically |
| `Recap` | the recap scene: `rows` of `{term, def, at}` |
| `EpisodeSting` | end of each chapter's cold open (first scene): `ep`, `title`, `at` |
| template `Node`, `Group`, `Arrow` | simple custom diagrams when no repository diagram fits |

## Diagram legibility (tested)

- The layout test fails a settled diagram frame whose smallest label in view is under 16px
  (`illegible-text`) or where the viewport slices a label (`cropped-label`).
- A whole-diagram view is allowed only as an establishing shot of at most 45 frames before
  the first zoom. After that, every moment is a `frameNodes` zoom on 1 to 3 nodes.
- List a diagram's nodes: `grep -o '"[a-z-]*-n-[a-z-]*"\|"title": "[^"]*"'` on the generated
  module, or read `diagrams[name].regions` in code.
- Keep diagram shots on screen while the narration talks about them; cut away (code,
  terminal, image gag) when it moves on.

## Layout

- SafeArea coordinates: x 0 to 1728, y 0 to 972. Content must end above y = 820 (the
  subtitle band). Leave at least 16px between audited components.
- Grid: 12 columns of 128px with 16px gutters (column n starts at x = n * 144).
  Common splits: full width 1728; halves 856 + 16 + 856; thirds 565.
- Every element that must not overlap another is an `<Audit>` (the kit components already
  are). Never wrap arrows.
- Repository text on screen (code, config, paths) is copied verbatim from the current
  repository. Never show a real person's name or email address (deployment parameter
  files and CODEOWNERS often hold one); crop around it.

## Checks before you hand a chapter back

```bash
npx tsc --noEmit
SWEEP_EVERY_SEC=1 <SKILL_DIR>/scripts/layout_sweep.sh . chNN   # exit 0 (no [layout] findings) required
npx remotion still src/index.ts chNN out/chNN-check.png --frame=<f>   # look at 3 or more frames
```

Then run the Impeccable detector over the scenes you wrote:
`~/.claude/plugins/marketplaces/impeccable/skill/scripts/impeccable detect --json src/scenes`
(set `IMPECCABLE_HOME` to a writable path inside a sandbox). Zero findings required, or a
written reason per finding.
