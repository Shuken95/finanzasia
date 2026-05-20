#!/usr/bin/env python3
"""Generate PNG icons from master SVGs for Mintly PWA."""
import cairosvg
from pathlib import Path

ICONS_DIR = Path(__file__).parent
MAIN_SVG = (ICONS_DIR / "icon.svg").read_bytes()
MASK_SVG = (ICONS_DIR / "icon-maskable.svg").read_bytes()
FAVI_SVG = (ICONS_DIR / "favicon.svg").read_bytes()

targets = [
    (MAIN_SVG, "icon-192.png", 192),
    (MAIN_SVG, "icon-512.png", 512),
    (MASK_SVG, "icon-maskable-192.png", 192),
    (MASK_SVG, "icon-maskable-512.png", 512),
    (MAIN_SVG, "apple-touch-icon.png", 180),
    (FAVI_SVG, "favicon-32.png", 32),
]

for svg_bytes, name, size in targets:
    out = ICONS_DIR / name
    cairosvg.svg2png(
        bytestring=svg_bytes,
        write_to=str(out),
        output_width=size,
        output_height=size,
    )
    print(f"  wrote {name} ({size}x{size}, {out.stat().st_size} bytes)")

print("All icons regenerated.")
