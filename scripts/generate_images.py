#!/usr/bin/env python3
"""Generate a video's illustrations with FLUX.2 [pro] on Azure AI Foundry.

Reads <project>/images/manifest.json:

    {"model": "FLUX.2-pro", "style": "<shared style suffix>", "width": 1536,
     "height": 864, "images": [{"id": "...", "scene": "s01",
     "point": "the technical point the gag lands on", "prompt": "..."}]}

and calls the Black Forest Labs provider API for each image that does not
exist yet, saving <project>/public/images/<id>.png and a provenance sidecar
<id>.png.json (model, deployment, endpoint host, full prompt, seed, time).
scripts/build_credits.py turns the sidecars into CREDITS.md and the on-screen
credit strings.

Azure notes (verified in practice): FLUX models deploy on an AIServices account
(model format "Black Forest Labs"); the route is
https://<resource>.cognitiveservices.azure.com/providers/blackforestlabs/v1/flux-2-pro?api-version=preview
(the documented api.cognitive.microsoft.com host does not resolve for a
custom-domain resource); the body's "model" must be the deployment name. If
GlobalStandard quota is taken by other resources, DataZoneStandard has its own.
Ask for "no text" in prompts and put labels on top in Remotion; check every
count-bearing image (FLUX miscounts), state counts twice.

The API key is read with the az CLI at run time and kept in memory only.

Usage:
    python3 generate_images.py --project videos/<slug> --resource <ai-services> \
        --group <resource-group> [--subscription <id>] [--deployment flux-2-pro] \
        [--only id1,id2] [--force] [--seed 7]
"""
import argparse
import base64
import json
import subprocess
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

MODEL_PATH = "flux-2-pro"
# the request's "model" field names the deployment on the resource (--deployment)
DEPLOYMENT = "flux-2-pro"


def api_key(resource, group, subscription):
    cmd = ["az", "cognitiveservices", "account", "keys", "list", "-n", resource, "-g", group, "--query", "key1", "-o", "tsv"]
    if subscription:
        cmd += ["--subscription", subscription]
    return subprocess.run(cmd, check=True, capture_output=True, text=True).stdout.strip()


def post(url, key, body):
    req = urllib.request.Request(url, method="POST", data=json.dumps(body).encode())
    req.add_header("Content-Type", "application/json")
    req.add_header("Authorization", f"Bearer {key}")
    with urllib.request.urlopen(req, timeout=300) as resp:
        return json.loads(resp.read())


def fetch(url):
    with urllib.request.urlopen(url, timeout=300) as resp:
        return resp.read()


def image_bytes(result):
    """The response carries base64 data or a URL; accept the shapes BFL and Azure use."""
    candidates = []
    if isinstance(result, dict):
        candidates += [result.get("b64_json"), result.get("image"), (result.get("result") or {}).get("sample") if isinstance(result.get("result"), dict) else None]
        for item in result.get("data") or []:
            candidates += [item.get("b64_json"), item.get("url")]
        candidates += [result.get("url"), result.get("sample")]
    for c in candidates:
        if not c:
            continue
        if isinstance(c, str) and c.startswith("http"):
            return fetch(c)
        if isinstance(c, str):
            return base64.b64decode(c)
    raise ValueError(f"no image in response: {json.dumps(result)[:600]}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", required=True, help="video project folder (holds images/manifest.json)")
    ap.add_argument("--resource", required=True)
    ap.add_argument("--deployment", default=DEPLOYMENT)
    ap.add_argument("--group", required=True)
    ap.add_argument("--subscription")
    ap.add_argument("--only")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--seed", type=int, default=7)
    args = ap.parse_args()

    root = Path(args.project)
    manifest = json.loads((root / "images" / "manifest.json").read_text())
    out_dir = root / "public" / "images"
    out_dir.mkdir(parents=True, exist_ok=True)
    key = api_key(args.resource, args.group, args.subscription)
    host = f"{args.resource}.cognitiveservices.azure.com"
    url = f"https://{host}/providers/blackforestlabs/v1/{MODEL_PATH}?api-version=preview"
    wanted = set(args.only.split(",")) if args.only else None

    for img in manifest["images"]:
        if wanted and img["id"] not in wanted:
            continue
        target = out_dir / f"{img['id']}.png"
        if target.exists() and not args.force:
            print(f"skip {img['id']} (exists)")
            continue
        prompt = f"{img['prompt']} {manifest['style']}"
        body = {
            "model": args.deployment,
            "prompt": prompt,
            "width": manifest["width"],
            "height": manifest["height"],
            "output_format": "png",
            "num_images": 1,
            "seed": args.seed,
        }
        for attempt in range(4):
            try:
                result = post(url, key, body)
                break
            except urllib.error.HTTPError as e:
                detail = e.read().decode(errors="replace")[:400]
                if e.code == 429 and attempt < 3:
                    time.sleep(15 * (attempt + 1))
                    continue
                sys.exit(f"{img['id']}: HTTP {e.code}: {detail}")
        target.write_bytes(image_bytes(result))
        sidecar = {
            "id": img["id"],
            "scene": img["scene"],
            "point": img["point"],
            "model": manifest["model"],
            "deployment": MODEL_PATH,
            "endpoint_host": host,
            "prompt": prompt,
            "seed": args.seed,
            "size": f"{manifest['width']}x{manifest['height']}",
            "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        }
        (out_dir / f"{img['id']}.png.json").write_text(json.dumps(sidecar, indent=2) + "\n")
        print(f"ok {img['id']} -> {target.name} ({target.stat().st_size // 1024} KB)")
        time.sleep(13)  # stay under 5 requests a minute


if __name__ == "__main__":
    main()
