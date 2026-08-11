#!/usr/bin/env python3
"""Build subtitle phrase chunks and an .srt file from Azure word timings.

Reads <project>/scenes.json and <project>/public/audio/<sceneId>.words.json,
groups words into readable phrases, and writes:

    <project>/public/audio/<sceneId>.chunks.json   scene-relative phrase timings,
                                                   consumed by the Subtitles component
    <project>/out/final.srt                        absolute timings across the full video

Absolute times mirror the Remotion timeline exactly: each scene occupies
ceil((durationSec + padOutSec) * fps) frames, and scene offsets accumulate in
frame units before converting back to milliseconds.

Usage:
    python3 build_srt.py --project videos/my-video [--max-chars 46] [--max-sec 4.5] [--gap-ms 600]
"""
import argparse
import json
import math
import sys
from pathlib import Path

SENTENCE_END = {".", "?", "!", ";"}
SOFT_BREAK = {","}


def chunk_words(words, max_chars, max_ms, gap_ms):
    """Group word tokens into subtitle phrases. Punctuation tokens attach to
    the preceding word's text and can trigger a break after it."""
    chunks = []
    cur = None

    def close():
        nonlocal cur
        if cur and cur["words"]:
            cur["text"] = cur["text"].strip()
            chunks.append(cur)
        cur = None

    for tok in words:
        text = tok["text"]
        start = tok["startMs"]
        end = tok["startMs"] + tok["durationMs"]

        if tok.get("punct"):
            if cur:
                cur["text"] = cur["text"].rstrip() + text + " "
                cur["endMs"] = max(cur["endMs"], end)
                if text in SENTENCE_END:
                    close()
                elif text in SOFT_BREAK and len(cur["text"]) > max_chars * 0.6:
                    close()
            continue

        if cur:
            gap = start - cur["endMs"]
            too_long = len(cur["text"]) + len(text) > max_chars
            too_slow = end - cur["startMs"] > max_ms
            if gap > gap_ms or too_long or too_slow:
                close()

        if cur is None:
            cur = {"text": "", "startMs": start, "endMs": end, "words": []}
        cur["text"] += text + " "
        cur["endMs"] = max(cur["endMs"], end)
        cur["words"].append({"text": text, "startMs": start, "endMs": end})

    close()
    return chunks


def fmt_srt_time(ms):
    ms = max(0, int(round(ms)))
    h, rem = divmod(ms, 3600000)
    m, rem = divmod(rem, 60000)
    s, milli = divmod(rem, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{milli:03d}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", required=True)
    ap.add_argument("--max-chars", type=int, default=46)
    ap.add_argument("--max-sec", type=float, default=4.5)
    ap.add_argument("--gap-ms", type=int, default=600)
    args = ap.parse_args()

    project = Path(args.project)
    manifest = json.loads((project / "scenes.json").read_text())
    fps = manifest["fps"]
    audio_dir = project / "public" / "audio"

    srt_entries = []
    offset_frames = 0
    for scene in manifest["scenes"]:
        sid = scene["id"]
        words_path = audio_dir / f"{sid}.words.json"
        duration = scene.get("durationSec", 0)
        pad = scene.get("padOutSec", 0.5)
        scene_frames = math.ceil((duration + pad) * fps)

        if words_path.exists():
            words = json.loads(words_path.read_text())
            chunks = chunk_words(words, args.max_chars, args.max_sec * 1000, args.gap_ms)
            (audio_dir / f"{sid}.chunks.json").write_text(json.dumps(chunks, indent=1))
            offset_ms = offset_frames / fps * 1000
            for c in chunks:
                srt_entries.append((offset_ms + c["startMs"], offset_ms + c["endMs"], c["text"]))
            print(f"  {sid}: {len(chunks)} chunks")
        else:
            print(f"  {sid}: no words file, skipped")

        if duration <= 0:
            sys.exit(f"scene {sid} has no durationSec; run generate_voiceover.py first")
        offset_frames += scene_frames

    out_dir = project / "out"
    out_dir.mkdir(exist_ok=True)
    srt_path = out_dir / "final.srt"
    lines = []
    for i, (start, end, text) in enumerate(srt_entries, 1):
        lines.append(f"{i}\n{fmt_srt_time(start)} --> {fmt_srt_time(end)}\n{text}\n")
    srt_path.write_text("\n".join(lines))
    print(f"wrote {srt_path} ({len(srt_entries)} entries)")


if __name__ == "__main__":
    main()
