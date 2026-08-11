#!/usr/bin/env python3
"""Generate per-scene voiceover audio and word timings via Azure Speech batch synthesis.

Reads a narration file, submits one batch synthesis job (all scenes as ordered
inputs), polls until done, downloads the results ZIP, and writes per scene:

    <project>/public/audio/<sceneId>.wav
    <project>/public/audio/<sceneId>.words.json   [{"text","startMs","durationMs","punct"}]

It also writes the measured audio duration into the matching scene entry of
<project>/scenes.json (field "durationSec").

Narration file format:

    {
      "voice": "en-US-AndrewMultilingualNeural",   // optional
      "rate": "-4%",                               // optional
      "scenes": [{"id": "s01", "text": "..."}, ...]
    }

Authentication: reads SPEECH_KEY from the environment if set, otherwise fetches
key1 of the given Cognitive Services resource with the az CLI. Only Python
stdlib is used.

Usage:
    python3 generate_voiceover.py --narration narration.json --project videos/my-video
    python3 generate_voiceover.py ... --scenes s02,s05    # regenerate a subset
    python3 generate_voiceover.py ... --dry-run           # print request JSON only
"""
import argparse
import io
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request
import uuid
import wave
import zipfile
from pathlib import Path

DEFAULT_VOICE = "en-US-AvaMultilingualNeural"
DEFAULT_RATE = "-4%"
API_VERSION = "2024-04-01"


def get_key(resource, group, subscription):
    env = os.environ.get("SPEECH_KEY")
    if env:
        return env
    cmd = ["az", "cognitiveservices", "account", "keys", "list",
           "-n", resource, "-g", group, "--query", "key1", "-o", "tsv"]
    if subscription:
        cmd += ["--subscription", subscription]
    out = subprocess.run(cmd, check=True, capture_output=True, text=True)
    key = out.stdout.strip()
    if not key:
        sys.exit("az returned an empty key; check resource name/group/subscription")
    return key


def request(url, key, method="GET", body=None, raw=False):
    req = urllib.request.Request(url, method=method)
    req.add_header("Ocp-Apim-Subscription-Key", key)
    data = None
    if body is not None:
        req.add_header("Content-Type", "application/json")
        data = json.dumps(body).encode()
    try:
        with urllib.request.urlopen(req, data, timeout=120) as resp:
            payload = resp.read()
    except urllib.error.HTTPError as e:
        sys.exit(f"HTTP {e.code} on {method} {url}\n{e.read().decode(errors='replace')}")
    return payload if raw else json.loads(payload)


def is_punct(text):
    return not any(ch.isalnum() for ch in text)


def normalize_words(raw):
    words = []
    for entry in raw:
        words.append({
            "text": entry["Text"],
            "startMs": entry["AudioOffset"],
            "durationMs": entry["Duration"],
            "punct": is_punct(entry["Text"]),
        })
    return words


def wav_duration_sec(path):
    with wave.open(str(path), "rb") as w:
        return w.getnframes() / w.getframerate()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--narration", required=True)
    ap.add_argument("--project", required=True, help="Remotion project dir containing scenes.json")
    ap.add_argument("--voice", default=None)
    ap.add_argument("--rate", default=None)
    ap.add_argument("--resource-name", default="kokko-dev")
    ap.add_argument("--resource-group", default="kokko-dev-rg")
    ap.add_argument("--subscription", default=None)
    ap.add_argument("--scenes", default=None, help="comma-separated scene ids to (re)generate")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    narration = json.loads(Path(args.narration).read_text())
    scenes = narration["scenes"]
    if args.scenes:
        wanted = set(args.scenes.split(","))
        scenes = [s for s in scenes if s["id"] in wanted]
        missing = wanted - {s["id"] for s in scenes}
        if missing:
            sys.exit(f"scene ids not found in narration file: {sorted(missing)}")
    if not scenes:
        sys.exit("no scenes to synthesize")

    voice = args.voice or narration.get("voice") or DEFAULT_VOICE
    rate = args.rate or narration.get("rate") or DEFAULT_RATE
    body = {
        "inputKind": "PlainText",
        "synthesisConfig": {"voice": voice, "rate": rate},
        "inputs": [{"content": s["text"]} for s in scenes],
        "properties": {
            "outputFormat": "riff-24khz-16bit-mono-pcm",
            "wordBoundaryEnabled": True,
            "sentenceBoundaryEnabled": True,
            "concatenateResult": False,
        },
    }
    if args.dry_run:
        print(json.dumps(body, indent=2))
        return

    project = Path(args.project)
    audio_dir = project / "public" / "audio"
    audio_dir.mkdir(parents=True, exist_ok=True)
    manifest_path = project / "scenes.json"

    key = get_key(args.resource_name, args.resource_group, args.subscription)
    base = f"https://{args.resource_name}.cognitiveservices.azure.com"
    job_id = f"vo-{uuid.uuid4().hex[:12]}"
    url = f"{base}/texttospeech/batchsyntheses/{job_id}?api-version={API_VERSION}"

    print(f"submitting {len(scenes)} scene(s) as job {job_id} (voice={voice}, rate={rate})")
    request(url, key, "PUT", body)

    status = None
    for _ in range(240):  # up to ~32 min
        time.sleep(8)
        job = request(url, key)
        status = job.get("status")
        print(f"  status: {status}")
        if status in ("Succeeded", "Failed"):
            break
    if status != "Succeeded":
        sys.exit(f"batch synthesis did not succeed: {json.dumps(job, indent=2)[:2000]}")

    zip_bytes = request(job["outputs"]["result"], key, raw=True)
    zf = zipfile.ZipFile(io.BytesIO(zip_bytes))
    summary = json.loads(zf.read("summary.json"))
    results = summary["results"]
    if len(results) != len(scenes):
        sys.exit(f"expected {len(scenes)} results, got {len(results)}")

    durations = {}
    for idx, scene in enumerate(scenes):
        res = results[idx]
        if res.get("status") != "Succeeded":
            sys.exit(f"scene {scene['id']} failed: {json.dumps(res)}")
        wav_path = audio_dir / f"{scene['id']}.wav"
        wav_path.write_bytes(zf.read(res["audioFileName"]))
        raw_words = json.loads(zf.read(res["wordBoundaryFileName"]))
        words_path = audio_dir / f"{scene['id']}.words.json"
        words_path.write_text(json.dumps(normalize_words(raw_words), indent=1))
        dur = int(res["properties"]["durationInMilliseconds"]) / 1000.0
        if dur <= 0:
            dur = wav_duration_sec(wav_path)
        durations[scene["id"]] = round(dur, 3)
        print(f"  {scene['id']}: {durations[scene['id']]}s, {len(raw_words)} tokens -> {wav_path.name}")

    if manifest_path.exists():
        manifest = json.loads(manifest_path.read_text())
        by_id = {s["id"]: s for s in manifest.get("scenes", [])}
        for sid, dur in durations.items():
            if sid in by_id:
                by_id[sid]["durationSec"] = dur
            else:
                print(f"  warning: scene {sid} not present in {manifest_path}")
        manifest_path.write_text(json.dumps(manifest, indent=2) + "\n")
        print(f"updated durations in {manifest_path}")
    else:
        print(f"note: {manifest_path} not found; durations not written")


if __name__ == "__main__":
    main()
