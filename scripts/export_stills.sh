#!/bin/sh
# One still per scene at its fullest moment, for a visual audit before render.
# 1) Sweep each chapter every 1 s with the layout audit, which logs a density
#    score (text runs + images + audited blocks) per sampled frame.
# 2) For each scene pick the densest frame (latest on ties) and render it at
#    full resolution, without debug overlays, to stills/chNN/chNNsMM.png.
# Usage: scripts/export_stills.sh videos/<slug> [ch01 ch02 ...]
PROJECT=${1:?usage: export_stills.sh <project> [chapters...]}
shift
cd "$PROJECT" || exit 2
CHS=${*:-$(python3 -c "import json;print(' '.join(c['id'] for c in json.load(open('scenes.json'))['chapters']))")}
OUT=${TMPDIR:-/tmp}/stills-$(basename "$PWD"); mkdir -p "$OUT" stills
for ch in $CHS; do
  npx remotion render src/index.ts LayoutCheck "$OUT/$ch.mp4" --props="{\"chapterId\":\"$ch\",\"everySec\":1}" \
    --scale=0.25 --muted --log=verbose --concurrency=6 > "$OUT/$ch.log" 2>&1 || { echo "$ch: sweep render failed"; continue; }
  python3 - "$ch" "$OUT/$ch.log" <<'PY'
import json, math, re, subprocess, sys
from pathlib import Path
ch, log = sys.argv[1], sys.argv[2]
best = {}
for sid, f, d in re.findall(r"\[density\] (\S+) f(\d+) (\d+)", Path(log).read_text()):
    if ":" in sid: continue
    f, d = int(f), int(d)
    if sid not in best or (d, f) > best[sid]: best[sid] = (d, f)
m = json.loads(Path("scenes.json").read_text())
off = 0
Path(f"stills/{ch}").mkdir(parents=True, exist_ok=True)
for s in m["scenes"]:
    if s["chapter"] != ch: continue
    n = math.ceil((s["durationSec"] + s["padOutSec"]) * m["fps"])
    d, f = best.get(s["id"], (0, n - 1))
    out = f"stills/{ch}/{s['id']}.png"
    subprocess.run(["npx", "remotion", "still", "src/index.ts", ch, out, f"--frame={off + f}", "--log=error"],
                   check=True, capture_output=True)
    print(f"  {out}  (scene frame {f}, {f/m['fps']:.1f}s, density {d})")
    off += n
PY
done
