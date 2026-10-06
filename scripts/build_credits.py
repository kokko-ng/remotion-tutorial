#!/usr/bin/env python3
"""Build CREDITS.md and src/assets/images.ts from the assets on disk.

Sources of truth (under the video project):
- public/images/<id>.png.json: provenance sidecar written by generate_images.py
  (one per AI-generated image; an image without a sidecar fails the build)
- public/icons/*.svg: official Azure architecture icons
- public/diagrams-dark/*.svg: dark variants of the walked-through codebase's diagrams

Usage: python3 build_credits.py --project videos/<slug> [--repo-name "<name>"]
Every raster the video can show is listed with its source and licence, and the
on-screen credit string comes from the same record, so the two cannot drift.
"""
import argparse
import json
import sys
from pathlib import Path
ICON_NAMES = {
    "aks": "Azure Kubernetes Service", "event-hubs": "Event Hubs", "redis": "Azure Cache for Redis / Azure Managed Redis",
    "cosmos-db": "Azure Cosmos DB", "key-vault": "Key Vault", "azure-openai": "Azure OpenAI", "container-registry": "Container Registry",
    "nat-gateway": "NAT gateway", "private-endpoint": "Private endpoint", "storage-account": "Storage account", "monitor": "Azure Monitor",
    "application-insights": "Application Insights", "log-analytics": "Log Analytics workspace", "virtual-network": "Virtual network",
    "firewall": "Azure Firewall", "managed-identity": "Managed identity", "policy": "Azure Policy", "cost-budgets": "Cost budgets",
    "ai-search": "Azure AI Search", "load-balancer": "Load balancer", "public-ip": "Public IP address", "front-door": "Front Door",
    "service-bus": "Service Bus", "sql-managed-instance": "SQL Managed Instance", "function-apps": "Function Apps", "ai-services": "Azure AI services",
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", required=True)
    ap.add_argument("--repo-name", default="the codebase this video walks through")
    args = ap.parse_args()
    ROOT = Path(args.project)
    PUB = ROOT / "public"
    images = []
    for png in sorted((PUB / "images").glob("*.png")):
        side = png.with_name(png.name + ".json")
        if not side.exists():
            sys.exit(f"{png.name}: no provenance sidecar; every image needs one")
        meta = json.loads(side.read_text())
        images.append((png.stem, meta))

    lines = [
        "# Credits",
        "",
        "Every image, icon, diagram, font and voice in the video, with its source and licence.",
        "State the intended use here (for example: personal, non-commercial).",
        "",
        "## AI-generated illustrations",
        "",
        "Generated for this video with Black Forest Labs FLUX.2 [pro] on Azure AI Foundry (a",
        "temporary resource, deleted after generation). Use is",
        "subject to the Microsoft Product Terms for Azure AI Foundry Models and the Black Forest Labs",
        "terms (https://blackforestlabs.ai/terms-of-service/). No third-party artwork, logos, or",
        "photographs were used as input. Each file's full prompt is in its `.png.json` sidecar.",
        "",
        "| File | Scene | Gag (technical point) | Model | Generated (UTC) |",
        "|---|---|---|---|---|",
    ]
    for stem, m in images:
        lines.append(f"| `images/{stem}.png` | {m['scene']} | {m['point']} | {m['model']} (seed {m['seed']}) | {m['generated_at']} |")
    lines += [
        "",
        "## Azure architecture icons",
        "",
        "Microsoft Azure architecture icons (Azure_Public_Service_Icons V21), downloaded from the",
        "Azure Architecture Center (https://learn.microsoft.com/azure/architecture/icons/). Used",
        "unmodified, at uniform scale, each with its full service name nearby, to represent the",
        "Microsoft service it was designed for, per the icon terms (`video/public/icons/Microsoft_Terms_of_Use.pdf`",
        "and `Azure_Icons_FAQ.pdf`). The same icons appear inside the repository diagrams, byte for byte.",
        "",
        "| File | Service |",
        "|---|---|",
    ]
    for svg in sorted((PUB / "icons").glob("*.svg")):
        lines.append(f"| `icons/{svg.name}` | {ICON_NAMES.get(svg.stem, svg.stem)} |")
    lines += [
        "",
        "## Architecture diagrams",
        "",
        "The repository's own diagrams (`docs/architecture/diagrams/` and `docs/architecture/codemaps/`",
        f"in {args.repo_name}). `scripts/darken_diagrams.py` takes each",
        "diagram's inline SVG from its HTML source and recolours it for the dark background; nodes,",
        "arrows, labels, positions and the embedded Azure icons are unchanged.",
        "",
        "| File |",
        "|---|",
    ]
    for svg in sorted((PUB / "diagrams-dark").glob("*.svg")):
        lines.append(f"| `diagrams-dark/{svg.name}` |")
    lines += [
        "",
        "## Fonts",
        "",
        "IBM Plex Sans and IBM Plex Mono (SIL Open Font License 1.1), loaded through",
        "`@remotion/google-fonts`.",
        "",
        "## Voice",
        "",
        "Narration synthesised with Azure AI Speech neural text to speech (a temporary resource,",
        "deleted after generation), subject to the Microsoft Product",
        "Terms. Script written for this video.",
        "",
        "## Software",
        "",
        "Remotion 4 (https://remotion.dev), used under its license for an individual's personal",
        "project. Scene template from the remotion-tutorial skill.",
        "",
    ]
    (ROOT / "CREDITS.md").write_text("\n".join(lines))

    ts = [
        "/**",
        " * Every raster image the video shows, with its short on-screen credit.",
        " * Generated by tools/build_credits.py from the provenance sidecars; do not edit.",
        " */",
        "export interface ImageMeta {",
        "  file: string;",
        "  /** shown in the window title bar whenever the image is on screen */",
        "  credit: string;",
        "}",
        "",
        "const registry = {",
    ]
    for stem, m in images:
        ts.append(f"  '{stem}': {{file: '{stem}.png', credit: 'AI-generated · {m['model']} on Azure AI Foundry'}},")
    ts += [
        "} satisfies Record<string, ImageMeta>;",
        "",
        "export type ImageId = keyof typeof registry;",
        "export const images: Record<ImageId, ImageMeta> = registry;",
        "",
    ]
    (ROOT / "src" / "assets" / "images.ts").write_text("\n".join(ts))
    print(f"CREDITS.md: {len(images)} images, icons, diagrams, fonts, voice")


if __name__ == "__main__":
    main()
