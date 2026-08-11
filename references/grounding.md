# Grounding and licensing

Tutorial videos state facts with a confident narrator voice, which makes an
ungrounded claim worse than useless: it sounds authoritative. Every technical
claim in the narration or on screen must trace to an official resource, and
every resource must be usable in a public educational video.

## Grounding rules

- Verify claims against the authoritative source for the topic: vendor
  documentation (Microsoft Learn for Azure, AWS docs, GCP docs), the original
  paper for research topics, the standard or RFC for protocols, the project's
  own documentation for open source.
- Prefer primary sources over blog posts and videos. A blog post may point
  you to the source; it is not the source.
- Record every source in a `sources.md` in the video project: claim or scene,
  source title, URL, date checked, license. This file ships with the project
  so claims can be re-verified later.
- Numbers age fast (limits, SKUs, pricing, defaults). Check them against the
  current docs at production time, and prefer phrasing that survives drift
  ("Cosmos DB partitions by a key you choose") over phrasing that will not
  ("the limit is 20 GB per partition") unless the number is the point.
- If a claim cannot be verified in an official source, cut it or say it is
  uncertain out loud. Never let the confident narrator voice carry a guess.

## Licensing rules

Two different questions, both mandatory:

1. **Facts and ideas** are not copyrightable. Explaining a concept in your
   own words with your own diagrams is always fine. All demo videos in this
   repo work this way.
2. **Expression is licensed.** Reproducing text, figures, diagrams, code
   listings, screenshots, logos, or characteristic visual identities requires
   checking the license:
   - Microsoft Learn documentation text: CC BY 4.0 (attribution required);
     most code samples in it are MIT. Attribution goes in the video
     description or an on-screen credit.
   - Wikipedia text: CC BY-SA 4.0 (attribution + share-alike; share-alike
     applies if you adapt the text itself).
   - arXiv papers: license varies per paper (check the abstract page); the
     ideas are fair game, the figures often are not.
   - Product logos and trademarks: do not reproduce them. Name the service in
     text instead (the demos render "Cosmos DB" as a labeled box, never the
     logo).
   - Never imitate another creator's characteristic assets (3Blue1Brown's pi
     creatures, Primer's blobs). The presets borrow palettes and pacing
     sensibilities, which is fine; borrowing mascots is not.
3. When the license does not clearly permit reuse in a publicly posted
   educational video, do not use the resource. Find one that does or make
   your own version from the underlying facts.

## Attribution mechanics

If any CC-licensed expression made it into the video, list attributions in
`sources.md` and tell the user to include them in the video description when
publishing. If nothing was reproduced verbatim, `sources.md` still documents
what grounded each chapter, and no on-screen attribution is required.
