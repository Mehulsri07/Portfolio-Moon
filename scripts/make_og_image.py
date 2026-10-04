"""
Renders assets/og-image.png, the 1200x630 social preview card:
the landing page's moon rising under the name and role line.

Run from the repo root:  python scripts/make_og_image.py
Needs Pillow and numpy. Fonts are Windows system fonts (Garamond, Consolas),
standing in for the site's Cormorant Garamond and Space Mono.
"""

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H, SS = 1200, 630, 2          # output size, supersampling factor
BG = (9, 9, 33)                  # --bg
TEXT = (248, 248, 250)           # --text
CREAM = (226, 217, 198)          # --cream

NAME = "Mehul Srivastava"
ROLE = "DevOps & SRE  ·  Event photography"
FONT_NAME = "C:/Windows/Fonts/GARA.TTF"
FONT_ROLE = "C:/Windows/Fonts/consola.ttf"


def moon(radius):
    """Orthographic view of the equirectangular moon texture, lit from above."""
    tex = np.asarray(Image.open("assets/moon_texture.jpg").convert("RGB"), dtype=np.float32) / 255
    th, tw = tex.shape[:2]

    n = radius * 2
    ys, xs = np.mgrid[0:n, 0:n]
    nx = (xs - radius + 0.5) / radius
    ny = (ys - radius + 0.5) / radius
    r2 = nx**2 + ny**2
    inside = r2 <= 1
    nz = np.sqrt(np.clip(1 - r2, 0, 1))

    lon = np.arctan2(nx, nz)
    lat = np.arcsin(np.clip(-ny, -1, 1))
    u = ((lon / (2 * np.pi) + 0.5) * tw).astype(int) % tw
    v = np.clip(((0.5 - lat / np.pi) * th).astype(int), 0, th - 1)
    rgb = tex[v, u]

    # Key light from above and slightly toward the viewer, like the site's scene
    light = np.array([0.0, -0.86, 0.5])
    lit = np.clip(nx * light[0] + ny * light[1] + nz * light[2], 0, 1) ** 0.9
    shade = (0.05 + 0.95 * lit)[..., None]
    rgb = rgb * shade * np.array([0.92, 0.96, 1.06])   # faint cool cast

    # Soft antialiased edge
    alpha = np.clip((1 - np.sqrt(r2)) * radius / 1.5, 0, 1) * inside
    out = np.dstack([np.clip(rgb, 0, 1), alpha])
    return Image.fromarray((out * 255).astype(np.uint8), "RGBA")


def main():
    w, h = W * SS, H * SS
    img = Image.new("RGB", (w, h), BG)

    # Starfield
    rng = np.random.default_rng(7)
    stars = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(stars)
    for _ in range(260):
        x, y = rng.integers(0, w), rng.integers(0, h)
        r = rng.choice([1, 1, 1, 2, 2, 3]) * SS / 2
        a = int(rng.integers(40, 170))
        d.ellipse([x - r, y - r, x + r, y + r], fill=(235, 238, 255, a))
    img.paste(stars, (0, 0), stars)

    # Moon rising from the bottom edge
    radius = 440 * SS
    m = moon(radius)
    cx, cy = w // 2, h + 200 * SS
    img.paste(m, (cx - radius, cy - radius), m)

    # Text, with a soft dark halo so it stays readable over the stars
    name_font = ImageFont.truetype(FONT_NAME, 92 * SS)
    role_font = ImageFont.truetype(FONT_ROLE, 25 * SS)
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.text((w / 2, 190 * SS), NAME, font=name_font, fill=TEXT, anchor="mm")
    d.text((w / 2, 274 * SS), ROLE, font=role_font, fill=CREAM, anchor="mm")
    halo = layer.split()[3].filter(ImageFilter.GaussianBlur(14 * SS)).point(lambda p: int(p * 0.7))
    img.paste(Image.new("RGB", (w, h), BG), (0, 0), halo)
    img.paste(layer, (0, 0), layer)

    img.resize((W, H), Image.LANCZOS).save("assets/og-image.png", optimize=True)
    print("wrote assets/og-image.png")


if __name__ == "__main__":
    main()
