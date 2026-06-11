#!/usr/bin/env python3
"""Generates the committed brand assets from the design tokens.

One-off build tooling, not part of the app runtime. Re-run after a token
change and commit the results:

    python3 scripts/generate-brand-assets.py

Outputs:
    public/og-card.png   1200x630 social card (Open Graph and Twitter)
    app/icon.png         512x512 favicon source
    app/apple-icon.png   180x180 Apple touch icon
"""

from PIL import Image, ImageDraw, ImageFont

# Design tokens, mirrored from tailwind.config.ts.
SURFACE = "#0e1117"
SURFACE_RAISED = "#161b24"
SURFACE_LINE = "#2a3342"
INK = "#e6ebf2"
INK_MUTED = "#9aa6b8"
ACCENT = "#5ba8f5"
GOOD = "#4ade80"
WARN = "#fbbf24"
BAD = "#f87171"

SANS_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
SANS = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"


def risk_band(draw, x, y, width, height, radius):
    """The three-band risk meter motif: controlled, raised, high."""
    third = width // 3
    draw.rounded_rectangle([x, y, x + width, y + height], radius, fill=SURFACE_LINE)
    draw.rounded_rectangle([x, y, x + third, y + height], radius, fill=GOOD)
    draw.rounded_rectangle([x + third + 8, y, x + 2 * third, y + height], radius, fill=WARN)
    draw.rounded_rectangle([x + 2 * third + 8, y, x + width, y + height], radius, fill=BAD)


def make_og_card():
    img = Image.new("RGB", (1200, 630), SURFACE)
    draw = ImageDraw.Draw(img)

    draw.rounded_rectangle([60, 60, 1140, 570], 24, outline=SURFACE_LINE, width=3)

    kicker = " ".join("A SOFTWARE ENGINEERING SIMULATOR")
    size = 30
    while size > 12:
        kicker_font = ImageFont.truetype(MONO, size)
        if draw.textlength(kicker, font=kicker_font) <= 960:
            break
        size -= 2
    draw.text((120, 150), kicker, font=kicker_font, fill=ACCENT)

    title_font = ImageFont.truetype(SANS_BOLD, 132)
    draw.text((112, 210), "ShipDay", font=title_font, fill=INK)

    tag_font = ImageFont.truetype(SANS, 40)
    draw.text((120, 392), "Ship safely under pressure,", font=tag_font, fill=INK_MUTED)
    draw.text((120, 444), "one workday at a time.", font=tag_font, fill=INK_MUTED)

    risk_band(draw, 120, 525, 400, 14, 7)

    img.save("public/og-card.png", optimize=True)


def make_icon(size, pad_ratio, path):
    img = Image.new("RGB", (size, size), SURFACE_RAISED)
    draw = ImageDraw.Draw(img)

    border = max(2, size // 64)
    draw.rounded_rectangle(
        [border, border, size - border, size - border],
        size // 8,
        outline=SURFACE_LINE,
        width=border,
    )

    letter_font = ImageFont.truetype(SANS_BOLD, int(size * 0.52))
    bbox = draw.textbbox((0, 0), "S", font=letter_font)
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    draw.text(
        ((size - w) / 2 - bbox[0], (size - h) / 2 - bbox[1] - size * 0.06),
        "S",
        font=letter_font,
        fill=ACCENT,
    )

    band_w = int(size * 0.5)
    band_h = max(4, size // 28)
    risk_band(
        draw,
        (size - band_w) // 2,
        int(size * 0.78),
        band_w,
        band_h,
        band_h // 2,
    )

    img.save(path, optimize=True)


if __name__ == "__main__":
    make_og_card()
    make_icon(512, 0.1, "app/icon.png")
    make_icon(180, 0.1, "app/apple-icon.png")
    print("Wrote public/og-card.png, app/icon.png, app/apple-icon.png")
