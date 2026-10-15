#!/usr/bin/env python3
"""
KONSENXIA OG card renderer — "Clinical Noir" 1200x630 social preview.

Reproducible PIL renderer matching the site's design language:
  - void navy background (#060a14) with subtle grid + teal/blue orbs
  - teal->blue gradient wordmark (KONSENXIA)
  - ECG line motif (the brand's signature element)
  - headline + subhead + URL pill footer

Usage: python3 scripts/render-og.py [out.png]
Default out: scripts/og.png (tracked source asset, copied to public/assets/og.png at build).
"""
import os
import sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1200, 630
VOID = (6, 10, 20)
SURFACE = (14, 22, 40)
TEAL = (0, 196, 176)
TEAL_L = (0, 217, 195)
BLUE = (59, 130, 246)
INK = (240, 244, 255)
DIM = (139, 150, 181)
LINE = (30, 44, 79)

FONT_DIR = "/home/paperclip/.fonts"
def font(path, size):
    return ImageFont.truetype(os.path.join(FONT_DIR, path), size)

def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

def gradient_text(draw, xy, text, font, c1, c2, anchor="mm"):
    """Draw text with a horizontal gradient fill using a mask."""
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    layer = Image.new("RGBA", (max(tw, 1), max(th, 1)), (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)
    ld.text((bbox[0] * -1, bbox[1] * -1), text, font=font, fill=(255, 255, 255, 255))
    px = layer.load()
    for x in range(layer.width):
        t = x / max(layer.width - 1, 1)
        col = lerp(c1, c2, t) + (255,)
        for y in range(layer.height):
            r, g, b, a = px[x, y]
            if a:
                px[x, y] = col
    cx, cy = xy
    draw._image.paste(layer, (int(cx - tw / 2), int(cy - th / 2)), layer)

def main(out_path):
    img = Image.new("RGB", (W, H), VOID)
    draw = ImageDraw.Draw(img)

    # subtle grid
    for x in range(0, W, 52):
        draw.line([(x, 0), (x, H)], fill=(13, 20, 38), width=1)
    for y in range(0, H, 52):
        draw.line([(0, y), (W, y)], fill=(13, 20, 38), width=1)

    # orbs (teal top-right, blue bottom-left) with soft blur
    orb_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(orb_layer)
    od.ellipse([W - 420, 0, W - 40, 260], fill=(0, 196, 176, 40))
    od.ellipse([0, H - 300, 180, H - 40], fill=(59, 130, 246, 34))
    orb_layer = orb_layer.filter(ImageFilter.GaussianBlur(60))
    img = Image.alpha_composite(img.convert("RGBA"), orb_layer).convert("RGB")
    draw = ImageDraw.Draw(img)

    # ECG line motif (brand signature) across the lower third
    ecg = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ed = ImageDraw.Draw(ecg)
    ecg_pts = []
    x = 0
    base_y = 470
    while x < W:
        if (x // 90) % 2 == 0:
            ecg_pts += [(x, base_y), (x + 18, base_y), (x + 26, base_y - 26),
                        (x + 34, base_y + 30), (x + 42, base_y - 8), (x + 50, base_y)]
        else:
            ecg_pts += [(x, base_y), (x + 60, base_y)]
        x += 90
    ed.line(ecg_pts, fill=(0, 196, 176, 200), width=3, joint="curve")
    img = Image.alpha_composite(img.convert("RGBA"), ecg).convert("RGB")
    draw = ImageDraw.Draw(img)

    # wordmark
    f_word = font("Montserrat-ExtraBold.ttf", 96)
    gradient_text(draw, (W / 2, 150), "KONSENXIA", f_word, TEAL, BLUE)

    # headline
    f_head = font("Montserrat-SemiBold.ttf", 44)
    draw.text((W / 2, 268), "Clinical AI that works with doctors,", font=f_head, fill=INK, anchor="mm")
    draw.text((W / 2, 322), "not around them.", font=f_head, fill=INK, anchor="mm")

    # subhead
    f_sub = font("Montserrat-Regular.ttf", 26)
    draw.text((W / 2, 392), "Medical consultation · differential diagnosis · doctor-to-doctor collaboration",
              font=f_sub, fill=DIM, anchor="mm")

    # URL pill
    pill_w, pill_h = 300, 52
    px0, py0 = int(W / 2 - pill_w / 2), 540
    draw.rounded_rectangle([px0, py0, px0 + pill_w, py0 + pill_h], radius=26,
                          fill=SURFACE, outline=LINE, width=2)
    f_url = font("Montserrat-SemiBold.ttf", 24)
    draw.text((W / 2, py0 + pill_h / 2), "konsenxia.com", font=f_url, fill=TEAL_L, anchor="mm")

    img.save(out_path, "PNG")
    print(f"wrote {out_path} {img.size}")

if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), "og.png")
    main(out)
