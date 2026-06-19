#!/usr/bin/env python3
"""
Capture the AI Atlas globe for the OG image.

Pipeline:
1. Visit production site (live data)
2. Wait for globe to fully render
3. Hide all UI chrome (header, sidebars, panels, controls)
4. Screenshot the full viewport
5. Crop a centered square around the globe
6. Resize to 1200x1200
7. Save as public/og-globe.png

The output is a clean globe with dark background that matches the OG card.
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
OUTPUT_SIZE = 1200
CROP_FRACTION = 0.92

# CSS to inject that hides all UI chrome but keeps the canvas visible.
# We hide anything that isn't the canvas or a direct ancestor of it.
HIDE_CHROME_CSS = """
html, body { margin: 0; padding: 0; background: #050d14; }
body > div { position: relative; }
header, nav, footer,
[class*='panel' i], [class*='Panel' i],
[class*='sidebar' i], [class*='Sidebar' i],
[class*='tooltip' i], [class*='Tooltip' i],
[class*='legend' i], [class*='Legend' i],
[class*='overlay' i], [class*='Overlay' i],
[class*='controls' i], [class*='Controls' i],
[class*='header' i], [class*='Header' i],
[class*='footer' i], [class*='Footer' i],
button, [role='button'],
[class*='info-card' i], [class*='InfoCard' i],
[class*='interaction' i], [class*='Interaction' i],
[class*='tips' i], [class*='Tips' i],
[data-radix-popper-content-wrapper],
[class*='popover' i], [class*='Popover' i],
[class*='dropdown' i], [class*='Dropdown' i],
div[class*='fixed'][class*='left-'],
div[class*='fixed'][class*='right-'],
div[class*='absolute'][class*='top-1/2'],
div[class*='absolute'][class*='bottom-'] {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
}
"""


def capture_globe() -> bytes:
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
            # Pre-set the dismissed flag for the interaction tips panel
            context.add_init_script("""
                window.localStorage.setItem('ai-atlas-hide-interaction-tips', '1');
            """)
            page = context.new_page()
            print(f"Navigating to {PROD_URL}...", file=sys.stderr)
            page.goto(PROD_URL, wait_until="domcontentloaded", timeout=60000)

            print("Waiting for globe canvas...", file=sys.stderr)
            page.wait_for_selector("canvas", timeout=30000)

            # Hide all UI chrome so we get a clean globe screenshot
            print("Hiding UI chrome...", file=sys.stderr)
            page.add_style_tag(content=HIDE_CHROME_CSS)
            page.wait_for_timeout(1000)

            # Let the globe fully render: markers, country polygons, atmosphere
            print("Letting globe settle (12s)...", file=sys.stderr)
            page.wait_for_timeout(12000)

            print("Capturing viewport...", file=sys.stderr)
            png_bytes = page.screenshot(type="png", full_page=False, clip=None)
            print(f"Viewport PNG: {len(png_bytes):,} bytes", file=sys.stderr)
            return png_bytes
        finally:
            browser.close()


def crop_to_globe_square(viewport_png: bytes) -> bytes:
    """Crop a centered square from the viewport and resize to OUTPUT_SIZE.
    Skip ~6% of the left edge to avoid the side panel (interaction tips).
    """
    img = Image.open(io.BytesIO(viewport_png)).convert("RGBA")
    w, h = img.size
    print(f"Source viewport: {w}x{h}", file=sys.stderr)

    side = int(min(w, h) * CROP_FRACTION)
    # Shift left edge right to skip the side panel (which is at x=0)
    left = int(w * 0.06) + (w - side - int(w * 0.06)) // 2
    top = (h - side) // 2
    # Ensure we don't go out of bounds
    left = max(0, min(left, w - side))
    cropped = img.crop((left, top, left + side, top + side))
    print(f"Cropped to: {cropped.size} (offset {left}px from left)", file=sys.stderr)

    final = cropped.resize((OUTPUT_SIZE, OUTPUT_SIZE), Image.LANCZOS)
    print(f"Resized to: {final.size}", file=sys.stderr)

    out = io.BytesIO()
    final.save(out, format="PNG", optimize=True)
    return out.getvalue()


def main() -> int:
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    try:
        viewport_png = capture_globe()
        final_png = crop_to_globe_square(viewport_png)
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return 1

    OUTPUT_PATH.write_bytes(final_png)
    print(f"✅ Saved to {OUTPUT_PATH} ({len(final_png):,} bytes)", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())