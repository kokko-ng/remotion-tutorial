#!/usr/bin/env python3
"""Render review stills for the aesthetic review loop.

For each scene, renders stills at fixed percentages of the scene's duration
(default 15/40/65/90) by mapping scene-relative positions to absolute frames
of the scene's chapter composition, then invoking `npx remotion still`.

Pass 2 of the review shifts the sample points with --shift 5 so a different
animation state is inspected. --debug renders one extra still per scene with
the LayoutAudit overlay enabled (red outlines on overlaps/margin violations).

Usage:
    python3 review_stills.py --project videos/my-video
    python3 review_stills.py --project videos/my-video --scenes s02 --shift 5
    python3 review_stills.py --project videos/my-video --debug
"""
import argparse
import json
import math
import subprocess
import sys
from pathlib import Path

DEFAULT_PERCENTS = [15, 40, 65, 90]


def scene_frames(scene, fps):
    return math.ceil((scene.get("durationSec", 0) + scene.get("padOutSec", 0.5)) * fps)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", required=True)
    ap.add_argument("--scenes", default=None, help="comma-separated scene ids (default: all)")
    ap.add_argument("--percents", default=None, help="comma-separated, e.g. 20,45,70,95")
    ap.add_argument("--shift", type=float, default=0, help="shift all sample points by this many percent")
    ap.add_argument("--debug", action="store_true", help="also render a LayoutAudit overlay still per scene")
    ap.add_argument("--out", default="out/review")
    args = ap.parse_args()

    project = Path(args.project)
    manifest = json.loads((project / "scenes.json").read_text())
    fps = manifest["fps"]
    wanted = set(args.scenes.split(",")) if args.scenes else None
    percents = [float(p) for p in args.percents.split(",")] if args.percents else DEFAULT_PERCENTS
    percents = [min(99.0, p + args.shift) for p in percents]

    out_dir = project / args.out
    out_dir.mkdir(parents=True, exist_ok=True)

    offsets = {}  # scene id -> (chapter comp, base frame within chapter)
    per_chapter = {}
    for scene in manifest["scenes"]:
        ch = scene["chapter"]
        offsets[scene["id"]] = (ch, per_chapter.get(ch, 0))
        per_chapter[ch] = per_chapter.get(ch, 0) + scene_frames(scene, fps)

    failures = []
    for scene in manifest["scenes"]:
        sid = scene["id"]
        if wanted and sid not in wanted:
            continue
        if scene.get("durationSec", 0) <= 0:
            sys.exit(f"scene {sid} has no durationSec; run generate_voiceover.py first")
        comp, base = offsets[sid]
        total = scene_frames(scene, fps)
        jobs = [(f"{sid}-p{int(p):02d}.png", base + min(total - 1, int(round(p / 100 * total))), False)
                for p in percents]
        if args.debug:
            jobs.append((f"{sid}-debug.png", base + total // 2, True))
        for name, frame, debug in jobs:
            cmd = ["npx", "remotion", "still", "src/index.ts", comp,
                   str((out_dir / name).resolve()), f"--frame={frame}"]
            if debug:
                cmd.append('--props={"debugLayout":true}')
            res = subprocess.run(cmd, cwd=project, capture_output=True, text=True)
            if res.returncode != 0:
                failures.append((name, res.stderr[-800:]))
                print(f"  FAIL {name}")
            else:
                print(f"  {name} (frame {frame} of {comp})")

    if failures:
        for name, err in failures:
            print(f"\n--- {name} ---\n{err}", file=sys.stderr)
        sys.exit(1)
    print(f"stills in {out_dir}")


if __name__ == "__main__":
    main()
