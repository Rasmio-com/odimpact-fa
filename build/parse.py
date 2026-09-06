# -*- coding: utf-8 -*-
"""استخراج ساختاریافته‌ی متن و تصاویر از فایل‌های ورد مطالعات موردی."""
import io, json, os, re, sys, zipfile
from collections import Counter
from lxml import etree
from PIL import Image

import catalog

W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
MC = '{http://schemas.openxmlformats.org/markup-compatibility/2006}'
A = '{http://schemas.openxmlformats.org/drawingml/2006/main}'
R = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}'

SRC = "/Users/khani/Documents/Claude/Projects/OpenData/اثرات داده باز"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMGDIR = os.path.join(ROOT, "site", "assets", "img", "figures")

PERSIAN_DIGITS = str.maketrans("0123456789", "۰۱۲۳۴۵۶۷۸۹")


def in_box(node, stop):
    a = node.getparent()
    while a is not None and a is not stop:
        t = a.tag
        if t.endswith('}txbxContent') or t == MC + 'Fallback' or t.endswith('}pict'):
            return True
        a = a.getparent()
    return False


def clean(s):
    s = s.replace('​', '').replace('﻿', '')
    s = s.replace('ي', 'ی').replace('ك', 'ک')
    s = re.sub(r'[ \t ]+', ' ', s)
    s = re.sub(r'\s*([،؛])\s*', r'\1 ', s)
    s = re.sub(r'\(\s*‏?', '(', s).replace('‏)', ')')
    s = re.sub(r'\s+([.،؛:!؟])', r'\1', s)
    return s.strip()


def fa_digits(s):
    """ارقام لاتین را فارسی می‌کند، مگر آن‌که چسبیده به حروف لاتین یا داخل نشانی باشند."""
    out = []
    i = 0
    urls = [m.span() for m in re.finditer(r'(https?://|www\.)\S+', s)]
    while i < len(s):
        if not s[i].isdigit():
            out.append(s[i]); i += 1; continue
        j = i
        while j < len(s) and (s[j].isdigit() or (s[j] in ',.٬' and j + 1 < len(s) and s[j+1].isdigit())):
            j += 1
        before = s[i-1] if i else ''
        after = s[j] if j < len(s) else ''
        inurl = any(a <= i < b for a, b in urls)
        latin = re.match(r'[A-Za-z]', before) or re.match(r'[A-Za-z]', after)
        chunk = s[i:j]
        out.append(chunk if (inurl or latin) else chunk.translate(PERSIAN_DIGITS).replace(',', '٬'))
        i = j
    return ''.join(out)


def read_docx(path):
    z = zipfile.ZipFile(path)
    rels = {r.get('Id'): r.get('Target')
            for r in etree.fromstring(z.read('word/_rels/document.xml.rels'))}
    body = etree.fromstring(z.read('word/document.xml')).find(W + 'body')
    items = []
    for p in body.iter(W + 'p'):
        if in_box(p, body):
            continue
        runs, imgs = [], []
        for r in p.iter(W + 'r'):
            if in_box(r, p):
                continue
            txt = ''.join((t.text or '') for t in r.iter(W + 't') if not in_box(t, r))
            rpr = r.find(W + 'rPr')

            def flag(tag):
                if rpr is None:
                    return False
                e = rpr.find(W + tag)
                return e is not None and e.get(W + 'val') not in ('0', 'false', 'none')

            sz = int(rpr.find(W + 'sz').get(W + 'val')) if (
                rpr is not None and rpr.find(W + 'sz') is not None) else None
            if txt:
                runs.append({'t': txt, 'b': flag('b'), 'i': flag('i'), 'sz': sz})
            for blip in r.iter(A + 'blip'):
                if in_box(blip, r):
                    continue
                rid = blip.get(R + 'embed')
                if rid in rels:
                    imgs.append(rels[rid])
        for im in imgs:
            items.append({'k': 'img', 'src': im})
        text = clean(''.join(x['t'] for x in runs))
        if not text:
            continue
        szs = [x['sz'] for x in runs if x['t'].strip() and x['sz']]
        ppr = p.find(W + 'pPr')
        items.append({
            'k': 'p', 't': text,
            'b': bool(runs) and all(x['b'] for x in runs if x['t'].strip()),
            'sz': max(szs) if szs else None,
            'list': ppr is not None and ppr.find(W + 'numPr') is not None,
        })
    return items, z


