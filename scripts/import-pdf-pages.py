"""Импорт PDF-конспекта «по страницам»: каждая тема — набор картинок страниц (формулы остаются точными).

    pip install pymupdf
    python scripts/import-pdf-pages.py scripts/specs/math-practicum.json

Темы находятся по заголовкам вида «§ 1.1. Название» и «Решения 1.1 (…)». Результат: content/<id>.json
и картинки в public/lessons/<id>/.
"""
import io
import json
import os
import re
import sys

import fitz  # PyMuPDF

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
spec_path = os.path.abspath(sys.argv[1])
spec = json.load(open(spec_path, encoding="utf-8"))

src = spec["src"]
if not os.path.exists(src):
    # имя файла может быть в другой форме Unicode
    import unicodedata

    d, name = os.path.split(src)
    want = unicodedata.normalize("NFC", name)
    for f in os.listdir(d):
        if unicodedata.normalize("NFC", f) == want:
            src = os.path.join(d, f)
            break
doc = fitz.open(src)
mid = spec["meta"]["id"]
zoom = spec.get("zoom", 2.0)
x0, x1 = spec.get("crop", [0, doc[0].rect.width])
head_re = re.compile(spec["headingRegex"])
start_page = spec.get("startPage", 2)

# --- названия тем из оглавления (первая страница): убираем отточие и номер страницы
toc = {}
for line in doc[0].get_text().split("\n"):
    m = re.match(r"^(§ \d\.\d+\.|Решения \d\.\d+ \(.*?\))\s*(.*?)(?:\s*[. ]{3,}\s*\d+)?$", line.strip())
    if m:
        toc[m.group(1).strip()] = (m.group(2) or "").strip()


def title_for(key: str) -> str:
    if key.startswith("§"):
        t = f"{key} {toc.get(key, '')}".strip()
        t = re.sub(r"(\s*\.){3,}.*$", "", t)
        return re.sub(r"\s+\d+$", "", t).rstrip(".")
    m = re.match(r"Решения (\d\.\d+) \((.*)\)", key)
    return f"Решения {m.group(1)}: {m.group(2)}" if m else key


# --- заголовки по страницам: (страница, y, ключ)
heads = []
for pno in range(start_page - 1, len(doc)):
    page = doc[pno]
    for b in page.get_text("blocks"):
        for line in b[4].split("\n"):
            m = head_re.match(line.strip())
            if m:
                key = m.group(1).strip()
                if key.startswith("Решения"):
                    key = re.sub(r"\s+", " ", line.strip())
                    key = re.match(r"Решения \d\.\d+ \(.*?\)", key).group(0) if re.match(r"Решения \d\.\d+ \(.*?\)", key) else key
                heads.append((pno + 1, b[1], key))
                break
# уберём повторы одного ключа (оставим первое вхождение) и сохраним порядок
seen, uniq = set(), []
for h in heads:
    if h[2] in seen:
        continue
    seen.add(h[2])
    uniq.append(h)
heads = uniq

# --- страницы темы: от страницы заголовка до страницы следующего (включая её, если заголовок не в самом верху)
topics = []
for i, (pg, y, key) in enumerate(heads):
    if i + 1 < len(heads):
        npg, ny, _ = heads[i + 1]
        end = npg if (npg > pg and ny > 140) else max(pg, npg - 1) if npg > pg else pg
    else:
        end = spec.get("lastPage", len(doc))
    topics.append({"key": key, "pages": list(range(pg, max(pg, end) + 1))})

if spec.get("intro"):
    topics.insert(0, {"key": None, "title": spec["intro"]["title"], "pages": spec["intro"]["pages"]})

# --- картинки страниц
out_dir = os.path.join(ROOT, "public", "lessons", mid)
os.makedirs(out_dir, exist_ok=True)
needed = sorted({p for t in topics for p in t["pages"]})
for p in needed:
    page = doc[p - 1]
    boxes = [fitz.Rect(b[:4]) for b in page.get_text("blocks")]
    boxes += [fitz.Rect(d["rect"]) for d in page.get_drawings()]
    boxes += [fitz.Rect(page.get_image_bbox(im)) for im in page.get_images(full=True) if page.get_image_rects(im[0])]
    ys = [b for b in boxes if b.y1 > 28 and b.y0 < page.rect.height - 28]
    top = max(0, (min(b.y0 for b in ys) if ys else 0) - 12)
    bottom = min(page.rect.height, (max(b.y1 for b in ys) if ys else page.rect.height) + 12)
    clip = fitz.Rect(x0, top, x1, bottom)
    pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), clip=clip, alpha=False)
    pix.save(os.path.join(out_dir, f"p{p:02d}.png"))

# --- группы по префиксу ключа
groups_spec = spec["groups"]


def group_of(key):
    if key is None:
        return None
    for g in groups_spec:
        if re.match(g["pattern"], key):
            return g["id"]
    return None


items = []
for i, t in enumerate(topics, 1):
    text = " ".join(doc[p - 1].get_text() for p in t["pages"])
    items.append(
        {
            "id": f"{mid}-{i:03d}",
            "num": i,
            "title": t.get("title") or title_for(t["key"]),
            "group": group_of(t["key"]) or spec.get("introGroup"),
            "kind": "pages",
            "pages": [f"lessons/{mid}/p{p:02d}.png" for p in t["pages"]],
            "search": re.sub(r"\s+", " ", text)[:6000],
            "updatedAt": spec.get("updatedAt"),
        }
    )

out = {"schemaVersion": 2, **spec["meta"], "groups": [{"id": g["id"], "title": g["title"]} for g in groups_spec], "items": items}
if spec.get("introGroup") is None:
    pass
json.dump(out, open(os.path.join(ROOT, "content", f"{mid}.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print(f"OK {mid}: тем — {len(items)}, страниц — {len(needed)}")
for it in items:
    print(" ", it["num"], it["group"], it["title"], [p[-6:-4] for p in it["pages"]])
