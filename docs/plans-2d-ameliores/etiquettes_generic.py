import json
import sys
from PIL import Image, ImageDraw, ImageFont

# usage: etiquettes_generic.py image_in image_out labels.json
src, dst, cfg = sys.argv[1], sys.argv[2], sys.argv[3]
img = Image.open(src).convert("RGB")
d = ImageDraw.Draw(img)

FONT = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
BLACK = (15, 15, 15)
RED = (214, 25, 25)

with open(cfg, encoding="utf-8") as fh:
    labels = json.load(fh)

for item in labels:
    cx, cy, lines, size = item["x"], item["y"], item["lines"], item["size"]
    f = ImageFont.truetype(FONT, size)
    lh = int(size * 1.25)
    y = cy - (lh * len(lines)) // 2
    nb = item.get("nblack", 1)
    for i, txt in enumerate(lines):
        color = BLACK if i < nb else RED
        w = d.textlength(txt, font=f)
        d.text((cx - w / 2, y), txt, font=f, fill=color)
        y += lh

img.save(dst)
print("ok", dst)
