"""
Renders assets/moon-disc.webp, the small moon that sits in the top-right corner
of the coding and gallery pages. Lit from the upper left so the bright side
faces the page content.

Run from the repo root:  python scripts/make_moon_disc.py
Needs Pillow and numpy.
"""

from PIL import Image

from make_og_image import moon

SIZE = 640

if __name__ == "__main__":
    ss = 2
    disc = moon(SIZE * ss // 2, light=(-0.55, -0.5, 0.67))
    disc.resize((SIZE, SIZE), Image.LANCZOS).save("assets/moon-disc.webp", "WEBP", quality=82, method=6)
    print("wrote assets/moon-disc.webp")
