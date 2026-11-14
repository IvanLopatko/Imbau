#!/usr/bin/env python3
"""IM BAU — підготовка фото товарів до єдиного фону.

Навіщо: фото від різних постачальників зняті на різному фоні (білий, сірий, теплий беж).
У картках це дає «квадратики» різного тону. Скрипт зводить усі фото до кольору панелі
--c-photo (#F1F2EC) і розтушовує краї кадру точно в цей колір. Після цього фото можна
класти на панель будь-яких пропорцій (object-fit: contain) без видимого шва.

Підходить для предметних фото на світлому однотонному фоні. Для фото на темному чи
строкатому фоні не годиться — такі треба обтравлювати вручну.

Запуск:
    python3 normalize_photos.py <папка_з_оригіналами> <папка_результату>

Потрібні бібліотеки: pip install pillow numpy
На вході JPG/PNG/WebP (бажано квадратні, від 1000 px). На виході WebP 720×720.
"""
import os
import sys

import numpy as np
from PIL import Image

TARGET = np.array([241, 242, 236], dtype=np.float32)  # --c-photo #F1F2EC
SIZE = 720          # сторона результату, px
CORNER = 0.06       # частка кадру, за якою оцінюємо фон у кутах
FEATHER = 0.07      # ширина розтушовки країв (частка кадру)


def normalize(path: str) -> Image.Image:
    im = Image.open(path).convert("RGB")
    a = np.asarray(im, dtype=np.float32)
    h, w, _ = a.shape
    p = max(4, int(min(w, h) * CORNER))

    # 1. Колір фону в чотирьох кутах → плавне поле освітлення (білінійна інтерполяція)
    med = lambda ys, xs: np.median(a[ys, xs].reshape(-1, 3), axis=0)
    tl, tr = med(slice(0, p), slice(0, p)), med(slice(0, p), slice(w - p, w))
    bl, br = med(slice(h - p, h), slice(0, p)), med(slice(h - p, h), slice(w - p, w))
    yy = np.linspace(0, 1, h, dtype=np.float32)[:, None, None]
    xx = np.linspace(0, 1, w, dtype=np.float32)[None, :, None]
    field = (tl * (1 - xx) + tr * xx) * (1 - yy) + (bl * (1 - xx) + br * xx) * yy

    # 2. Ділимо на поле і множимо на цільовий колір: фон стає рівним і однакового тону
    out = a * (TARGET / np.maximum(field, 1))

    # 3. Краї кадру плавно зводимо точно в цільовий колір
    d = np.minimum(np.minimum(xx, 1 - xx), np.minimum(yy, 1 - yy))
    alpha = np.clip(d / FEATHER, 0, 1)
    alpha = alpha * alpha * (3 - 2 * alpha)
    out = out * alpha + TARGET * (1 - alpha)

    res = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))
    if w != h:  # неквадратне фото доповнюємо полями кольору панелі
        side = max(w, h)
        canvas = Image.new("RGB", (side, side), tuple(int(c) for c in TARGET))
        canvas.paste(res, ((side - w) // 2, (side - h) // 2))
        res = canvas
    return res.resize((SIZE, SIZE), Image.LANCZOS)


def main() -> None:
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    src, out = sys.argv[1], sys.argv[2]
    os.makedirs(out, exist_ok=True)
    names = sorted(f for f in os.listdir(src) if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp")))
    if not names:
        sys.exit(f"У папці {src} немає зображень JPG/PNG/WebP")
    for name in names:
        target = os.path.join(out, os.path.splitext(name)[0] + ".webp")
        normalize(os.path.join(src, name)).save(target, "WEBP", quality=86, method=6)
        print(f"{name} → {target} ({os.path.getsize(target) // 1024} КБ)")


if __name__ == "__main__":
    main()
