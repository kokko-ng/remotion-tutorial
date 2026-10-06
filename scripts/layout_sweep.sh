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
CHS=${*:-$(python3 -c "import json;print(' '.join(c['id'] for c in json.load(open('scenes.json'))['chapters']))")}
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
  # Scene-level empty-space rule: a scene whose content never reaches below
  # SWEEP_MIN_BOTTOM (default y=760, about two thirds down the frame) leaves
  # the lower third dead on every frame.
  voids=$(grep -o '\[density\] [^ ]* f[0-9]* [0-9]* b[0-9]*' "$OUT/$ch.log" | awk -v min="${SWEEP_MIN_BOTTOM:-760}" '{sub("b","",$5); if ($5+0 > m[$2]+0) m[$2]=$5} END {for (s in m) if (m[s] < min) print "[layout] " s " f0 void:content-ends-at-y" m[s]}')
  # Zone balance: whenever a zone holds the same content for 2 s or more, that
  # content must be centered in the zone interior (12 percent horizontally,
  # 15 percent vertically). Needs 1 s sampling (SWEEP_EVERY_SEC=1) to see 2 s states.
  zones=$(grep -o '\[zone\] [^ ]* f[0-9]* [^ ]* n[0-9]* dx[-0-9.]* dy[-0-9.]*' "$OUT/$ch.log" | python3 -c '
import sys, re, collections
runs = collections.defaultdict(list)
for l in sys.stdin:
    m = re.match(r"\[zone\] (\S+) f(\d+) (\S+) n(\d+) dx(\S+) dy(\S+)", l)
    if m: runs[(m.group(1), m.group(3))].append((int(m.group(2)), int(m.group(4)), float(m.group(5)), float(m.group(6))))
for (s, z), pts in sorted(runs.items()):
    streak = []
    for f, n, dx, dy in sorted(set(pts)) + [(10**9, -1, 0.0, 0.0)]:
        bad = abs(dx) > 0.12 or abs(dy) > 0.15
        if bad and streak and streak[-1][1] == n and f - streak[-1][0] <= 45:
            streak.append((f, n, dx, dy)); continue
        if len(streak) >= 2:
            f0, n0, dx0, dy0 = streak[0]
            print(f"[layout] {s} f{f0} zone-offcenter:{z}(n{n0},dx{dx0:+.2f},dy{dy0:+.2f})"); break
        streak = [(f, n, dx, dy)] if bad else []
')
  hits=$( (echo "$voids" | grep . ; echo "$zones" | grep . ; grep -o '\[layout\] [^ ]* f[0-9]* [^ "]*' "$OUT/$ch.log"; \
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
