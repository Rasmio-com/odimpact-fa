# -*- coding: utf-8 -*-
"""استخراج گزارش‌های فارسی از فایل‌های ورد به data/reports.json

برخلاف parse.py که ناچار بود تیترها را از روی بولد و اندازه‌ی قلم حدس بزند،
این اسناد سبک‌های Heading واقعی دارند، پس طبقه‌بندی مستقیم است.
"""
import io, json, os, re, sys, zipfile
from lxml import etree
from PIL import Image

import catalog_reports
from parse import clean, fa_digits, in_box, W, A, R

SRC = os.environ.get('ODFA_SRC',
                     '/Users/khani/Documents/Claude/Projects/OpenData/odimpact-fa/داده- باز')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMGDIR = os.path.join(ROOT, 'site', 'assets', 'img', 'reports')

HEAD = {'Heading1': 'h2', 'Heading2': 'h3', 'Heading3': 'h4', 'Heading4': 'h4'}
DROP_STYLE = {'Title', 'Subtitle', 'TOCHeading', 'CommentText', 'FootnoteText',
              'Header', 'Footer'}

# غلط‌های تایپی آشکارِ متن اصلی؛ فقط مواردی که یک حرف افتاده یا جابه‌جا شده
TYPOS = {
    'مشاکت': 'مشارکت',        # مشارکت
    'عباتند': 'عبارت‌اند',      # عبارت‌اند
    'یگدیگر': 'یکدیگر',
    'انجا شده': 'انجام شده',
    'پژوهشات': 'پژوهش‌ها',      # جمع عربیِ نادرستِ واژه‌ی فارسی
}

# یادداشت‌های داخلیِ پیش‌نویس که نباید منتشر شوند
INLINE_NOISE = [
    (re.compile(r'\{[^{}]*\}'), ''),                      # {برای طراح: ...}
    (re.compile(r'\s*HYPERLINK\s*"[^"]*"'), ''),          # بقایای فیلد لینک ورد
    (re.compile(r'\s*PAGEREF\s+\S+\s*\\h\s*\d*'), ''),
    (re.compile(r'\s*TOC\s*\\[a-z]\s*(\\[a-z]\s*)*'), ''),
]
# فقط یادداشت‌های گردش‌کارِ داخلی؛ «توجه:»های محتوایی باید بمانند
DROP_PARA = re.compile(
    r'برای طراح'
    r'|ابتدا این مطلب تایید شود'
    r'|جهت ترجمه ارسال'
    r'|^\s*$'
    r'|^(شکل|جدول)\s*$')
FIGCAP = re.compile(r'^\(?\s*(شکل|جدول|نمودار|تصویر|منبع|مأخذ|ماخذ)\b')
# شماره‌گذاری دستیِ ابتدای تیتر: «۱-۲-۱ »، «4-1. »، «3 »
HEADNUM = re.compile(r'^[۰-۹0-9]+([-–.][۰-۹0-9]+)*\s*[.\-–)]?[\s‌]+')


def rels_of(z):
    return {r.get('Id'): r.get('Target')
            for r in etree.fromstring(z.read('word/_rels/document.xml.rels'))}


def save_fig(z, src, slug, n):
    """شکل را با حداکثر عرض ۱۲۸۰ ذخیره می‌کند؛ لوگو و تزئین کوچک را رد می‌کند."""
    try:
        data = z.read('word/' + src.lstrip('./'))
    except KeyError:
        return None
    if os.path.splitext(src)[1].lower() in ('.emf', '.wmf'):
        return None
    try:
        im = Image.open(io.BytesIO(data))
    except Exception:
        return None
    if im.width < 220 or im.height < 120:
        return None
    im = im.convert('RGB')
    if im.width > 1280:
        im = im.resize((1280, round(im.height * 1280 / im.width)), Image.LANCZOS)
    os.makedirs(os.path.join(IMGDIR, slug), exist_ok=True)
    im.save(os.path.join(IMGDIR, slug, f'fig-{n}.jpg'),
            'JPEG', quality=82, optimize=True, progressive=True)
    return f'assets/img/reports/{slug}/fig-{n}.jpg', im.width, im.height


