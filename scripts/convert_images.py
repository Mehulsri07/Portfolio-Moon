"""
Auto-converts JPG/JPEG images in Images/Portfolio_Creativity/ to WebP.
Also updates data/photos.json so any entry with a .jpg/.jpeg filename
is rewritten to point to the .webp version.

Run automatically via GitHub Actions on every push.
"""

import json
import os
from pathlib import Path
from PIL import Image, ExifTags

FOLDER = Path("Images/Portfolio_Creativity")
JSON_PATH = Path("data/photos.json")
MAX_SIZE = (1600, 1600)
QUALITY = 82


def fix_orientation(img):
    """Apply EXIF rotation so photos aren't sideways."""
    try:
        exif = img._getexif()
        if exif:
            for tag, val in exif.items():
                if ExifTags.TAGS.get(tag) == "Orientation":
                    if val == 3:
                        return img.rotate(180, expand=True)
                    elif val == 6:
                        return img.rotate(270, expand=True)
                    elif val == 8:
                        return img.rotate(90, expand=True)
    except Exception:
        pass
    return img


def convert_jpg_to_webp(src: Path) -> Path:
    """Convert a single JPG to WebP. Returns the output path."""
    out = src.with_suffix(".webp")
    if out.exists():
        print(f"  Skipped (already exists): {out.name}")
        return out

    img = Image.open(src)
    img = fix_orientation(img)
    img.thumbnail(MAX_SIZE, Image.LANCZOS)
    img.save(out, "WEBP", quality=QUALITY, method=6)

    orig_kb = round(src.stat().st_size / 1024)
    new_kb = round(out.stat().st_size / 1024)
    print(f"  Converted: {src.name} ({orig_kb}KB) -> {out.name} ({new_kb}KB)")
    return out


def update_photos_json():
    """Rewrite any .jpg/.jpeg entries in photos.json to .webp."""
    if not JSON_PATH.exists():
        print("photos.json not found, skipping JSON update.")
        return

    with open(JSON_PATH, "r", encoding="utf-8") as f:
        photos = json.load(f)

    changed = False
    for entry in photos:
        fname = entry.get("file", "")
        stem, ext = os.path.splitext(fname)
        if ext.lower() in (".jpg", ".jpeg"):
            entry["file"] = stem + ".webp"
            changed = True
            print(f"  JSON updated: {fname} -> {entry['file']}")

    if changed:
        with open(JSON_PATH, "w", encoding="utf-8") as f:
            json.dump(photos, f, indent=2, ensure_ascii=False)
        print("photos.json saved.")
    else:
        print("photos.json — no changes needed.")


def main():
    print("=== Image Conversion Script ===")

    # Convert all JPGs that don't have a WebP yet
    jpg_files = list(FOLDER.glob("*.jpg")) + list(FOLDER.glob("*.JPG")) + list(FOLDER.glob("*.jpeg"))
    if jpg_files:
        print(f"\nFound {len(jpg_files)} JPG file(s) to process:")
        for jpg in jpg_files:
            convert_jpg_to_webp(jpg)
    else:
        print("\nNo JPG files found.")

    # Update photos.json references
    print("\nUpdating photos.json...")
    update_photos_json()

    print("\nDone.")


if __name__ == "__main__":
    main()
