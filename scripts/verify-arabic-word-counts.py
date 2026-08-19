#!/usr/bin/env python3
"""Verify Arabic word counts inside <main> for the three expanded guide pages."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CLIENT = ROOT / "client"

TARGETS = [
    ("dining-guide", "دليل الأكل"),
    ("shopping-guide", "دليل التسوق"),
    ("health-guide", "دليل الصحة"),
]


def arabic_words_in_main(html: str) -> int:
    m = re.search(r"<main[^>]*>([\s\S]*?)</main>", html, re.IGNORECASE)
    if not m:
        return 0
    text = re.sub(r"<[^>]+>", " ", m.group(1))
    text = re.sub(r"[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s]+", " ", text)
    words = [w for w in text.split() if re.search(r"[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]", w)]
    return len(words)


def main():
    print("=== Arabic word counts inside <main> ===\n")
    ok = True
    for slug, label in TARGETS:
        path = CLIENT / slug / "index.html"
        html = path.read_text(encoding="utf-8")
        count = arabic_words_in_main(html)
        marker = f"<!-- phase10e-{slug.replace('-guide', '')}-expanded -->"
        has_marker = marker in html
        status = "✓" if count >= 600 and has_marker else "✗"
        if count < 600 or not has_marker:
            ok = False
        print(f"{status} /{slug}/ ({label})")
        print(f"   Arabic words in <main>: {count}")
        print(f"   Idempotency marker: {marker}")
        print(f"   Marker present: {has_marker}")
        print()
    print("=== Result ===")
    print("PASS" if ok else "FAIL")


if __name__ == "__main__":
    main()
