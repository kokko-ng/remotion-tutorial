# Fix brief (applies after each audit pass)

You apply one audit pass's findings to the chapters you are assigned.

1. Read `script/audits/pass-N.md` (N in your task) and select the findings for your chapters.
2. For every finding, verify it against the repository at <REPO_PATH>
   (read-only, never open local-only reference folders) before acting. The repository is the authority, not the
   auditor. The repository changes while this video is produced: check the current file, not
   your memory (for example CLAUDE.md quality gates and ADR count may have moved).
   - Real problem: apply the fix (the auditor's text or a better one).
   - Auditor wrong: do not apply; record why with file:line evidence.
3. Keep every scene within plus or minus 8 percent of its `targetWords` and each chapter within
   plus or minus 4 percent. If a fix adds words, cut elsewhere in the same scene.
4. Before rewriting any line, invoke the Skill tool with `anthropic-skills:humanizer` and write every changed sentence to its rules. Keep STYLE.md: Fireship voice, humanizer hard rules (no em/en dashes, banned words, curly
   quotes), subtitle-friendly sentences, [beat] markers, through-line once per chapter,
   recap last. A cut joke that carried a wrong fact is replaced by a joke that carries a
   right one.
5. Update `sources`, `inferred`, and `visual` when a fix changes them. On-screen material must
   never show a real person's name or email address (crop config lines that hold one).
6. Write chapter files back with the Write tool (JSON must stay valid). Write your log to
   your own file `script/audits/pass-N-fixes-<chapters>.md` (so fixers never clobber each
   other), a section per chapter: finding id, applied or rejected, one line why.
7. Final checks: valid JSON, word counts, greps for dashes, curly quotes, banned words.
   Report briefly: applied, rejected (with ids), word counts.

## Additional rules from pass 2 onward

8. For every factual finding, open the repository file at the cited lines with the Read
   tool or `sed -n` before changing the text. A fix applied without reading the code is a
   defect. Log the file:line you read next to each finding.
9. Consistency across chapters: after fixing a claim, grep every chapter file for the
   same claim (key nouns and numbers). Fix every occurrence inside your own chapters, and
   list occurrences in other chapters in your log under "cross-chapter" so the coordinator
   can confirm the other fixer caught them.
10. Visual line ranges: when a `visual` cites `path:lines`, re-check the lines against the
    current file (the repository moves) and correct the range.

## Coordination section (the coordinator writes one per pass)

Before dispatching fixers for a pass, the coordinator decides what no single fixer can see
and appends it here, for example:

- One name per concept across all chapters (for example the model service's name).
- Each recurring gag or stock opener has one owner chapter; every other chapter rewrites its
  copy.
- Spoken forms that subtitles must keep spelled (IDs, flow labels) are left to the SSML.
- Chapters over budget and by how many words.
