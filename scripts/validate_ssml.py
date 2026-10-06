#!/usr/bin/env python3
"""Check that each scene's authored SSML speaks exactly its subtitle text.

For every scene in script/chNN.json: parse `ssml` as XML inside a wrapper, check that it
only uses allowed elements, strip the tags (keeping the inner text of sub, say-as,
emphasis, prosody), and compare with `text` minus [beat] markers, whitespace-normalised.
Also checks that the number of <break> elements equals the number of [beat] markers.
Exit 1 on any failure.

Usage:
    python3 validate_ssml.py script/ch01.json [script/ch02.json ...]
"""
import json
import re
import sys
import xml.etree.ElementTree as ET

ALLOWED = {"break", "prosody", "emphasis", "sub", "say-as", "wrap"}
CHARACTER_ACRONYMS = {"ARM", "AMQP", "RBAC", "OIDC", "SKU", "CLI", "TLS", "UTC", "PTU"}


def norm(s):
    return re.sub(r"\s+", " ", s).strip()


def spoken_text(el):
    """Visible (subtitle) text of an element: sub keeps its inner text, not the alias."""
    parts = [el.text or ""]
    for child in el:
        parts.append(spoken_text(child))
        parts.append(child.tail or "")
    return "".join(parts)


def check_scene(scene):
    errors = []
    ssml = scene.get("ssml")
    if not ssml:
        return [f"{scene['id']}: no ssml field"]
    try:
        root = ET.fromstring(f"<wrap>{ssml}</wrap>")
    except ET.ParseError as e:
        return [f"{scene['id']}: XML parse error: {e}"]
    breaks = 0
    for el in root.iter():
        tag = el.tag
        if tag not in ALLOWED:
            errors.append(f"{scene['id']}: element <{tag}> is not allowed")
        if tag == "break":
            breaks += 1
            t = el.get("time", "")
            m = re.fullmatch(r"(\d+)ms", t)
            if not m or not 150 <= int(m.group(1)) <= 450:
                errors.append(f"{scene['id']}: break time {t!r} outside 150-450ms")
        if tag == "sub" and not el.get("alias"):
            errors.append(f"{scene['id']}: sub without alias")
        if tag == "say-as" and el.get("interpret-as") == "characters" and (el.text or "") not in CHARACTER_ACRONYMS:
            errors.append(f"{scene['id']}: say-as characters on {el.text!r} is not in the acronym list")
    expected = norm(scene["text"].replace("[beat]", " "))
    got = norm(spoken_text(root))
    if got != expected:
        a, b = expected.split(" "), got.split(" ")
        i = next((k for k in range(min(len(a), len(b))) if a[k] != b[k]), min(len(a), len(b)))
        errors.append(f"{scene['id']}: words differ at word {i}: text={' '.join(a[i:i + 8])!r} ssml={' '.join(b[i:i + 8])!r}")
    beats = scene["text"].count("[beat]")
    if breaks != beats:
        errors.append(f"{scene['id']}: {breaks} breaks for {beats} [beat] markers")
    for tag, cap in (("emphasis", 3), ("prosody", 4)):
        n = sum(1 for el in root.iter() if el.tag == tag)
        if n > cap:
            errors.append(f"{scene['id']}: {n} <{tag}> elements (cap {cap})")
    return errors


def main():
    failures = 0
    for path in sys.argv[1:]:
        for scene in json.load(open(path))["scenes"]:
            for err in check_scene(scene):
                print(f"{path}: {err}")
                failures += 1
    print(f"{failures} problem(s)")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
