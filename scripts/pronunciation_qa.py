#!/usr/bin/env python3
"""Pronunciation QA: transcribe each scene's voiceover with Azure fast
transcription and diff it against the narration text. Reports script spans
containing acronyms, mixed-case names or numbers that the transcript renders
differently, so mispronunciations can be fixed with lexicon.json entries.

Usage: python3 scripts/pronunciation_qa.py --project videos/<slug> --resource-name X --resource-group Y [--scenes a,b]
Writes <project>/out/pronunciation-qa.md and transcripts to <project>/out/stt/.
Most differences are transcription formatting (1000 vs 1 000); look for
acronyms and names heard as different words, add lexicon entries, and
resynthesize only those scenes with --scenes.
"""

import argparse
import difflib
import json
import re
import subprocess
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

API = "speechtotext/transcriptions:transcribe?api-version=2024-11-15"


def norm(s):
    s = s.replace("[beat]", " ")
    return [w for w in re.sub(r"[^A-Za-z0-9\-\.' ]+", " ", s).replace(". ", " ").split() if w]


def key(w):
    return re.sub(r"[^a-z0-9]", "", w.lower())


def risky(span):
    return any(re.search(r"[A-Z].*[A-Z]|\d|[a-z][A-Z]|-", w) for w in span)


def transcribe(endpoint, key_, wav):
    out = subprocess.run(
        [
            "curl",
            "-s",
            "-m",
            "300",
            "-X",
            "POST",
            f"{endpoint}/{API}",
            "-H",
            f"Ocp-Apim-Subscription-Key: {key_}",
            "-F",
            f"audio=@{wav}",
            "-F",
            'definition={"locales":["en-US"]}',
        ],
        capture_output=True,
        text=True,
        check=True,
    ).stdout
    d = json.loads(out)
    return d["combinedPhrases"][0]["text"] if d.get("combinedPhrases") else ""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", default=".")
    ap.add_argument("--resource-name", required=True)
    ap.add_argument("--resource-group", required=True)
    ap.add_argument("--scenes", default=None)
    a = ap.parse_args()
    root = Path(a.project)
    narr = {s["id"]: s["text"] for s in json.loads((root / "narration.json").read_text())["scenes"]}
    ids = a.scenes.split(",") if a.scenes else list(narr)
    k = subprocess.run(
        [
            "az",
            "cognitiveservices",
            "account",
            "keys",
            "list",
            "-n",
            a.resource_name,
            "-g",
            a.resource_group,
            "--query",
            "key1",
            "-o",
            "tsv",
        ],
        capture_output=True,
        text=True,
        check=True,
    ).stdout.strip()
    endpoint = f"https://{a.resource_name}.cognitiveservices.azure.com"
    outdir = root / "out" / "stt"
    outdir.mkdir(parents=True, exist_ok=True)

    def job(sid):
        t = transcribe(endpoint, k, root / "public" / "audio" / f"{sid}.wav")
        (outdir / f"{sid}.txt").write_text(t)
        return sid, t

    with ThreadPoolExecutor(6) as ex:
        res = dict(ex.map(job, ids))
    rows = []
    for sid in ids:
        src, hyp = norm(narr[sid]), norm(res[sid])
        sm = difflib.SequenceMatcher(a=[key(w) for w in src], b=[key(w) for w in hyp], autojunk=False)
        for op, i1, i2, j1, j2 in sm.get_opcodes():
            if op == "equal":
                continue
            span = src[i1:i2]
            if span and risky(span):
                rows.append((sid, " ".join(span), " ".join(hyp[j1:j2])))
    lines = [
        "# Pronunciation QA",
        "",
        f"{len(rows)} script spans heard differently (acronyms, names, numbers).",
        "",
        "| scene | script | heard as |",
        "|---|---|---|",
    ]
    lines += [f"| {s} | {x} | {y} |" for s, x, y in rows]
    (root / "out" / "pronunciation-qa.md").write_text("\n".join(lines) + "\n")
    print(f"{len(rows)} spans; report in out/pronunciation-qa.md")


if __name__ == "__main__":
    main()
