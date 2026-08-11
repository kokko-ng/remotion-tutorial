#!/usr/bin/env bash
# Concatenate per-chapter renders losslessly into final.mp4.
# Usage: concat_chapters.sh <project-dir>
set -euo pipefail

PROJECT="${1:?usage: concat_chapters.sh <project-dir>}"
OUT="$PROJECT/out"

cd "$OUT"
ls ch*.mp4 >/dev/null 2>&1 || { echo "no ch*.mp4 files in $OUT" >&2; exit 1; }

: > list.txt
for f in $(ls ch*.mp4 | sort); do
  echo "file '$f'" >> list.txt
done

ffmpeg -y -f concat -safe 0 -i list.txt -c copy final.mp4
echo "wrote $OUT/final.mp4"
ffprobe -v error -show_entries format=duration -of csv=p=0 final.mp4
