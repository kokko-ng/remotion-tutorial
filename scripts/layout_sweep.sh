#!/bin/sh
# Automated layout sweep: renders the LayoutCheck composition for each chapter
# (every scene sampled every 2 s plus its last frame, layout audit on) and
# reports every finding the audit logs: text overflowing a [data-fit] box,
# text too close to a bordered edge, blocks overlapping or closer than
# RULES.minGap, anything outside the safe area or in the subtitle band, and
# every wordFrame cue that was not found in the narration.
#
# Usage: scripts/layout_sweep.sh videos/<slug> [ch01 ch02 ...]
# Exit: 0 clean, 1 findings, 2 a render failed (never treated as clean).
PROJECT=${1:?usage: layout_sweep.sh <project> [chapters...]}
shift
cd "$PROJECT" || exit 2
# dev chapters ("dev": true: the layout fixture, previews) run only when named
CHS=${*:-$(python3 -c "import json;print(' '.join(c['id'] for c in json.load(open('scenes.json'))['chapters'] if not c.get('dev')))")}
OUT=${TMPDIR:-/tmp}/layout-sweep-$(basename "$PWD"); mkdir -p "$OUT"
EVERY=${SWEEP_EVERY_SEC:-2}
status=0
for ch in $CHS; do
  npx remotion render src/index.ts LayoutCheck "$OUT/$ch.mp4" \
    --props="{\"chapterId\":\"$ch\",\"everySec\":$EVERY}" \
    --scale=0.5 --muted --log=verbose > "$OUT/$ch.log" 2>&1
  if [ $? -ne 0 ]; then
    status=2
    echo "$ch: RENDER FAILED (see $OUT/$ch.log)"
    grep -m3 -i "error" "$OUT/$ch.log" | sed 's/^/  /'
    continue
  fi
  hits=$( (grep -o '\[layout\] [^ ]* f[0-9]* [^ "]*' "$OUT/$ch.log"; \
           grep -o 'wordFrame: "[^"]*" (occurrence [0-9]*) not found' "$OUT/$ch.log") | sort -u)
  if [ -n "$hits" ]; then
    [ $status -eq 0 ] && status=1
    echo "$ch: $(echo "$hits" | wc -l | tr -d ' ') findings"
    echo "$hits" | sed 's/^/  /'
  else
    echo "$ch: clean"
  fi
done
exit $status