H2_TITLES = {
    'پیشینه و زمینه', 'شرح پروژه', 'توصیف و آغاز پروژه', 'تاثیر', 'تأثیر',
    'ریسک‌ها', 'خطرات', 'چالش‌ها', 'درس‌های آموخته شده',
    'درس‌های آموخته‌شده', 'نتیجه‌گیری', 'نگاهی به آینده',
    'نگاهی به مسائل پیش رو', 'منابع داده', 'خلاصه مطلب',
}

NOISE = re.compile(r'^(www\.odimpact\.org|تاثیر داده|داده ?های? باز برای|داده باز برای توسعه|'
                   r'GOVLAB|The GovLab|odimpact)', re.I)
FIGCAP = re.compile(r'^(شکل|جدول|نمودار|تصویر)\s*[۰-۹0-9]')


def is_locator_map(im):
    """نقشه‌ی مکان‌نمای کشور: زمینه‌ی سفید، خشکی خاکستری و یک کشور رنگی."""
    if not (1.35 < im.width / im.height < 2.9):
        return False
    small = im.resize((240, max(1, round(240 * im.height / im.width))))
    px = list(small.convert('RGB').getdata())
    pale = sum(1 for r, g, b in px if min(r, g, b) > 196 and max(r, g, b) - min(r, g, b) < 26)
    if pale / len(px) < 0.93:
        return False
    colors = {(r >> 5, g >> 5, b >> 5) for r, g, b in px}
    hues = {h >> 4 for h, s_, v in small.convert('HSV').getdata() if s_ > 60 and v > 60}
    return len(colors) <= 45 and len(hues) <= 5


def stencil(im):
    """نقشه را به شبح شفاف تبدیل می‌کند: خشکی سفید، پس‌زمینه شفاف، کشور رنگی."""
    im = im.convert('RGB')
    out = Image.new('RGBA', im.size, (0, 0, 0, 0))
    src, dst = im.load(), out.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b = src[x, y]
            lo, hi = min(r, g, b), max(r, g, b)
            if lo > 244 and hi - lo < 12:            # پس‌زمینه
                continue
            if hi - lo > 34:                          # کشور برجسته
                dst[x, y] = (r, g, b, 255)
            else:                                     # خشکی
                a = min(255, int((255 - lo) * 3.2) + 96)
                dst[x, y] = (255, 255, 255, a)
    return out


def save_figure(z, src, slug, n):
    data = z.read('word/' + src.lstrip('./'))
    ext = os.path.splitext(src)[1].lower()
    if ext in ('.emf', '.wmf'):
        return None
    try:
        im = Image.open(io.BytesIO(data))
    except Exception:
        return None
    if im.width < 220 or im.height < 120:
        return None
    im = im.convert('RGB')
    if is_locator_map(im):
        os.makedirs(os.path.join(IMGDIR, slug), exist_ok=True)
        m = im.resize((900, round(im.height * 900 / im.width)), Image.LANCZOS) if im.width > 900 else im
        stencil(m).save(os.path.join(IMGDIR, slug, 'map.png'), 'PNG', optimize=True)
        return 'MAP', f"assets/img/figures/{slug}/map.png", 0
    if im.width > 1280:
        im = im.resize((1280, round(im.height * 1280 / im.width)), Image.LANCZOS)
    os.makedirs(os.path.join(IMGDIR, slug), exist_ok=True)
    name = f"fig-{n}.jpg"
    im.save(os.path.join(IMGDIR, slug, name), 'JPEG', quality=82, optimize=True, progressive=True)
    return f"assets/img/figures/{slug}/{name}", im.width, im.height