def text_of(node):
    t = ''.join(x.text or '' for x in node.iter(W + 't') if not in_box(x, node))
    for rx, rep in INLINE_NOISE:
        t = rx.sub(rep, t)
    t = clean(t)
    for bad, good in TYPOS.items():
        t = t.replace(bad, good)
    # گیومه‌ی مستقیم به گیومه‌ی فارسی، جز وقتی داخلش فقط لاتین است
    t = re.sub(r'"([^"\n]{1,200})"',
               lambda m: m.group(0) if not re.search(r'[\u0600-\u06FF]', m.group(1))
               else '«' + m.group(1).strip() + '»', t)
    t = t.replace('"', '')
    # گیومه‌ای که در متن اصلی بسته نشده، در پایان همان پاراگراف بسته می‌شود
    if t.count('«') == t.count('»') + 1:
        t = (t[:-1] + '».' if t.endswith('.') else t + '»')
    return t


def para(p):
    """(نوع، متن) برای یک پاراگراف؛ نوع None یعنی دور ریخته شود."""
    ppr = p.find(W + 'pPr')
    st = ppr.find(W + 'pStyle') if ppr is not None else None
    style = st.get(W + 'val') if st is not None else ''
    if style in DROP_STYLE or style.startswith('TOC'):
        return None, ''
    t = text_of(p)
    if not t or DROP_PARA.search(t):
        return None, ''
    if style in HEAD:
        return HEAD[style], HEADNUM.sub('', t).strip('،؛: ')
    listed = ppr is not None and ppr.find(W + 'numPr') is not None
    if listed or re.match(r'^[●•▪·]\s*', t):
        return 'li', re.sub(r'^[●•▪·]\s*', '', t)
    return 'p', t


def cell_blocks(tc):
    out = []
    for p in tc.findall(W + 'p'):
        k, t = para(p)
        if k:
            out.append({'type': 'p' if k in ('li', 'h4') else k, 'text': fa_digits(t)}
                       if k != 'li' else {'type': 'li', 'text': fa_digits(t)})
    return merge_lists(out)


def table_block(tbl):
    rows = []
    for tr in tbl.findall(W + 'tr'):
        cells = [re.sub(r'\s+', ' ', ' '.join(
            text_of(p) for p in tc.findall(W + 'p'))).strip()
            for tc in tr.findall(W + 'tc')]
        if any(c for c in cells):
            rows.append(cells)
    if not rows:
        return None
    if len(rows) == 1 and len(rows[0]) == 1:                  # جعبه‌ی کنارمتن
        blocks = cell_blocks(tbl.find(W + 'tr').find(W + 'tc'))
        return {'type': 'callout', 'blocks': blocks} if blocks else None
    w = max(len(r) for r in rows)
    rows = [r + [''] * (w - len(r)) for r in rows]
    keep = [i for i in range(w) if any(r[i] for r in rows)]
    rows = [[r[i] for i in keep] for r in rows]
    w = len(keep)
    if w == 0:
        return None
    if w == 1:
        blocks = [{'type': 'p', 'text': fa_digits(r[0])} for r in rows if r[0]]
        return {'type': 'callout', 'blocks': blocks} if blocks else None
    rows = [[fa_digits(c) for c in r] for r in rows]
    head, body = [], rows
    if all(len(c) < 80 for c in rows[0]) and sum(1 for c in rows[0] if c) >= w * 0.7:
        head, body = rows[0], rows[1:]
    return {'type': 'table', 'head': head, 'rows': body} if body else None


def merge_lists(blocks):
    out = []
    for b in blocks:
        if b['type'] == 'li' and out and out[-1]['type'] == 'ul':
            out[-1]['items'].append(b['text'])
        elif b['type'] == 'li':
            out.append({'type': 'ul', 'items': [b['text']]})
        else:
            out.append(b)
    return out


