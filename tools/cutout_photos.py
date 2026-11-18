# -*- coding: utf-8 -*-
"""Вирізає товар із фото на єдиному фоні (--c-photo, 241 242 237) і зберігає WebP із прозорістю.

Навіщо: на банері марки відра стоять поверх кольорового мотиву. Звичайне фото має світлий непрозорий фон,
тому мотив або ховається за квадратом фото, або просвічує крізь білі частини товару.

Як працює: від країв кадру заливає все, що близьке до кольору фону; де різниця більша за поріг, заливка
зупиняється — це контур товару. Край пом'якшується, тінь під товаром лишається напівпрозорою.

Запуск:  python3 tools/cutout_photos.py assets/img front-acr front-mat ...
Результат: assets/img/<назва>-cut.webp. Перевірте очима на кольоровому фоні: білий товар на світлому фоні
може «протекти», тоді підніміть поріг STOP або дайте фото з виразнішим контуром.
"""
import sys
from collections import deque
from PIL import Image, ImageFilter

BG = (241, 242, 237)
PASS = 9      # різниця з фоном, до якої піксель вважається фоном
SOFT = 26     # до цієї різниці край напівпрозорий (тінь, згладжування)


def cut(src, dst):
    im = Image.open(src).convert('RGB')
    w, h = im.size
    px = im.load()
    dist = [[max(abs(px[x, y][0] - BG[0]), abs(px[x, y][1] - BG[1]), abs(px[x, y][2] - BG[2])) for x in range(w)] for y in range(h)]
    # заливка від країв по «майже фону»: 0 — товар, 1 — фон, 2 — м'який край (тінь)
    mark = [[0] * w for _ in range(h)]
    q = deque()
    for x in range(w):
        q.append((x, 0)); q.append((x, h - 1))
    for y in range(h):
        q.append((0, y)); q.append((w - 1, y))
    while q:
        x, y = q.popleft()
        if x < 0 or y < 0 or x >= w or y >= h or mark[y][x]:
            continue
        d = dist[y][x]
        if d > SOFT:
            continue
        mark[y][x] = 1 if d <= PASS else 2
        if d <= PASS:
            q.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
    alpha = Image.new('L', (w, h), 255)
    ap = alpha.load()
    for y in range(h):
        row, drow = mark[y], dist[y]
        for x in range(w):
            if row[x] == 1:
                ap[x, y] = 0
            elif row[x] == 2:
                ap[x, y] = int(255 * (drow[x] - PASS) / (SOFT - PASS))
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.6))
    out = im.convert('RGBA')
    out.putalpha(alpha)
    out.save(dst, 'WEBP', quality=90, method=6)
    opaque = sum(1 for v in alpha.getdata() if v > 200)
    print('%s → %s, товар займає %d %% кадру' % (src, dst, round(100 * opaque / (w * h))))


if __name__ == '__main__':
    folder, names = sys.argv[1], sys.argv[2:]
    for n in names:
        cut('%s/%s.webp' % (folder, n), '%s/%s-cut.webp' % (folder, n))