def parse_case(meta):
    fname, slug, title, subtitle, title_en, country, cat, year = meta
    items, z = read_docx(os.path.join(SRC, fname))
    ps = [i for i in items if i['k'] == 'p']

    # اندازه‌ی قلم متن اصلی
    body_sz = Counter(p['sz'] for p in ps if p['sz'] and not p['b'] and len(p['t']) > 140)
    body_sz = body_sz.most_common(1)[0][0] if body_sz else 24

    # شروع متن: عنوان «خلاصه مطلب»
    start = next((n for n, it in enumerate(items)
                  if it['k'] == 'p' and it['t'].startswith('خلاصه')), None)
    if start is None:
        start = next(n for n, it in enumerate(items)
                     if it['k'] == 'p' and len(it['t']) > 200)

    authors, date = '', ''
    for it in items[:start]:
        if it['k'] != 'p':
            continue
        if not authors and re.match(r'^/?\s*نوشته', it['t']):
            authors = re.sub(r'^/?\s*نوشته[\s‌]*(شده)?[\s‌]*(توسط)?\s*', '', it['t']).strip()
            authors = re.sub(r'\s*,\s*', ', ', authors)
        if not date and re.search(r'(ژانویه|جولای|ژوئیه|فوریه|مارس)', it['t']):
            date = it['t'].strip()

    blocks, figno, seen, locator = [], 0, set(), [None]
    for it in items[start + 1:]:
        if it['k'] == 'img':
            figno += 1
            got = save_figure(z, it['src'], slug, figno)
            figno -= 1
            if got and got[0] == 'MAP':
                locator[0] = got[1]
            elif got:
                figno += 1
                blocks.append({'type': 'img', 'src': got[0], 'w': got[1], 'h': got[2]})
            continue
        t = it['t']
        if len(re.sub(r'[\W\d_]+', '', t, flags=re.UNICODE)) < 3:
            continue
        if NOISE.match(t) and len(t) < 120:
            continue
        if len(t) < 60 and t in seen:
            continue
        if len(t) < 120:
            seen.add(t)
        t = fa_digits(t)
        if it['list']:
            blocks.append({'type': 'li', 'text': t})
        elif FIGCAP.match(t) and len(t) < 200:
            if blocks and blocks[-1]['type'] == 'img':
                blocks[-1]['caption'] = t
            else:
                blocks.append({'type': 'caption', 'text': t})
        elif it['b'] and t.strip('،:؛ ') in H2_TITLES:
            blocks.append({'type': 'h2', 'text': t.strip('،:؛ ')})
        elif it['b'] and it['sz'] and it['sz'] >= body_sz + 4:
            blocks.append({'type': 'h2', 'text': t})
        elif it['b'] and re.match(r'^[۰-۹0-9]+\s*[.\-–)]', t) and len(t) < 120:
            blocks.append({'type': 'h2', 'text': t})
        elif it['b'] and len(t) < 130:
            blocks.append({'type': 'h3', 'text': t})
        else:
            blocks.append({'type': 'p', 'text': t})

    # ادغام آیتم‌های فهرست
    merged = []
    for b in blocks:
        if b['type'] == 'li' and merged and merged[-1]['type'] == 'ul':
            merged[-1]['items'].append(b['text'])
        elif b['type'] == 'li':
            merged.append({'type': 'ul', 'items': [b['text']]})
        else:
            merged.append(b)

    # خلاصه و نکات کلیدی از ابتدای متن جدا می‌شوند
    summary, key_points = [], []
    idx = 0
    while idx < len(merged) and merged[idx]['type'] == 'p':
        summary.append(merged[idx]['text']); idx += 1
    if idx < len(merged) and merged[idx]['type'] == 'ul':
        key_points = merged[idx]['items']; idx += 1
    body = merged[idx:]
    while body and body[0]['type'] not in ('h2', 'h3', 'p', 'ul', 'img'):
        body = body[1:]

    words = sum(len(b.get('text', '').split()) for b in body) + \
        sum(len(x.split()) for b in body if b['type'] == 'ul' for x in b['items'])
    words += sum(len(s.split()) for s in summary)

    return {
        'slug': slug, 'title': title, 'subtitle': subtitle, 'title_en': title_en,
        'country': country, 'category': cat, 'year': year,
        'authors': authors, 'date': fa_digits(date), 'map': locator[0],
        'summary': [fa_digits(s) for s in summary],
        'key_points': [fa_digits(k) for k in key_points],
        'body': body,
        'words': words,
        'read_minutes': max(2, round(words / 220)),
        'figures': sum(1 for b in body if b['type'] == 'img'),
    }


def main():
    out = []
    for meta in catalog.CASES:
        c = parse_case(meta)
        out.append(c)
        print(f"{c['slug']:36s} {c['words']:6d} واژه  {c['figures']} شکل  "
              f"{len(c['key_points'])} نکته  {len(c['body'])} بلوک")
    os.makedirs(os.path.join(ROOT, 'data'), exist_ok=True)
    with open(os.path.join(ROOT, 'data', 'cases.json'), 'w', encoding='utf8') as f:
        json.dump({'categories': catalog.CATEGORIES, 'cases': out}, f, ensure_ascii=False, indent=1)
    print('\nمجموع واژه‌ها:', sum(c['words'] for c in out))


if __name__ == '__main__':
    main()
