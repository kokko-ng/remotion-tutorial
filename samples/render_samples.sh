#!/usr/bin/env bash
# Regenerate samples/<preset>.png and samples/<preset>-title.png.
#
# Builds a throwaway Remotion project from template/, swaps in the showcase
# scenes under samples/showcase/, and renders one title still and one content
# still per preset. Silent wav files stand in for the voiceover; the subtitle
# chunk files are checked in, so the subtitle treatment of each preset shows
# up in the sample.
#
# Usage: samples/render_samples.sh [preset ...]      (default: all four)
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$REPO/samples"
PRESETS=("$@")
if [ ${#PRESETS[@]} -eq 0 ]; then
  PRESETS=(chalkboard paper terminal print)
fi

# Frames of the ch01 composition to capture. s01 is 5.5s (165 frames), so
# frame 75 lands mid title card and frame 365 lands 200 frames into the
# showcase scene, after every element has finished entering.
TITLE_FRAME=75
SCENE_FRAME=365

WORK="$(mktemp -d "${TMPDIR:-/tmp}/remotion-samples.XXXXXX")"
trap 'rm -rf "$WORK"' EXIT

rsync -a --exclude node_modules --exclude out "$REPO/template/" "$WORK/"
if [ -d "$REPO/template/node_modules" ]; then
  ln -s "$REPO/template/node_modules" "$WORK/node_modules"
else
  (cd "$WORK" && npm install)
fi

rm -f "$WORK/src/scenes/S01_Example.tsx"
cp "$REPO/samples/showcase/S01_Title.tsx" "$REPO/samples/showcase/S02_Showcase.tsx" "$WORK/src/scenes/"
cp "$REPO/samples/showcase/index.ts" "$WORK/src/scenes/index.ts"

mkdir -p "$WORK/public/audio"
cp "$REPO/samples/showcase/s01.chunks.json" "$REPO/samples/showcase/s02.chunks.json" "$WORK/public/audio/"
ffmpeg -y -loglevel error -f lavfi -i anullsrc=r=44100:cl=mono -t 5 "$WORK/public/audio/s01.wav"
ffmpeg -y -loglevel error -f lavfi -i anullsrc=r=44100:cl=mono -t 10 "$WORK/public/audio/s02.wav"

for preset in "${PRESETS[@]}"; do
  cat > "$WORK/scenes.json" <<EOF
{
  "fps": 30,
  "width": 1920,
  "height": 1080,
  "preset": "$preset",
  "title": "Preset sample",
  "chapters": [{"id": "ch01", "title": "Preset sample"}],
  "scenes": [
    {"id": "s01", "chapter": "ch01", "component": "S01_Title", "durationSec": 5, "padOutSec": 0.5},
    {"id": "s02", "chapter": "ch01", "component": "S02_Showcase", "durationSec": 10, "padOutSec": 0.5}
  ]
}
EOF
  (cd "$WORK" && npx remotion still src/index.ts ch01 "out/$preset-title.full.png" "--frame=$TITLE_FRAME")
  (cd "$WORK" && npx remotion still src/index.ts ch01 "out/$preset.full.png" "--frame=$SCENE_FRAME")
  # Ship 1280x720: readable in a README, a fraction of the bytes.
  ffmpeg -y -loglevel error -i "$WORK/out/$preset-title.full.png" -vf scale=1280:720 "$OUT/$preset-title.png"
  ffmpeg -y -loglevel error -i "$WORK/out/$preset.full.png" -vf scale=1280:720 "$OUT/$preset.png"
  echo "rendered $preset"
done
