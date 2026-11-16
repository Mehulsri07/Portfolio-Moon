"""
Auto-converts JPG/JPEG images in Images/Portfolio_Creativity/ to WebP.
Also updates data/photos.json so any entry with a .jpg/.jpeg filename
is rewritten to point to the .webp version, and records the camera details
(body, lens, focal length, aperture, shutter, ISO) from the JPG's EXIF as
"camera", which the gallery lightbox shows. WebP output drops EXIF, so this
is the one chance to keep them.

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
CAMERAS = {}  # file stem -> camera details read from a JPG's EXIF during this run


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


def camera_details(img):
    """'Sony ILCE-7M3 · FE 28-70mm F3.5-5.6 OSS · 70mm · f/14 · 0.4s · ISO 100', or None."""
    try:
        exif = img.getexif()
        tags = {ExifTags.TAGS.get(k, k): v for k, v in list(exif.items()) + list(exif.get_ifd(0x8769).items())}
    except Exception:
        return None
    parts = []
    make, model = str(tags.get("Make", "")).strip(), str(tags.get("Model", "")).strip()
    if model:
        parts.append(model if make and model.lower().startswith(make.lower()) else f"{make.title()} {model}".strip())
    if tags.get("LensModel"):
        parts.append(str(tags["LensModel"]).strip())
    if tags.get("FocalLength"):
        parts.append(f"{float(tags['FocalLength']):g}mm")
    if tags.get("FNumber"):
        parts.append(f"f/{float(tags['FNumber']):g}")
    if tags.get("ExposureTime"):
        t = float(tags["ExposureTime"])
        # 1/250s style only when the shutter really is a whole fraction (0.4s stays 0.4s)
        parts.append(f"1/{round(1 / t)}s" if 0 < t < 1 and abs(1 / t - round(1 / t)) < 0.05 else f"{t:g}s")
    iso = tags.get("ISOSpeedRatings") or tags.get("PhotographicSensitivity")
    if iso:
        parts.append(f"ISO {iso}")
    return " · ".join(parts) if len(parts) >= 2 else None


def convert_jpg_to_webp(src: Path) -> Path:
    """Convert a single JPG to WebP. Returns the output path."""
    out = src.with_suffix(".webp")
    if out.exists():
        print(f"  Skipped (already exists): {out.name}")
        return out

    img = Image.open(src)
    CAMERAS[src.stem] = camera_details(img)
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
        if CAMERAS.get(stem) and not entry.get("camera"):
            entry["camera"] = CAMERAS[stem]
            changed = True
            print(f"  Camera details: {fname} -> {entry['camera']}")
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
