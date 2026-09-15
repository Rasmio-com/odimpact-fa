# -*- coding: utf-8 -*-
"""ساخت فهرست کتاب‌شناسیِ منابع پژوهشی در data/library.json

خودِ فایل‌ها جایی منتشر نمی‌شوند (حق نشر و حجم)؛ فقط عنوان، نویسنده، سال و
هرجا که در دسترس باشد نشانی منبع اصلی ایندکس می‌شود، تا پس از حذف پوشه‌ی
محلی فهرست باقی بماند.
"""
import json, os, re, sys

import pymupdf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.environ.get('ODFA_SRC', os.path.join(ROOT, 'داده- باز'))

# پوشه‌هایی که خودشان منبع گزارش‌های سایت‌اند یا سند کاری داخلی‌اند
SKIP_DIRS = {
    'گزارش چارتر', 'گزارش بودجه باز', 'گزارش قرارداد', 'گزارش داده باز',
    'نقد به طرح پورتال ملی داده', 'نوآوری با داده باز', 'اهمیت داده باز',
    'خبر سامانه ملی داده', 'فهرست داده‌ها برای data gov', 'zz99- Archive',
}
SKIP_FILES = {'سوالات فاز اکتشافی- خانم صابری.docx', 'لیست قوانین داده باز.pdf'}
# جلد، پیش‌گفتار و پس‌گفتارِ کتاب‌ها ورودیِ کتاب‌شناسی نیستند
SKIP_NAME = re.compile(r'^(00-\s*)?front ?matter|^99-\s*back ?matter|back ?matter'
                       r'|^fp single|_fp$|^maghalat', re.I)
# فایل‌هایی که خودِ کتاب کامل‌اند، نه یک فصل
WHOLE = {'The word of Open Data.pdf': 'The World of Open Data',
         'Whole Book.pdf': 'Open Data Exposed'}

GROUPS = [
    ('books', 'کتاب‌ها و فصل‌های کتاب',
     {'The World of Open Data', 'Open Data Exposed'}),
    ('business', 'کسب‌وکار و کارآفرینی با داده‌ی باز', {'بیزینس با داده باز'}),
    ('demand', 'تقاضای داده', {'Data Demand'}),
    ('sdg', 'داده و توسعه‌ی پایدار', {'Cape Town Global Action Plan'}),
    ('iran', 'ایران', {'08- Data-Gov-Ir', 'ارزیابی روزنامه رسمی',
                       'مرکز توانمندسازی- ارزیابی پورتال‌ داده‌ی باز',
                       'ارائه داده باز اندیشکده'}),
    ('toread', 'خواندنی‌های پیشِ رو', {'To Read'}),
]
BOOKS = {
    'The World of Open Data': 'The World of Open Data (Springer)',
    'Open Data Exposed': 'Open Data Exposed (Springer)',
}
# عنوان‌های بی‌معنی که نرم‌افزارها در فراداده‌ی PDF می‌گذارند
JUNK = re.compile(r'^(untitled.*|microsoft (word|powerpoint).*|powerpoint '
                  r'presentation|document\d*|world bank document|print|slide \d|'
                  r'[\d\s.\-_]+|.{0,8})$|\.(indd|hwp|docx?|pptx?|qxd|tex)\b'
                  r'|proceedings template|author guidelines|^\d{4,}_'
                  r'|\.pdf\b|^\S*_\S*_\S*$', re.I)
FA = re.compile(r'[؀-ۿ]')


def ris(path):
    out = {'authors': []}
    for line in open(path, encoding='utf8', errors='ignore'):
        m = re.match(r'^([A-Z][A-Z0-9])\s+-\s*(.*)$', line.strip())
        if not m:
            continue
        tag, val = m.group(1), m.group(2).strip()
        if tag == 'AU':
            out['authors'].append(val)
        elif tag == 'TI' or (tag == 'T1' and 'title' not in out):
            out['title'] = val
        elif tag == 'PY':
            out['year'] = val[:4]
        elif tag == 'T2':
            out['venue'] = val
        elif tag == 'PB':
            out.setdefault('venue', val)
        elif tag == 'DO':
            out['doi'] = val
        elif tag == 'UR':
            out.setdefault('url', val)
        elif tag == 'TY':
            out['kind'] = {'JOUR': 'مقاله', 'CHAP': 'فصل کتاب',
                           'BOOK': 'کتاب', 'RPRT': 'گزارش'}.get(val, '')
    return out