def parse_report(meta, dropped):
    path = os.path.join(SRC, meta['file'])
    z = zipfile.ZipFile(path)
    rels = rels_of(z)
    body = etree.fromstring(z.read('word/document.xml')).find(W + 'body')

    raw, figno = [], 0
    for node in body:
        if node.tag == W + 'tbl':
            tb = table_block(node)
            if tb:
                raw.append(tb)
            for blip in node.iter(A + 'blip'):
                tgt = rels.get(blip.get(R + 'embed'))
                if tgt:
                    got = save_fig(z, tgt, meta['slug'], figno + 1)
                    if got:
                        figno += 1
                        raw.append({'type': 'img', 'src': got[0], 'w': got[1], 'h': got[2]})
            continue
        if node.tag != W + 'p' or in_box(node, body):
            continue
        for blip in node.iter(A + 'blip'):
            if in_box(blip, node):
                continue
            tgt = rels.get(blip.get(R + 'embed'))
            if tgt:
                got = save_fig(z, tgt, meta['slug'], figno + 1)
                if got:
                    figno += 1
                    raw.append({'type': 'img', 'src': got[0], 'w': got[1], 'h': got[2]})
        k, t = para(node)
        if not k:
            txt = text_of(node)
            if txt and len(txt) > 30:
                dropped.append((meta['slug'], txt[:120]))
            continue
        raw.append({'type': k, 'text': fa_digits(t)})

    # آغاز متن: نخستین تیتر اصلی، مگر آن‌که کاتالوگ جای دیگری را مشخص کرده باشد
    rx = re.compile(meta['skip_until']) if meta.get('skip_until') else None
    start = 0
    for i, b in enumerate(raw):
        if rx:
            if b['type'] in ('h2', 'h3') and rx.match(b['text']):
                start = i
                break
        elif b['type'] == 'h2':
            start = i
            break
    lead = [b for b in raw[:start] if b['type'] in ('callout', 'table', 'img')]
    for b in raw[:start]:
        if b not in lead:
            dropped.append((meta['slug'] + ' «پیش از متن»',
                            (b.get('text') or b['type'])[:120]))

    blocks = merge_lists(lead + raw[start:])

    # شرح شکل: در این اسناد گاهی بالای شکل است و گاهی پایین آن
    def label(x):
        """پاراگراف کوتاهِ بی‌نقطه‌ی پایانی — الگوی عنوانِ شکل در این گزارش‌ها."""
        return (x['type'] == 'p' and len(x['text']) < 130
                and not x['text'].rstrip().endswith(('.', '؟', '!', ':', '؛')))

    out = []
    for b in blocks:
        if (b['type'] == 'p' and len(b['text']) < 180 and FIGCAP.match(b['text'])
                and out and out[-1]['type'] == 'img'):
            cap = b['text'].strip('()')
            out[-1]['caption'] = (out[-1]['caption'] + ' · ' + cap
                                  if out[-1].get('caption') else cap)
            continue
        if b['type'] == 'img':
            pre = []
            while len(pre) < 2 and out and label(out[-1]):
                pre.insert(0, out.pop()['text'])
            if pre:
                b = dict(b, caption=' — '.join(pre))
        out.append(b)

    words = 0
    for b in out:
        words += len(b.get('text', '').split())
        words += sum(len(x.split()) for x in b.get('items', []))
        words += sum(len(c.split()) for r in b.get('rows', []) for c in r)
        words += sum(len(x.get('text', '').split()) for x in b.get('blocks', []))
    words += sum(len(s.split()) for s in meta['summary'])

    return {
        'slug': meta['slug'], 'title': meta['title'], 'subtitle': meta['subtitle'],
        'topic': meta['topic'], 'date': meta['date'],
        'source': meta['source'], 'source_url': meta['source_url'],
        'summary': meta['summary'], 'body': out, 'words': words,
        'read_minutes': max(2, round(words / 220)),
        'figures': sum(1 for b in out if b['type'] == 'img'),
        'tables': sum(1 for b in out if b['type'] == 'table'),
    }


def main():
    dropped, out = [], []
    for meta in catalog_reports.REPORTS:
        r = parse_report(meta, dropped)
        out.append(r)
        print(f"{r['slug']:26s} {r['words']:6d} واژه  {r['figures']:2d} شکل  "
              f"{r['tables']:2d} جدول  {len(r['body']):4d} بلوک")
    with open(os.path.join(ROOT, 'data', 'reports.json'), 'w', encoding='utf8') as f:
        json.dump({'topics': catalog_reports.TOPICS, 'reports': out},
                  f, ensure_ascii=False, indent=1)
    print('\nمجموع واژه‌ها:', sum(r['words'] for r in out))
    if '--dropped' in sys.argv:
        print('\n── پاراگراف‌های حذف‌شده ──')
        for s, t in dropped:
            print(f'  [{s}] {t}')


if __name__ == '__main__':
    main()
