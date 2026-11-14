"""Кімната для «примірки» кольору: сірий шар стін з альфа-маскою + тестовий композит."""
# Usage: python3 make_room_walls.py <room.jpg> <out_dir> <test_sheet.jpg> room_polys.txt   (needs pillow, numpy)
import sys, os, site
sys.path.append(site.getusersitepackages())
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
src, outdir, test = sys.argv[1], sys.argv[2], sys.argv[3]
im = Image.open(src).convert('RGB'); W, H = im.size
S = 4
m = Image.new('L', (W * S, H * S), 0); d = ImageDraw.Draw(m)
POLYS = eval(open(sys.argv[4]).read())
for poly in POLYS: d.polygon([(x * S, y * S) for x, y in poly], fill=255)
m = m.resize((W, H), Image.LANCZOS).filter(ImageFilter.GaussianBlur(.6))
a = np.asarray(im, dtype=np.float32)
lum = a @ np.array([.299, .587, .114], dtype=np.float32)
mk = np.asarray(m, dtype=np.float32) / 255
ref = np.percentile(lum[mk > .9], 82)
g = np.clip(lum * (240 / ref), 0, 255)
rgba = np.dstack([g, g, g, mk * 255]).astype(np.uint8)
os.makedirs(outdir, exist_ok=True)
Image.fromarray(rgba, 'RGBA').save(os.path.join(outdir, 'room-walls.webp'), 'WEBP', quality=88, method=6)
im.save(os.path.join(outdir, 'room.webp'), 'WEBP', quality=84, method=6)
# тест: кілька кольорів
cols = [(201, 122, 92), (60, 84, 110), (195, 207, 179), (244, 241, 232)]
sheet = Image.new('RGB', (W, H * 2 // 1), (0, 0, 0)); tiles = []
for c in cols:
    col = np.array(c, dtype=np.float32) / 255
    out = a * (1 - mk[..., None]) + (g[..., None] * col) * mk[..., None]
    tiles.append(Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).resize((W // 2, H // 2)))
sheet = Image.new('RGB', (W, H)); [sheet.paste(t, ((i % 2) * (W // 2), (i // 2) * (H // 2))) for i, t in enumerate(tiles)]
sheet.save(test, quality=88); print('ref', ref, [os.path.getsize(os.path.join(outdir, f)) // 1024 for f in ('room.webp', 'room-walls.webp')])
