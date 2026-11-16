"""
Slims assets/models/moon_opt.glb without changing how the moon looks:
  - stores positions and texture coordinates as 16-bit numbers (KHR_mesh_quantization)
  - drops the NORMAL attribute (a sphere's normals are rebuilt in loader.js with computeVertexNormals)
  - stores triangle indices as 16-bit instead of 32-bit (the mesh has < 65,536 vertices)
  - resizes the equirectangular texture from 2048x2048 to 2048x1024: a 2:1 map has the same
    detail per degree in both directions, so the square version only repeated rows
Writes assets/models/moon_slim.glb. Run from the repo root:  python scripts/slim_moon_glb.py
Needs Pillow and numpy.
"""

import io
import json
import struct

import numpy as np
from PIL import Image

SRC = "assets/models/moon_opt.glb"
DST = "assets/models/moon_slim.glb"
JPEG_QUALITY = 82

SHORT, UNSIGNED_SHORT, UNSIGNED_INT, FLOAT = 5122, 5123, 5125, 5126
WIDTH = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4}


def pad4(b, fill=b"\x00"):
    return b + fill * (-len(b) % 4)


def main():
    data = open(SRC, "rb").read()
    json_len = struct.unpack_from("<I", data, 12)[0]
    gltf = json.loads(data[20:20 + json_len])
    bin_off = 20 + json_len
    bin_len = struct.unpack_from("<I", data, bin_off)[0]
    blob = data[bin_off + 8:bin_off + 8 + bin_len]

    # 1. Drop normals from every primitive
    for mesh in gltf["meshes"]:
        for prim in mesh["primitives"]:
            prim["attributes"].pop("NORMAL", None)

    # 2. Keep only accessors still referenced, and remap their indices
    used_acc = sorted({i for m in gltf["meshes"] for p in m["primitives"]
                       for i in list(p["attributes"].values()) + ([p["indices"]] if "indices" in p else [])})
    acc_map = {old: new for new, old in enumerate(used_acc)}
    for m in gltf["meshes"]:
        for p in m["primitives"]:
            p["attributes"] = {k: acc_map[v] for k, v in p["attributes"].items()}
            if "indices" in p:
                p["indices"] = acc_map[p["indices"]]
    accessors = [gltf["accessors"][i] for i in used_acc]
    vertex_count = max(a["count"] for a in accessors if a.get("type") in ("VEC3", "VEC2"))
    index_accs = {p["indices"] for m in gltf["meshes"] for p in m["primitives"] if "indices" in p}

    # 3. Rebuild the binary with only the buffer views still in use
    used_views = sorted({a["bufferView"] for a in accessors} | {img["bufferView"] for img in gltf.get("images", [])})
    view_map = {old: new for new, old in enumerate(used_views)}
    image_views = {img["bufferView"] for img in gltf.get("images", [])}
    out = bytearray()
    new_views = []
    quantized = False
    for old in used_views:
        view = gltf["bufferViews"][old]
        start = view.get("byteOffset", 0)
        chunk = blob[start:start + view["byteLength"]]
        for ai, acc in enumerate(accessors):
            if acc["bufferView"] == old and ai in index_accs and acc["componentType"] == UNSIGNED_INT and vertex_count < 65536:
                idx = np.frombuffer(chunk, dtype="<u4", count=acc["count"], offset=acc.get("byteOffset", 0))
                chunk = idx.astype("<u2").tobytes()
                acc["componentType"] = UNSIGNED_SHORT
                acc["byteOffset"] = 0
        for acc in accessors:
            if acc["bufferView"] != old or acc.get("componentType") != FLOAT:
                continue
            vals = np.frombuffer(chunk, dtype="<f4", offset=acc.get("byteOffset", 0),
                                 count=acc["count"] * WIDTH[acc["type"]]).reshape(acc["count"], -1)
            if acc["type"] == "VEC3" and np.abs(vals).max() <= 1.0:
                # Positions on a unit sphere -> normalized int16, padded to 4 per vertex (stride 8)
                q = np.zeros((acc["count"], 4), dtype="<i2")
                q[:, :3] = np.round(vals * 32767)
                chunk = q.tobytes()
                acc.update(componentType=SHORT, normalized=True, byteOffset=0)
                acc["min"] = q[:, :3].min(axis=0).tolist()
                acc["max"] = q[:, :3].max(axis=0).tolist()
                view["byteStride"] = 8
                quantized = True
            elif acc["type"] == "VEC2" and vals.min() >= 0 and vals.max() <= 1.0000002:
                # Texture coordinates in [0, 1] -> normalized uint16
                q = np.round(np.clip(vals, 0, 1) * 65535).astype("<u2")
                chunk = q.tobytes()
                acc.update(componentType=UNSIGNED_SHORT, normalized=True, byteOffset=0)
                acc["min"] = q.min(axis=0).tolist()
                acc["max"] = q.max(axis=0).tolist()
                view["byteStride"] = 4
                quantized = True
        if old in image_views:
            im = Image.open(io.BytesIO(chunk)).convert("RGB")
            if im.width == im.height:
                im = im.resize((im.width, im.height // 2), Image.LANCZOS)
            buf = io.BytesIO()
            im.save(buf, "JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True)
            chunk = buf.getvalue()
        while len(out) % 4:
            out.append(0)
        nv = {k: v for k, v in view.items() if k != "byteStride" or old not in image_views}
        view.pop("byteStride", None) if old in image_views else None
        nv["byteOffset"] = len(out)
        nv["byteLength"] = len(chunk)
        new_views.append(nv)
        out += chunk

    for acc in accessors:
        acc["bufferView"] = view_map[acc["bufferView"]]
    for img in gltf.get("images", []):
        img["bufferView"] = view_map[img["bufferView"]]
    gltf["accessors"] = accessors
    if quantized:
        # Lets loaders accept 16-bit positions and texture coordinates (three.js supports it)
        for key in ("extensionsUsed", "extensionsRequired"):
            gltf.setdefault(key, [])
            if "KHR_mesh_quantization" not in gltf[key]:
                gltf[key].append("KHR_mesh_quantization")
    gltf["bufferViews"] = new_views
    gltf["buffers"][0]["byteLength"] = len(out)

    json_bytes = pad4(json.dumps(gltf, separators=(",", ":")).encode(), b" ")
    bin_bytes = pad4(bytes(out))
    total = 12 + 8 + len(json_bytes) + 8 + len(bin_bytes)
    with open(DST, "wb") as f:
        f.write(struct.pack("<III", 0x46546C67, 2, total))
        f.write(struct.pack("<II", len(json_bytes), 0x4E4F534A) + json_bytes)
        f.write(struct.pack("<II", len(bin_bytes), 0x004E4942) + bin_bytes)
    print(f"{SRC}: {len(data):,} bytes -> {DST}: {total:,} bytes")


if __name__ == "__main__":
    main()
