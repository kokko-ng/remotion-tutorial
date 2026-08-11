# Humanizer rules for narration and on-screen text

Condensed from the humanizer skill (based on Wikipedia's "Signs of AI
writing"). Apply to every word the viewer hears or reads: narration, titles,
headings, callouts, node labels. Run this pass after drafting and before TTS;
regenerating audio to fix a robotic sentence is cheap, shipping one is not.

## Hard rules (grep for these)

- No em dashes or en dashes anywhere. Replace with a period, comma, colon,
  or parentheses. `grep -n "—\|–" narration.json` must return nothing.
- No emojis. Ever. Including on-screen labels.
- Banned vocabulary (each is a strong tell): delve, pivotal, crucial, vital,
  testament, tapestry, landscape (abstract), vibrant, showcase, underscore
  (verb), highlight (verb, when avoidable), foster, garner, intricate,
  enduring, seamless, robust (figurative), journey (figurative), unlock
  (figurative), elevate, leverage (verb).
- No "not just X, but Y" or "it's not only... it's..." constructions.
- No "serves as" / "stands as" / "acts as" where "is" works.
- No -ing tack-ons that fake depth ("...showcasing the power of...",
  "...highlighting the importance of...").
- No title case in headings. "The curve detector", not "The Curve Detector".
- Straight quotes, not curly.

## Cadence rules (read a paragraph aloud in your head)

- Vary sentence length. If three consecutive sentences are within a few words
  of the same length, rewrite one.
- No rule-of-three padding. Enumerate three things only when the content
  genuinely has three named things (a recall of three taught concepts is
  fine; "innovation, inspiration, and insights" is not).
- At most one short punchy fragment in a row. A run of clipped fragments
  ("No priors. No nostalgia. The old rules were gone.") is manufactured
  drama; cut it.
- No aphorism formulas ("X is the language of Y", "X becomes a trap").
  Replace with the concrete claim.
- No fake-candid openers ("Honestly?", "Here's the thing"). Just say the
  thing.
- No announcements ("let's dive in", "here's what you need to know"). Start
  with the content.
- No generic upbeat endings ("exciting times lie ahead"). End with a plain
  recap and at most one genuine closing sentence.
- No classroom gimmicks, spoken or on screen: "say it out loud", "close your
  eyes", "your turn", quiz-style question marks on recap boxes. Recaps state
  the terms plainly.

## What good sounds like

Simple copulas, concrete details, purposes before definitions, occasional
mixed feelings, and rhythm that breathes. From a shipped script: "By default
they are strangers. Peering builds a private bridge between them, so traffic
crosses without ever touching the public internet." Nothing fancy; it just
says the thing in a human order.