def from_pdf(path):
    out = {}
    try:
        doc = pymupdf.open(path)
    except Exception:
        return out
    md = doc.metadata or {}
    t = (md.get('title') or '').strip()
    if t and not JUNK.search(t):
        out['title'] = re.sub(r'\s+', ' ', t.replace('_', ' '))
    a = (md.get('author') or '').strip()
    if a and not JUNK.search(a) and len(a) < 120:
        out['authors'] = [x.strip() for x in re.split(r'[;,]| and ', a) if x.strip()][:6]
    out['pages'] = len(doc)
    head = doc[0].get_text()[:2500] if len(doc) else ''
    years = re.findall(r'\b(19[89]\d|20[0-2]\d)\b', head)
    if years:
        out['year'] = max(years)
    elif re.search(r'\b1[34]\d\d\b', head):
        out['year'] = re.findall(r'\b(1[34]\d\d)\b', head)[0]
    if FA.search(head) or FA.search(os.path.basename(path)):
        out['lang'] = 'fa'
    return out


def title_from_name(name):
    t = os.path.splitext(name)[0]
    t = re.sub(r'^\d{1,2}[-–.]\s*', '', t)          # شماره‌ی فصل
    t = re.sub(r'^\d{4}\s*[-–]\s*', '', t)          # سالِ پیشوندِ نام فایل
    t = re.sub(r'[_]+', ' ', t)
    t = re.sub(r'\s+', ' ', t).strip()
    return t.strip('\u200c \t_-–.،')


def group_of(rel):
    top = rel.split(os.sep)[0] if os.sep in rel else ''
    for slug, _t, dirs in GROUPS:
        if top in dirs:
            return slug
    return 'general'


def main():
    items = []
    for dirpath, dirnames, filenames in os.walk(SRC):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for fn in sorted(filenames):
            if not fn.lower().endswith(('.pdf', '.epub')) or fn in SKIP_FILES:
                continue
            if SKIP_NAME.search(os.path.splitext(fn)[0]):
                continue
            full = os.path.join(dirpath, fn)
            rel = os.path.relpath(full, SRC)
            top = os.path.dirname(rel)
            meta = {'authors': []}
            risp = os.path.splitext(full)[0] + '.ris'
            if os.path.exists(risp):
                meta.update({k: v for k, v in ris(risp).items() if v})
            pdf = from_pdf(full) if fn.lower().endswith('.pdf') else {}
            for k, v in pdf.items():
                if k == 'authors':
                    if not meta.get('authors'):
                        meta['authors'] = v
                elif k not in meta:
                    meta[k] = v
            # نام فایل‌های فارسی را خود کاربر معنادار گذاشته؛ به فراداده ارجح است
            if FA.search(fn):
                meta['title'] = title_from_name(fn)
            meta['title'] = meta.get('title', '').strip('\u200c \t_-–.،') or title_from_name(fn)
            if fn in WHOLE:
                meta['title'], meta['kind'] = WHOLE[fn], 'کتاب'
            g = group_of(rel)
            if top in BOOKS:
                meta['venue'] = BOOKS[top]
                meta.setdefault('kind', 'فصل کتاب')
            lang = 'fa' if (meta.get('lang') == 'fa' or FA.search(meta['title'])) else 'en'
            items.append({
                'title': meta['title'][:220],
                'authors': meta.get('authors', [])[:6],
                'year': meta.get('year', ''),
                'venue': meta.get('venue', ''),
                'kind': meta.get('kind', ''),
                'doi': meta.get('doi', ''),
                'url': meta.get('url', ''),
                'pages': meta.get('pages', 0),
                'lang': lang,
                'group': 'fa' if (lang == 'fa' and g in ('general', 'fa')) else g,
                'folder': top,
            })
    seen, uniq = set(), []
    for it in items:
        key = re.sub(r'[^\w\u0600-\u06FF]+', '', it['title']).lower()
        if key in seen:
            continue
        seen.add(key)
        uniq.append(it)
    items = uniq
    items.sort(key=lambda x: (x['group'], x['title'].lower()))
    groups = [{'slug': s, 'title': t} for s, t, _ in GROUPS]
    groups += [{'slug': 'fa', 'title': 'منابع فارسی'},
               {'slug': 'general', 'title': 'عمومی'}]
    groups = [g for g in groups if any(i['group'] == g['slug'] for i in items)]
    with open(os.path.join(ROOT, 'data', 'library.json'), 'w', encoding='utf8') as f:
        json.dump({'groups': groups, 'items': items}, f, ensure_ascii=False, indent=1)
    import collections
    print(f'{len(items)} منبع')
    print(collections.Counter(i['group'] for i in items))
    print('با نشانی/DOI:', sum(1 for i in items if i['url'] or i['doi']))
    print('با سال:', sum(1 for i in items if i['year']),
          '| با نویسنده:', sum(1 for i in items if i['authors']))
    if '--show' in sys.argv:
        for i in items[:int(sys.argv[sys.argv.index('--show') + 1])]:
            print(f"  [{i['group']:8s}] {i['year']:4s} {i['title'][:70]:72s} "
                  f"{'; '.join(i['authors'])[:40]}")


if __name__ == '__main__':
    main()
