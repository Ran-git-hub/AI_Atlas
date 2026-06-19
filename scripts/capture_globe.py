#!/usr/bin/env python3
"""
Capture the AI Atlas globe for the OG image.

Pipeline:
1. Visit production site (live data)
2. Wait for globe to fully render
3. Screenshot the canvas element directly (no UI chrome)
4. Crop a centered square from the canvas
5. Resize to 1200x1200 (square, matches OG card right-side layout)
6. Save as public/og-globe.png

The output is a transparent-background globe that composites well over
the dark navy OG card background.
"""

import io
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image

PROD_URL = "https://ai-atlas.app"
OUTPUT_PATH = Path(__file__).resolve().parent.parent / "public" / "og-globe.png"
VIEWPORT_WIDTH = 2400
VIEWPORT_HEIGHT = 2400
OUTPUT_SIZE = 1200  # final square dimensions
CROP_FRACTION = 0.78  # fraction of canvas to use for the globe (skip edges)


def capture_canvas() -> bytes:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        try:
            context = browser.new_context(
                viewport={"width": VIEWPORT_WIDTH, "height": VIEWPORT_HEIGHT},
                device_scale_factor=2,
                color_scheme="dark",
                user_agent=(
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/126.0.0.0 Safari/537.36"
                ),
            )
            page = context.new_page()
            print(f"Navigating to {PROD_URL}...", file=sys.stderr)
            page.goto(PROD_URL, wait_until="domcontentloaded", timeout=60000)

            print("Waiting for globe canvas...", file=sys.stderr)
            page.wait_for_selector("canvas", timeout=30000)

            # Let the globe fully render: markers, country polygons, atmosphere
            print("Letting globe settle (12s)...", file=sys.stderr)
            page.wait_for_timeout(12000)

            canvas = page.locator("canvas").first
            print(f"Canvas found: {canvas.bounding_box()}", file=sys.stderr)

            print("Capturing canvas...", file=sys.stderr)
            png_bytes = canvas.screenshot(type="png", omit_background=False)
            print(f"Canvas PNG: {len(png_bytes):,} bytes", file=sys.stderr)
            return png_bytes
        finally:
            browser.close()


def crop_to_globe_square(canvas_png: bytes) -> bytes:
    """Crop a centered square from the canvas and resize to OUTPUT_SIZE."""
    img = Image.open(io.BytesIO(canvas_png)).convert("RGBA")
    w, h = img.size
    print(f"Source canvas: {w}x{h}", file=sys.stderr)

    # The globe is centered in the canvas; crop a centered square
    side = int(min(w, h) * CROP_FRACTION)
    left = (w - side) // 2
    top = (h - side) // 2
    cropped = img.crop((left, top, left + side, top + side))
    print(f"Cropped to: {cropped.size}", file=sys.stderr)

    # Resize to final size with high-quality resampling
    final = cropped.resize((OUTPUT_SIZE, OUTPUT_SIZE), Image.LANCZOS)
    print(f"Resized to: {final.size}", file=sys.stderr)

    out = io.BytesIO()
    final.save(out, format="PNG", optimize=True)
    return out.getvalue()


def main() -> int:
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    try:
        canvas_png = capture_canvas()
        final_png = crop_to_globe_square(canvas_png)
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return 1

    OUTPUT_PATH.write_bytes(final_png)
    print(f"✅ Saved to {OUTPUT_PATH} ({len(final_png):,} bytes)", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())