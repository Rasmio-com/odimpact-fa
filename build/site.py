# -*- coding: utf-8 -*-
"""تولید صفحه‌های ایستای سایت از روی data/cases.json"""
import colorsys, html, json, math, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'site')
# مسیر پایه‌ی سایت روی سرور؛ برای گیت‌هاب‌پیجزِ یک مخزن پروژه «/<نام مخزن>/» است.
# اگر دامنه‌ی اختصاصی تنظیم شد، ODFA_BASE=/ بگذارید. فقط صفحه‌ی ۴۰۴ به آن نیاز دارد،
# چون در هر مسیری ممکن است سرو شود و نمی‌تواند نشانی نسبی داشته باشد.
BASE = os.environ.get('ODFA_BASE', '/odimpact-fa/')


def load(name):
    return json.load(open(os.path.join(ROOT, 'data', name), encoding='utf8'))


def load_html(name):
    return open(os.path.join(ROOT, 'data', name), encoding='utf8').read()


# بخش «ایران در شاخص‌های جهانی» صفحه‌ی اول؛ خروجی آماده از داده‌ی ۲۴ شاخص
HOME_INDICES = load_html('home_indices.html')
HOME_INDICES_META = load_html('home_indices_meta.html')
LAW_IX = load_html('law_ix.html')
N_INDICES = 24

DATA = load('cases.json')
CATS = DATA['categories']
CASES = DATA['cases']
BYCAT = {c['slug']: c for c in CATS}

REPORTS = load('reports.json')['reports']
TOPICS = load('reports.json')['topics']
BYTOPIC = {t['slug']: t for t in TOPICS}
LAWS = load('laws.json')
LIB = load('library.json')
# نقشه‌ی نقطه‌ای و جای کشورها؛ تولیدشده با video/scripts/gen-data.mjs
WORLD = load('world.json')
# روایت‌های عددی و نمونه‌های هر بُعد؛ همان محتوایی که ویدئوی معرفی نشان می‌دهد
HL = load('highlights.json')
BYSLUG = {c['slug']: c for c in CASES}
# کنشگران زیست‌بوم داده در ایران؛ فایلی دست‌نویس که هیچ تجزیه‌گری روی آن نمی‌نویسد
ECO = load('ecosystem.json')
ACTORS = ECO['actors']
# کاتالوگ فهرست‌شده‌ی بازیگران؛ دست‌نویس
CATALOG = load('ecosystem_catalog.json')
LAW_BY_NO = {lw['no']: lw for lw in LAWS['laws']}
REPORT_BY_SLUG = {r['slug']: r for r in REPORTS}
CASE_ACTORS, LAW_ACTORS = {}, {}
for _a in ACTORS:
    for _s in _a['related_cases']:
        CASE_ACTORS.setdefault(_s, []).append(_a)
    for _n in _a['related_laws']:
        LAW_ACTORS.setdefault(_n, []).append(_a)
# منبع‌های کتاب‌شناختی کنشگران، هنگام ساخت به کتابخانه افزوده می‌شود (library.json دست‌نخورده می‌ماند)
LIB['items'] = LIB['items'] + [r for _a in ACTORS for r in _a['refs']]

REPORT_ACCENT, REPORT_ACCENT2 = '#0F766E', '#5EEAD4'

SITE = 'تأثیر داده‌ی باز'
TAGLINE = 'سی‌وهفت مطالعه‌ی موردی از سراسر جهان درباره‌ی این‌که داده‌ی باز واقعاً چه چیزی را تغییر داده است'
FA = '۰۱۲۳۴۵۶۷۸۹'

e = html.escape
def num(n): return str(n).translate(str.maketrans('0123456789', FA))
def fa_num(n, decimals=0):
    """عدد با جداکننده‌ی هزارگان (٬) و ممیز فارسی (٫)"""
    return num(f'{n:,.{decimals}f}'.replace(',', '٬').replace('.', '٫'))

ICON = {
    'clock': '<path d="M12 7v5l3 2"/><circle cx="12" cy="12" r="9"/>',
    'pin': '<path d="M12 21s7-6 7-11a7 7 0 10-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/>',
    'pen': '<path d="M4 20h4l10-10a2.8 2.8 0 10-4-4L4 16v4z"/>',
    'cal': '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    'spark': '<path d="M12 3l1.9 5.4L19 10l-5.1 1.6L12 17l-1.9-5.4L5 10l5.1-1.6L12 3z"/>',
    'doc': '<path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z"/><path d="M14 3v5h5"/>',
    'arrow': '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    'arrowr': '<path d="M5 12h14M13 6l6 6-6 6"/>',
    'search': '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    'grid': '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    'play': '<path d="M8 5.5v13a1 1 0 001.5.86l11-6.5a1 1 0 000-1.72l-11-6.5A1 1 0 008 5.5z" fill="currentColor" stroke="none"/>',
    'chart': '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    'law': '<path d="M4 8h16M6 8v12h12V8M9 12v5M15 12v5M12 3l8 5H4z"/>',
    'book': '<path d="M4 5h6v14H4zM14 5h6v14h-6M4 9h6M14 9h6"/>',
    'warn': '<path d="M12 3l10 18H2L12 3zM12 10v5M12 18h.01"/>',
    'net': '<circle cx="6" cy="7" r="2.6"/><circle cx="18" cy="7" r="2.6"/><circle cx="12" cy="18" r="2.6"/><path d="M8.3 8.4l2.4 7.2M15.7 8.4l-2.4 7.2M8.6 7h6.8"/>',
}
def ic(name, cls=''):
    return (f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" '
            f'stroke-linecap="round" stroke-linejoin="round"{f" class={cls}" if cls else ""}>{ICON[name]}</svg>')


def page(body, *, title, desc, root, active='', extra_head='', extra_foot='', cls=''):
    y = num(1404)
    nav_items = [('', 'خانه'), ('cases/', 'مطالعات موردی'), ('ecosystem/', 'زیست‌بوم ایران'),
                 ('laws/', 'قوانین ایران'), ('indices/', 'ایران در شاخص‌ها'), ('library/', 'منابع'),
                 ('about/', 'درباره'), ]
    links = ''.join(
        f'<a href="{root}{h}" class="{"on" if active == h else ""}">{t}</a>' for h, t in nav_items)
    foot_cats = ''.join(
        f'<li><a href="{root}cases/?cat={c["slug"]}">{c["title"]}</a></li>' for c in CATS)
    return f"""<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<meta name="theme-color" content="#0C1024">
<meta property="og:type" content="website">
<meta property="og:locale" content="fa_IR">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:site_name" content="{SITE}">
<link rel="preload" href="{root}assets/fonts/YekanBakh-Regular.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="{root}assets/fonts/YekanBakh-Black.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="{root}assets/css/style.css">
<link rel="icon" href="{root}assets/favicon.svg" type="image/svg+xml">
<script>(function(){{try{{var t=localStorage.getItem('odi-theme');if(t)document.documentElement.setAttribute('data-theme',t);else if(matchMedia('(prefers-color-scheme:dark)').matches)document.documentElement.setAttribute('data-theme','dark');}}catch(e){{}}}})();</script>
{extra_head}</head>
<body{f' class="{cls}"' if cls else ''}>
<header class="nav"><div class="wrap nav-in">
  <a href="{root}" class="brand"><span class="mark"><span></span></span>{SITE}</a>
  <nav class="nav-links">{links}</nav>
  <div class="nav-tools">
    <button class="icon-btn" data-theme-toggle aria-label="حالت تاریک">
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M21 13a8.4 8.4 0 01-10-10 8.5 8.5 0 1010 10z"/></svg>
    </button>
    <button class="icon-btn burger" data-burger aria-label="فهرست" aria-expanded="false">
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
    </button>
  </div>
</div></header>
{body}
<footer><div class="wrap">
  <div class="f-grid">
    <div>
      <div class="brand"><span class="mark"><span></span></span>{SITE}</div>
      <p>روایت فارسی پروژه‌ی «تأثیر داده‌ی باز» گاورلب دانشگاه نیویورک؛ مجموعه‌ای از مطالعات موردی که نشان می‌دهد آزادسازی داده‌های عمومی در عمل چه چیزی را عوض کرده است — و کجا شکست خورده است.</p>
      {cobrand(root, 'in-foot')}
    </div>
    <div><h4>ابعاد تأثیر</h4><ul>{foot_cats}</ul></div>
    <div><h4>پیوندها</h4><ul>
      <li><a href="{root}cases/">همه‌ی مطالعات موردی</a></li>
      <li><a href="{root}cases/?cat=reports">گزارش‌های فارسی</a></li>
      <li><a href="{root}ecosystem/">زیست‌بوم داده در ایران</a></li>
      <li><a href="{root}laws/">قوانین داده‌ی باز در ایران</a></li>
      <li><a href="{root}indices/">ایران در شاخص‌های جهانی</a></li>
      <li><a href="{root}library/">کتابخانه‌ی منابع</a></li>
      <li><a href="{root}about/">درباره‌ی این پروژه</a></li>
      <li><a href="https://rasmio.com" rel="noopener" target="_blank">rasmio.com<span class="eng"> ↗</span></a></li>
      <li><a href="https://ito.gov.ir" rel="noopener" target="_blank">ito.gov.ir<span class="eng"> ↗</span></a></li>
      <li><a href="https://odimpact.org" rel="noopener" target="_blank">odimpact.org<span class="eng"> ↗</span></a></li>
      <li><a href="https://thegovlab.org" rel="noopener" target="_blank">The GovLab<span class="eng"> ↗</span></a></li>
    </ul></div>
  </div>
  <div class="f-mark" aria-hidden="true">{SITE}</div>
  <div class="f-bot">
    <span>متن اصلی از گاورلب دانشگاه نیویورک · ترجمه‌ی فارسی · محصول مشترک رسمیو و سازمان فناوری اطلاعات ایران</span>
    <span>ساخته‌شده با قلم یکان بخ</span>
  </div>
</div></footer>
<div class="lb"><img alt=""></div>
<script src="{root}assets/js/app.js" defer></script>
{extra_foot}</body></html>"""


def shade(hex_, dh=0, dl=0, ds=0):
    """چرخش رنگ پایه در فضای HSL برای ساخت گونه‌های هم‌خانواده."""
    r, g_, b = (int(hex_[i:i + 2], 16) / 255 for i in (1, 3, 5))
    hh, ll, ss = colorsys.rgb_to_hls(r, g_, b)
    hh = (hh + dh / 360) % 1
    ll = min(.93, max(.22, ll + dl / 100))
    ss = min(1, max(.25, ss + ds / 100))
    return '#%02X%02X%02X' % tuple(round(x * 255) for x in colorsys.hls_to_rgb(hh, ll, ss))


def card(c, root, kind='case'):
    if kind == 'case':
        a1, a2, tag = BYCAT[c['category']]['accent'], BYCAT[c['category']]['accent2'], \
            BYCAT[c['category']]['title']
        cat, href = c['category'], f'{root}cases/{c["slug"]}/'
        top_r, top_l = c['year'], c['country']
        keys = ' '.join([c['title'], c['subtitle'], c['title_en'], c['country'],
                         tag, c['year'], ' '.join(c['key_points'][:2])])
    else:
        a1, a2, tag = REPORT_ACCENT, REPORT_ACCENT2, BYTOPIC[c['topic']]['title']
        cat, href = 'reports', f'{root}reports/{c["slug"]}/'
        top_r, top_l = c['date'], 'گزارش'
        keys = ' '.join([c['title'], c['subtitle'], tag, c['date'], c['source'],
                         c['summary'][0] if c['summary'] else ''])
    h = sum((i + 3) * ord(ch) for i, ch in enumerate(c['slug']))
    ang, pat = 96 + (h % 9) * 12, h % 4
    gx, gy = 22 + (h // 4 % 5) * 16, -24 + (h // 7 % 4) * 22
    d1 = (h % 11) * 3.6 - 18
    g1 = shade(a1, d1, (h // 3 % 5) * 3 - 6, (h // 5 % 4) * 5 - 8)
    g2 = shade(a2, d1 + ((h // 2 % 9) * 4 - 16), (h // 11 % 5) * 3 - 4)
    return f"""<article class="card rv" data-card="{cat}" data-kind="{kind}" data-k="{e(keys.lower())}"
 style="--c1:{a1};--c2:{a2};--g1:{g1};--g2:{g2};--ang:{ang}deg;--gx:{gx}%;--gy:{gy}%">
  <div class="card-top" data-p="{pat}"><span class="yr">{top_r}</span><span class="cn">{top_l}</span></div>
  <div class="card-body">
    <h3>{e(c['title'])}</h3>
    <p class="sub">{e(c['subtitle'])}</p>
    <div class="meta">
      <span class="tag">{tag}</span>
      <span class="rt">{ic('clock')}{num(c['read_minutes'])} دقیقه</span>
    </div>
  </div>
  <a class="stretch" href="{href}" aria-label="{e(c['title'])}"></a>
</article>"""


# ── خانه ──────────────────────────────────────────────────────────
def build_home():
    countries = len({c['country'] for c in CASES})
    words_total = sum(c['words'] for c in CASES) + sum(r['words'] for r in REPORTS)
    ncat = {c['slug']: sum(1 for x in CASES if x['category'] == c['slug']) for c in CATS}

    # پلیر ویدئوی معرفی؛ پیش از بارگذاری جاوااسکریپت، پوستر دیده می‌شود
    reel = """<div class="reel-wrap">
    <div class="reel-glow" aria-hidden="true"></div>
    <div class="reel" id="reel" data-reel role="region" aria-label="ویدئوی معرفی «تأثیر داده‌ی باز»">
      <div class="reel-frame"><img class="reel-poster" src="assets/img/showreel-poster.jpg" width="1280" height="720"
        alt="ویدئوی معرفی «تأثیر داده‌ی باز»" fetchpriority="high" decoding="async"></div>
      <div class="reel-bar reel-bar-ph" aria-hidden="true"></div>
    </div>
  </div>"""

    stats = [
        (len(CASES), '', 'مطالعه‌ی موردی'),
        (countries, '', 'کشور و قلمرو'),
        (len(REPORTS), '', 'گزارش فارسی'),
        (len(LAWS['laws']), '', 'مفاد قانونی ایران'),
        (round(words_total / 1000), ' هزار', 'واژه‌ی فارسی'),
    ]
    stats_html = ''.join(
        f'<div><b data-to="{n}" data-suffix="{suf}">{num(n)}{suf}</b><span>{label}</span></div>'
        for n, suf, label in stats)

    # نوار روان عنوان‌ها؛ هر ردیف دو بار تکرار می‌شود تا حلقه بی‌درز باشد
    def chips(items, hidden=False):
        attrs = ' aria-hidden="true" tabindex="-1"' if hidden else ''
        return ''.join(
            f'<a class="tk" href="cases/{c["slug"]}/" style="--c1:{BYCAT[c["category"]]["accent"]}"{attrs}>'
            f'<i></i>{e(c["title"])}<span>{e(c["country"])}</span></a>' for c in items)
    half = (len(CASES) + 1) // 2
    rows = [CASES[:half], CASES[half:]]
    ticker = ''.join(
        f'<div class="ticker-row{" rev" if i else ""}"><div class="ticker-track">'
        f'{chips(r)}{chips(r, hidden=True)}</div></div>' for i, r in enumerate(rows))

    # نقشه‌ی کشورها؛ سنجاق‌ها روی نقشه‌ی نقطه‌ای، با فهرست مطالعات هر کشور
    W, H = WORLD['width'], WORLD['height']
    pins = []
    for i, c in enumerate(WORLD['countries']):
        x, y = c['x'] / W * 100, c['y'] / H * 100
        n = len(c['cases'])
        cols = [BYCAT[k['category']]['accent'] for k in c['cases']]
        if n > 1:
            step = 360 / n
            ring = 'conic-gradient(' + ','.join(
                f'{col} {j * step:.1f}deg {(j + 1) * step - 7:.1f}deg,transparent {(j + 1) * step - 7:.1f}deg {(j + 1) * step:.1f}deg'
                for j, col in enumerate(cols)) + ')'
        else:
            ring = cols[0]
        side = 'e' if x > 66 else 's' if x < 30 else 'c'
        vert = 'down' if y < 36 else 'up'
        lis = ''.join(
            f'<li><a href="cases/{k["slug"]}/"><i style="background:{BYCAT[k["category"]]["accent"]}"></i>'
            f'{e(k["title"])}</a></li>' for k in c['cases'])
        lab = c['label']
        pins.append(f"""<div class="pin{' multi' if n > 1 else ''}" style="left:{x:.2f}%;top:{y:.2f}%;--pc:{cols[0]};--ring:{ring};--n:{n};--d:{(i % 7) * .4:.1f}s" data-side="{side}" data-v="{vert}">
  <button type="button" class="pin-dot" aria-expanded="false" aria-label="{e(c['name'])}: {num(n)} مطالعه‌ی موردی"><span></span></button>
  <span class="pin-lab" data-dir="{lab['dir']}" style="--dx:{lab['dx'] * .6:.0f}px;--dy:{lab['dy'] * .6:.0f}px" aria-hidden="true">{e(c['name'])}</span>
  <div class="pin-pop"><div class="pin-card"><b>{e(c['name'])}</b><small>{num(n)} مطالعه‌ی موردی</small><ul>{lis}</ul></div></div>
</div>""")
    legend = ''.join(f'<span><i style="background:{c["accent"]}"></i>{c["title"]}</span>' for c in CATS)

    # چهار بُعد با سه نمونه از هر کدام
    def dim_card(c):
        lis = ''.join(
            f'<li><a href="cases/{s}/">{e(BYSLUG[s]["title"])}</a><span>{e(BYSLUG[s]["country"])}</span></li>'
            for s in HL['dimensionPicks'][c['slug']])
        n = ncat[c['slug']]
        return f"""<article class="dx rv" data-spot style="--c1:{c['accent']};--c2:{c['accent2']}">
  <div class="dx-head">
    <span class="ic"><svg viewBox="0 0 24 24"><path d="{c['icon']}"/></svg></span>
    <span class="dx-n" data-to="{n}">{num(n)}</span>
  </div>
  <h3>{c['title']}</h3>
  <p class="dx-en"><span class="eng">{c['title_en']}</span></p>
  <p class="dx-desc">{e(c['desc'])}</p>
  <ul class="dx-list">{lis}</ul>
  <a class="dx-more" href="cases/?cat={c['slug']}">همه‌ی {num(n)} مطالعه{ic('arrow')}</a>
</article>"""
    dims = ''.join(dim_card(c) for c in CATS)

    # شواهد: شش روایت، شش عدد
    def ev_card(h):
        c = BYSLUG[h['slug']]
        cat = BYCAT[c['category']]
        a1, a2 = h.get('accent', cat['accent']), h.get('accent2', cat['accent2'])
        if 'text' in h:
            big = f'<span class="ev-txt">{e(h["text"])}</span>'
        else:
            d = h.get('decimals', 0)
            big = ((f'<span class="ev-pre">{e(h["prefix"])}</span>' if h.get('prefix') else '')
                   + f'<span class="ev-num" data-to="{h["value"]}" data-dec="{d}">{fa_num(h["value"], d)}</span>'
                   + f'<span class="ev-suf">{e(h["suffix"])}</span>')
        warn = h.get('warn')
        tag = f'{ic("warn")}وقتی نتیجه معکوس شد' if warn else cat['title']
        return f"""<a class="ev rv{' warn' if warn else ''}" href="cases/{h['slug']}/" style="--c1:{a1};--c2:{a2}">
  <div class="ev-top"><span class="ev-tag">{tag}</span><span class="ev-c">{ic('pin')}{e(c['country'])}</span></div>
  <div class="ev-big">{big}</div>
  <p>{e(h['caption'])}</p>
  <div class="ev-foot"><b>{e(c['title'])}</b>{ic('arrow')}</div>
</a>"""
    evs = ''.join(ev_card(h) for h in HL['stories'])

    # پل به ایران: کمان از هر کشور تا ایران
    ix, iy = WORLD['iran']
    arcs, flows, dots = [], [], []
    for i, c in enumerate(WORLD['countries']):
        x0, y0 = c['x'], c['y']
        dist = math.hypot(ix - x0, iy - y0)
        cx, cy = (x0 + ix) / 2, (y0 + iy) / 2 - dist * .32
        col = BYCAT[c['cases'][0]['category']]['accent2']
        d = f'M{x0} {y0}Q{cx:.1f} {cy:.1f} {ix} {iy}'
        arcs.append(f'<path class="arc" d="{d}" pathLength="1" stroke="{col}" style="--d:{i * .05:.2f}s"/>')
        flows.append(f'<path class="flow" d="{d}" pathLength="1" style="animation-delay:-{(i * .37) % 3:.2f}s"/>')
        dots.append(f'<circle cx="{x0}" cy="{y0}" r="3.4" fill="{col}"/>')
    bridge_svg = (f'<svg class="bridge-arcs" viewBox="0 0 {W} {H}" aria-hidden="true">{"".join(arcs)}{"".join(flows)}'
                  f'{"".join(dots)}<circle class="iran-ring" cx="{ix}" cy="{iy}" r="9"/>'
                  f'<circle class="iran-dot" cx="{ix}" cy="{iy}" r="6"/></svg>'
                  f'<span class="iran-lab" style="left:{ix / W * 100:.2f}%;top:{iy / H * 100:.2f}%">ایران</span>')

    body = f"""<main>
<section class="hero"><div class="hero-bg" aria-hidden="true"><div class="aurora"><i></i><i></i><i></i><i></i></div><div class="hero-grid"></div><div class="hero-map"></div></div>
<div class="wrap hero-in">
  <span class="eyebrow"><i></i>پروژه‌ی «تأثیر داده‌ی باز» گاورلب دانشگاه نیویورک — به فارسی</span>
  <h1>داده‌ی باز <span class="grad">چه چیزی</span> را واقعاً تغییر داد؟</h1>
  <p class="lead">{TAGLINE}. از نبرد با ابولا در سیرالئون تا اقتصاد میلیارد‌دلاری جی‌پی‌اس؛ روایت‌هایی مستند از موفقیت‌ها، شکست‌ها و درس‌هایی که ماند.</p>
  <div class="hero-cta">
    <a class="btn btn-p" href="cases/">{ic('grid')}کاوش در مطالعات موردی</a>
    <a class="btn btn-g" href="#reel" data-reel-present>{ic('play')}تماشای ویدئو در حالت ارائه</a>
  </div>
  <div class="cobrand-band">{cobrand('', 'on-dark big')}<p>این سایت را رسمیو و سازمان فناوری اطلاعات ایران با هم ساخته‌اند تا تجربه‌ی جهانی داده‌ی باز در دسترس سیاست‌گذار، توسعه‌دهنده و شهروند ایرانی باشد.</p></div>
  {reel}
</div></section>

<div class="wrap"><div class="stats rv">{stats_html}</div></div>

<section class="ticker" aria-label="عنوان مطالعات موردی">{ticker}</section>

<section class="atlas" id="map"><div class="wrap">
  <div class="sec-head rv">
    <span class="sec-kicker">نقشه‌ی روایت‌ها</span>
    <h2>{num(countries)} کشور، {num(len(CASES))} روایت</h2>
    <p>از کرایست‌چرچ تا کالیفرنیا؛ روی هر کشور بروید یا بزنید تا مطالعه‌های موردی آن را ببینید. رنگ هر سنجاق، بُعد تأثیر آن مطالعه است.</p>
  </div>
  <div class="atlas-map rv">
    <div class="dots" aria-hidden="true"></div>
    {''.join(pins)}
  </div>
  <div class="atlas-legend rv">{legend}</div>
</div></section>

<section id="dims" class="dims-sec"><div class="wrap">
  <div class="sec-head rv">
    <span class="sec-kicker">چارچوب تحلیلی</span>
    <h2>داده‌ی باز از چهار مسیر اثر می‌گذارد</h2>
    <p>گاورلب پس از بررسی ده‌ها ابتکار در سراسر جهان، تأثیر داده‌ی باز را در چهار بُعد دسته‌بندی کرد. هر مطالعه‌ی موردی ذیل یکی از این ابعاد قرار می‌گیرد.</p>
  </div>
  <div class="dimx">{dims}</div>
</div></section>

<section class="evidence"><div class="wrap">
  <div class="sec-head rv">
    <span class="sec-kicker">از کجا شروع کنیم؟</span>
    <h2>شواهد، نه شعار</h2>
    <p>شش روایت و شش عدد؛ از یک کالای عمومی جهانی تا جایی که داده‌ی باز نتیجه‌ی معکوس داد. هر کارت شما را به مطالعه‌ی کامل می‌برد.</p>
  </div>
  <div class="evs">{evs}</div>
  <div class="more-cta rv"><a class="btn btn-ink" href="cases/">دیدن همه‌ی {num(len(CASES))} مطالعه{ic('arrow')}</a></div>
</div></section>

<section class="bridge-sec"><div class="wrap">
  <div class="bridge rv">
    <div class="bridge-text">
      <span class="sec-kicker">فراتر از مطالعات موردی</span>
      <h2>از تجربه‌ی جهانی، <span class="grad-warm">تا ایران</span></h2>
      <p>کنار روایت‌های گاورلب، چهار مجموعه‌ی دیگر هم این‌جاست که تجربه‌ی جهانی را به زمینه‌ی ایران وصل می‌کند.</p>
      <div class="bridge-items">
        <a class="bi" href="cases/?cat=reports" style="--c1:{REPORT_ACCENT};--c2:{REPORT_ACCENT2}">
          <span class="ic">{ic('doc')}</span><span class="bt"><b data-to="{len(REPORTS)}">{num(len(REPORTS))}</b><span class="t">گزارش فارسی</span><span class="s">از منشور بین‌المللی داده‌ی باز تا نقد طرح پورتال ملی داده</span></span>{ic('arrow')}
        </a>
        <a class="bi" href="ecosystem/" style="--c1:#1D4ED8;--c2:#60A5FA">
          <span class="ic">{ic('net')}</span><span class="bt"><b data-to="{N_ECO}">{num(N_ECO)}</b><span class="t">کنشگر زیست‌بوم داده</span><span class="s">منتشرکنندگان، واسط‌ها و جامعه‌ی داده‌ی ایران، با رسمیو در مرکز</span></span>{ic('arrow')}
        </a>
        <a class="bi" href="laws/" style="--c1:#BE123C;--c2:#FB7185">
          <span class="ic">{ic('law')}</span><span class="bt"><b data-to="{len(LAWS['laws'])}">{num(len(LAWS['laws']))}</b><span class="t">مفاد قانونی ایران</span><span class="s">از قانون اساسی تا مصوبه‌های هیأت وزیران</span></span>{ic('arrow')}
        </a>
        <a class="bi" href="indices/" style="--c1:#B45309;--c2:#FBBF24">
          <span class="ic">{ic('chart')}</span><span class="bt"><b data-to="{N_INDICES}">{num(N_INDICES)}</b><span class="t">شاخص جهانی</span><span class="s">ایران در آینه‌ی شاخص‌های داده‌ی باز، دولت الکترونیک و شفافیت</span></span>{ic('arrow')}
        </a>
        <a class="bi" href="library/" style="--c1:#4338CA;--c2:#A78BFA">
          <span class="ic">{ic('book')}</span><span class="bt"><b data-to="{len(LIB['items'])}">{num(len(LIB['items']))}</b><span class="t">منبع پژوهشی</span><span class="s">کتاب‌شناسی پشتوانه‌ی این مجموعه، با پیوند به منبع اصلی</span></span>{ic('arrow')}
        </a>
      </div>
    </div>
    <div class="bridge-map"><div class="dots" aria-hidden="true"></div>{bridge_svg}</div>
  </div>
</div></section>

<section class="eco-home" id="ecosystem"><div class="wrap">
  <div class="eco-home-grid">
    <div class="eco-home-text">
      <span class="sec-kicker">زیست‌بوم داده‌ی باز ایران</span>
      <h2>از انتشار داده <span class="grad">تا خدمت</span></h2>
      <p>داده‌ی باز وقتی اثر می‌گذارد که کسی آن را بخواند، به داده‌های دیگر وصل کند و به کار بیاورد. {num(N_ECO)} کنشگر ایرانی و جهانی را در یک نقشه‌ی فیلترپذیر کنار هم گذاشته‌ایم، با رسمیو به‌عنوان لایه‌ی اتصال.</p>
      <div class="eco-stats on-dark">
        <div><b data-to="{N_ECO}">{num(N_ECO)}</b><span>کنشگر</span></div>
        <div><b data-to="{len(CATALOG['categories'])}">{num(len(CATALOG['categories']))}</b><span>دسته</span></div>
        <div><b data-to="{N_ECO_API}">{num(N_ECO_API)}</b><span>دارای API</span></div>
      </div>
      <div class="feat feat-ras compact">{rasmio_spot('', count=True)}</div>
      <div class="hero-cta"><a class="btn btn-p" href="ecosystem/">{ic('net')}کاوش در زیست‌بوم</a>
        <a class="btn btn-g" href="ecosystem/rasmio/">پروفایل رسمیو</a></div>
    </div>
    <div class="eco-home-map">{eco_map('')}{eco_legend()}</div>
  </div>
</div></section>

{HOME_INDICES}

<section class="finale"><div class="wrap"><div class="finale-in rv">
  <h2>هر روایت، <span class="grad">یک شاهد</span></h2>
  <p>{num(len(CASES))} مطالعه‌ی موردی، {num(len(REPORTS))} گزارش فارسی، {num(len(LAWS['laws']))} مفاد قانونی، {num(N_INDICES)} شاخص جهانی، {num(len(LIB['items']))} منبع پژوهشی و نقشه‌ی {num(N_ECO)} کنشگر زیست‌بوم داده در ایران؛ همه در یک‌جا و به فارسی.</p>
  <div class="hero-cta">
    <a class="btn btn-p" href="cases/">{ic('grid')}شروع کاوش</a>
    <a class="btn btn-g" href="about/">درباره‌ی این پروژه</a>
  </div>
</div></div></section>
</main>"""
    write('index.html', page(body, title=f'{SITE} — {TAGLINE}', desc=TAGLINE, root='', active='', cls='home',
                             extra_foot=HOME_INDICES_META + '<script src="assets/js/showreel.js" defer></script>\n<script src="assets/js/ecosystem.js" defer></script>\n'))


# ── فهرست مطالعات ─────────────────────────────────────────────────
def build_index():
    total = len(CASES) + len(REPORTS)
    chips = ('<button class="chip on" data-cat="all">همه '
             f'<span class="cnt">{num(total)}</span></button>')
    chips += ''.join(
        f'<button class="chip" data-cat="{c["slug"]}" style="--cc:{c["accent"]}"><i></i>{c["title"]} '
        f'<span class="cnt">{num(sum(1 for x in CASES if x["category"] == c["slug"]))}</span></button>'
        for c in CATS)
    chips += (f'<button class="chip" data-cat="reports" style="--cc:{REPORT_ACCENT}"><i></i>'
              f'گزارش‌های فارسی <span class="cnt">{num(len(REPORTS))}</span></button>')
    cards = ''.join(card(c, '../') for c in CASES)
    cards += ''.join(card(r, '../', kind='report') for r in REPORTS)
    body = f"""<main>
<section class="case-hero" style="--c1:#6C5CE7;--c2:#0EA5A5;padding:64px 0 70px"><div class="wrap">
  <div class="crumb"><a href="../">خانه</a>{ic('arrow')}<span>مطالعات موردی و گزارش‌ها</span></div>
  <h1>همه‌ی مطالب</h1>
  <p class="sub">هم‌اکنون <b data-count>{num(total)}</b> مطلب در دسترس است: {num(len(CASES))} مطالعه‌ی موردی
    از گاورلب و {num(len(REPORTS))} گزارش فارسی. بر اساس بُعد تأثیر فیلتر کنید یا نام کشور،
    سازمان و موضوع را جست‌وجو کنید.</p>
</div></section>
<section style="padding:36px 0 34px"><div class="wrap">
  {LAW_IX}
  <div class="filters">
    {chips}
    <label class="search">
      <input type="search" data-search placeholder="جست‌وجو در عنوان، کشور و موضوع…" aria-label="جست‌وجو">
      {ic('search')}
    </label>
  </div>
  <div class="grid" data-list>{cards}</div>
  <div class="empty" data-empty style="display:none">
    <b>چیزی پیدا نشد</b>واژه‌ی دیگری را امتحان کنید یا فیلتر را بردارید.
  </div>
</div></section>
</main>"""
    write('cases/index.html', page(body, title=f'مطالعات موردی و گزارش‌ها — {SITE}',
                                  desc='فهرست کامل مطالعات موردی تأثیر داده‌ی باز و گزارش‌های فارسی',
                                  root='../', active='cases/'))


# ── صفحه‌ی مطالعه ─────────────────────────────────────────────────
def slugify_head(t, n):
    return 'h-' + str(n)


def render_blocks(blocks, root, ctx=None):
    """بلوک‌های متن را به HTML تبدیل می‌کند و فهرست مطالب را برمی‌گرداند."""
    parts, toc, hn = [], [], 0
    for b in blocks:
        if b['type'] == 'h2':
            hn += 1
            hid = slugify_head(b['text'], hn)
            toc.append(f'<a href="#{hid}">{e(b["text"])}</a>')
            parts.append(f'<h2 id="{hid}">{e(b["text"])}</h2>')
        elif b['type'] == 'h3':
            parts.append(f'<h3>{e(b["text"])}</h3>')
        elif b['type'] == 'h4':
            parts.append(f'<h4>{e(b["text"])}</h4>')
        elif b['type'] == 'p':
            parts.append(f'<p>{e(b["text"])}</p>')
        elif b['type'] == 'ul':
            parts.append('<ul>' + ''.join(f'<li>{e(x)}</li>' for x in b['items']) + '</ul>')
        elif b['type'] == 'caption':
            parts.append(f'<figcaption style="text-align:right">{e(b["text"])}</figcaption>')
        elif b['type'] == 'callout':
            inner, _ = render_blocks(b['blocks'], root, ctx)
            parts.append(f'<aside class="callout">{inner}</aside>')
        elif b['type'] == 'table':
            head = ('<thead><tr>' + ''.join(f'<th>{e(x)}</th>' for x in b['head'])
                    + '</tr></thead>') if b['head'] else ''
            rows = ''.join('<tr>' + ''.join(f'<td>{e(x)}</td>' for x in r) + '</tr>'
                           for r in b['rows'])
            parts.append(f'<div class="tbl"><table>{head}<tbody>{rows}</tbody></table></div>')
        elif b['type'] == 'figures' and ctx:
            parts.append(figures_html(ctx))
        elif b['type'] == 'dims' and ctx:
            parts.append(dims_html(ctx))
        elif b['type'] == 'img':
            cap = f'<figcaption>{e(b["caption"])}</figcaption>' if b.get('caption') else ''
            parts.append(f'<figure><img src="{root}{b["src"]}" width="{b["w"]}" height="{b["h"]}" '
                         f'alt="{e(b.get("caption", "شکل"))}" loading="lazy" decoding="async">{cap}</figure>')
    return ''.join(parts), toc


def build_case(c, prev, nxt):
    cat = BYCAT[c['category']]
    root = '../../'
    body_html, toc = render_blocks(c['body'], root)

    summary = ''
    if c['summary']:
        ps = ''.join(f'<p>{e(s)}</p>' for s in c['summary'])
        summary = f"""<div class="summary rv">
  <span class="t">{ic('spark')}خلاصه‌ی مطلب</span>{ps}</div>"""

    keys = ''
    if c['key_points']:
        li = ''.join(f'<li>{e(k)}</li>' for k in c['key_points'])
        keys = f"""<div class="keys rv"><div class="t">{ic('spark')}نکات کلیدی</div><ol>{li}</ol></div>"""

    meta = [f'<span>{ic("pin")}{e(c["country"])}</span>']
    if c['authors']:
        meta.append(f'<span>{ic("pen")}<span class="eng">{e(c["authors"])}</span></span>')
    if c['date']:
        meta.append(f'<span>{ic("cal")}{e(c["date"])}</span>')
    meta.append(f'<span>{ic("clock")}{num(c["read_minutes"])} دقیقه مطالعه</span>')

    tocbox = ''
    if len(toc) > 1:
        tocbox = f'<aside class="toc"><div class="t">در این مطلب</div>{"".join(toc)}</aside>'

    npv = ''
    if prev:
        npv += (f'<a class="np p" href="{root}cases/{prev["slug"]}/">'
                f'<span class="l">{ic("arrowr")}قبلی</span><b>{e(prev["title"])}</b></a>')
    if nxt:
        npv += (f'<a class="np n" href="{root}cases/{nxt["slug"]}/">'
                f'<span class="l">بعدی{ic("arrow")}</span><b>{e(nxt["title"])}</b></a>')

    actor_note = ''.join(
        f'<aside class="callout actor-note"><p><b>نمونه‌ی ایرانی: {e(a["name"])}.</b> {e(a["tagline"])}. '
        f'<a href="{root}ecosystem/{a["slug"]}/">بیشتر بخوانید ←</a></p></aside>'
        for a in CASE_ACTORS.get(c['slug'], []))

    mapart = (f'<img class="case-map" src="{root}{c["map"]}" alt="" aria-hidden="true">'
              if c.get('map') else '')

    ld = json.dumps({
        "@context": "https://schema.org", "@type": "Article",
        "headline": c['title'], "inLanguage": "fa",
        "about": c['title_en'], "articleSection": cat['title'],
        "author": [{"@type": "Person", "name": a.strip()} for a in
                   re.split(r'[,،]| و ', c['authors']) if a.strip()][:6] or
                  [{"@type": "Organization", "name": "The GovLab"}],
        "description": (c['summary'][0][:200] if c['summary'] else c['subtitle']),
    }, ensure_ascii=False)

    body = f"""<div class="progress" style="--c1:{cat['accent']};--c2:{cat['accent2']}"></div>
<main style="--c1:{cat['accent']};--c2:{cat['accent2']}">
<section class="case-hero"><div class="wrap">
  {mapart}
  <div class="crumb">
    <a href="{root}">خانه</a>{ic('arrow')}
    <a href="{root}cases/">مطالعات موردی</a>{ic('arrow')}
    <a href="{root}cases/?cat={cat['slug']}">{cat['title']}</a>
  </div>
  <h1>{e(c['title'])}</h1>
  <p class="sub">{e(c['subtitle'])}</p>
  <p class="en"><span class="eng">{e(c['title_en'])}</span></p>
  <div class="case-meta">{''.join(meta)}</div>
</div></section>

<div class="wrap"><div class="layout">
  <article class="article">
    {summary}
    {keys}
    {body_html}
    {actor_note}
  </article>
  {tocbox}
</div>
<div class="nextprev">{npv}</div>
</div>
</main>"""
    desc = (c['summary'][0][:170] if c['summary'] else c['subtitle'])
    write(f'cases/{c["slug"]}/index.html',
          page(body, title=f'{c["title"]} — {SITE}', desc=desc, root=root, active='cases/',
               extra_head=f'<script type="application/ld+json">{ld}</script>\n'))


# ── صفحه‌ی گزارش ──────────────────────────────────────────────────
def build_report(r, prev, nxt):
    root, topic = '../../', BYTOPIC[r['topic']]
    body_html, toc = render_blocks(r['body'], root)

    summary = ''
    if r['summary']:
        ps = ''.join(f'<p>{e(s)}</p>' for s in r['summary'])
        summary = f"""<div class="summary rv">
  <span class="t">{ic('spark')}خلاصه‌ی مطلب</span>{ps}</div>"""

    meta = [f'<span>{ic("grid")}{topic["title"]}</span>']
    if r['date']:
        meta.append(f'<span>{ic("cal")}{e(r["date"])}</span>')
    meta.append(f'<span>{ic("clock")}{num(r["read_minutes"])} دقیقه مطالعه</span>')
    if r['figures']:
        meta.append(f'<span>{ic("doc")}{num(r["figures"])} شکل</span>')

    tocbox = (f'<aside class="toc"><div class="t">در این مطلب</div>{"".join(toc)}</aside>'
              if len(toc) > 1 else '')

    src = e(r['source'])
    if r['source_url']:
        src += (f' — <a href="{r["source_url"]}" target="_blank" rel="noopener">'
                f'<span class="eng">{e(r["source_url"].split("//")[-1])}</span> ↗</a>')

    npv = ''
    if prev:
        npv += (f'<a class="np p" href="{root}reports/{prev["slug"]}/">'
                f'<span class="l">{ic("arrowr")}قبلی</span><b>{e(prev["title"])}</b></a>')
    if nxt:
        npv += (f'<a class="np n" href="{root}reports/{nxt["slug"]}/">'
                f'<span class="l">بعدی{ic("arrow")}</span><b>{e(nxt["title"])}</b></a>')

    ld = json.dumps({
        "@context": "https://schema.org", "@type": "Report",
        "headline": r['title'], "inLanguage": "fa", "articleSection": topic['title'],
        "description": (r['summary'][0][:200] if r['summary'] else r['subtitle']),
    }, ensure_ascii=False)

    body = f"""<div class="progress" style="--c1:{REPORT_ACCENT};--c2:{REPORT_ACCENT2}"></div>
<main style="--c1:{REPORT_ACCENT};--c2:{REPORT_ACCENT2}">
<section class="case-hero"><div class="wrap">
  <div class="crumb">
    <a href="{root}">خانه</a>{ic('arrow')}
    <a href="{root}cases/?cat=reports">گزارش‌ها</a>{ic('arrow')}
    <span>{topic['title']}</span>
  </div>
  <h1>{e(r['title'])}</h1>
  <p class="sub">{e(r['subtitle'])}</p>
  <div class="case-meta">{''.join(meta)}</div>
</div></section>

<div class="wrap"><div class="layout">
  <article class="article">
    {summary}
    {body_html}
    <div class="srcbox"><b>منبع و حق نشر</b><p>{src}</p></div>
  </article>
  {tocbox}
</div>
<div class="nextprev">{npv}</div>
</div>
</main>"""
    desc = (r['summary'][0][:170] if r['summary'] else r['subtitle'])
    write(f'reports/{r["slug"]}/index.html',
          page(body, title=f'{r["title"]} — {SITE}', desc=desc, root=root, active='cases/',
               extra_head=f'<script type="application/ld+json">{ld}</script>\n'))


# ── زیست‌بوم داده در ایران ────────────────────────────────────────
def figures_html(a):
    cells = ''.join(
        f'<div class="fig"><div class="fv"><span class="pre">{e(f["prefix"])}</span><b>{e(f["value"])}</b>'
        f'<span class="unit">{e(f["unit"])}</span></div><p>{e(f["label"])}</p></div>' for f in a['figures'])
    return (f'<div class="figs">{cells}</div>'
            f'<p class="fig-src">منبع: {e(a["figures_source"])}</p>'
            f'<p class="fig-note">{e(a["figures_note"])}</p>')


def dims_html(a):
    out = []
    for d in a['dims']:
        cat = BYCAT[d['dimension']]
        out.append(f'<div class="dimcard" style="--c1:{cat["accent"]};--c2:{cat["accent2"]}">'
                   f'<span class="dk"><i></i>{cat["title"]}</span><h3>{e(d["title"])}</h3>'
                   f'<p>{e(d["text"])}</p></div>')
    return f'<div class="dimcards">{"".join(out)}</div>'


def law_label(lw):
    m = re.match(r'(ماده\s*\(?[۰-۹0-9]+\)?|اصل\s*[۰-۹0-9]+)', lw['text'])
    return (m.group(1) if m else '') or f'مفاد {num(lw["no"])}'


JMONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
           'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']


def jalali(iso):
    """تاریخ میلادی «YYYY-MM-DD» به شمسی، مثل «۱۴ مهر ۱۴۰۵»"""
    gy, gm, gd = (int(x) for x in iso.split('-'))
    cum = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
    gy2 = gy + 1 if gm > 2 else gy
    days = (355666 + 365 * gy + (gy2 + 3) // 4 - (gy2 + 99) // 100 + (gy2 + 399) // 400
            + gd + cum[gm - 1])
    jy = -1595 + 33 * (days // 12053)
    days %= 12053
    jy += 4 * (days // 1461)
    days %= 1461
    if days > 365:
        jy += (days - 1) // 365
        days = (days - 1) % 365
    if days < 186:
        jm, jd = 1 + days // 31, 1 + days % 31
    else:
        jm, jd = 7 + (days - 186) // 30, 1 + (days - 186) % 30
    return f'{num(jd)} {JMONTHS[jm - 1]} {num(jy)}'


# کاتالوگ فهرست‌شده‌ی کنشگران؛ دست‌نویس در data/ecosystem_catalog.json
E_ENT = CATALOG['entries']
E_CAT = {c['id']: c for c in CATALOG['categories']}
E_SEC = {s['id']: s for s in CATALOG['sectors']}
E_ACC = {s['id']: s for s in CATALOG['access']}
E_ST = {s['id']: s for s in CATALOG['statuses']}
E_BY = {x['id']: x for x in E_ENT}
E_SHORT = {'national_portals': 'درگاه‌های ملی', 'official_stats': 'آمار رسمی', 'economy_markets': 'اقتصاد و بازار',
           'registry_legal': 'ثبت و حقوق', 'infra_env': 'انرژی و محیط‌زیست', 'cities': 'داده‌های شهری',
           'research_academic': 'پژوهش و دانشگاه', 'persian_nlp': 'زبان فارسی و هوش مصنوعی',
           'civil_society': 'جامعه‌ی مدنی', 'private_services': 'سرویس‌های خصوصی',
           'international': 'بین‌المللی', 'global_platforms': 'پلتفرم‌های جهانی'}
N_ECO = len(E_ENT)
N_ECO_API = sum(1 for x in E_ENT if x['api_available'])
LOGO_RASMIO = ('assets/img/brand/rasmio.png', 1164, 360, 'لوگوی رسمیو')
LOGO_ITO = ('assets/img/brand/ito.png', 404, 247, 'لوگوی سازمان فناوری اطلاعات ایران')


def host_of(url):
    return re.sub(r'^https?://(www\.)?', '', url).split('/')[0]


def logo(root, spec, cls=''):
    p, w, h, alt = spec
    return f'<img src="{root}{p}" width="{w}" height="{h}" alt="{alt}" loading="lazy" decoding="async"{f" class={cls}" if cls else ""}>'


def cobrand(root, cls=''):
    """نشان محصول مشترک رسمیو و سازمان فناوری اطلاعات ایران"""
    return (f'<div class="cobrand {cls}"><span class="cb-t">محصول مشترک</span>'
            f'<a class="cb-logo" href="https://rasmio.com" target="_blank" rel="noopener" aria-label="رسمیو">{logo(root, LOGO_RASMIO)}</a>'
            f'<span class="cb-x" aria-hidden="true">×</span>'
            f'<a class="cb-logo" href="https://ito.gov.ir" target="_blank" rel="noopener" aria-label="سازمان فناوری اطلاعات ایران">{logo(root, LOGO_ITO)}</a></div>')


def eco_keys(x):
    return ' '.join([x['name_fa'], x['name_en'], ' '.join(x['data_domains']), x['description_fa'],
                     ' '.join(x['formats']), E_CAT[x['category']]['title'], E_SEC[x['sector_type']]['title'],
                     host_of(x['url'])]).lower()


def eco_attrs(x):
    return (f'data-id="{x["id"]}" data-c="{x["category"]}" data-s="{x["sector_type"]}" data-st="{x["status"]}" '
            f'data-api="{1 if x["api_available"] else 0}" data-acc="{" ".join(x["access_methods"])}" '
            f'data-k="{e(eco_keys(x))}"')


def eco_map(root):
    """نقشه‌ی زیست‌بوم: دوازده برش برای دسته‌ها، یک نقطه برای هر کنشگر؛ رسمیو در مرکز."""
    CX, CY = 550, 430
    pol = lambda r, d: (CX + r * math.cos(math.radians(d)), CY + r * math.sin(math.radians(d)))
    wedges, labels, links, dots, pos = [], [], [], [], {}
    for i, c in enumerate(CATALOG['categories']):
        a0 = -90 + 30 * i
        (x1, y1), (x2, y2), (x3, y3), (x4, y4) = pol(112, a0 + .7), pol(112, a0 + 29.3), pol(352, a0 + 29.3), pol(352, a0 + .7)
        wedges.append(f'<path class="wd{" alt" if i % 2 else ""}" data-c="{c["id"]}" style="--cc:{c["accent"]}" '
                      f'd="M{x1:.1f} {y1:.1f}A112 112 0 0 1 {x2:.1f} {y2:.1f}L{x3:.1f} {y3:.1f}A352 352 0 0 0 {x4:.1f} {y4:.1f}Z"/>')
        lx, ly = pol(376, a0 + 15)
        cs = math.cos(math.radians(a0 + 15))
        anc = 'start' if cs > .25 else 'end' if cs < -.25 else 'middle'
        labels.append(f'<a class="cl" href="{root}ecosystem/?cat={c["id"]}#catalog" data-cat-link="{c["id"]}" style="--cc:{c["accent"]}">'
                      f'<text x="{lx:.1f}" y="{ly + 5:.1f}" text-anchor="{anc}">{E_SHORT[c["id"]]}</text></a>')
        members = [x for x in E_ENT if x['category'] == c['id'] and x['id'] != 'rasmio']
        n = len(members)
        for j, x in enumerate(members):
            ring = j % 3
            cnt = (n - ring + 2) // 3
            ang = a0 + 30 * ((j // 3) + .5) / cnt
            pos[x['id']] = pol(176 + ring * 82, ang)
    for rid in E_BY['rasmio']['uses']:
        px, py = pos[rid]
        qx, qy = CX + (px - CX) * .45, CY + (py - CY) * .45
        links.append(f'<path class="lk" data-to="{rid}" d="M{CX} {CY}Q{qx + (py - CY) * .12:.1f} {qy - (px - CX) * .12:.1f} {px:.1f} {py:.1f}"/>')
    for x in E_ENT:
        if x['id'] not in pos:
            continue
        px, py = pos[x['id']]
        rad = 8.5 if x['api_available'] else 5.8
        ft = '<circle class="ft" r="14"/>' if x['featured'] else ''
        dots.append(f'<a class="nd st-{x["status"]}" href="{root}ecosystem/?open={x["id"]}" {eco_attrs(x)} '
                    f'transform="translate({px:.1f} {py:.1f})" style="--sc:{E_SEC[x["sector_type"]]["accent"]}" '
                    f'aria-label="{e(x["name_fa"])}">{ft}<circle class="hit" r="14"/><circle class="dt" r="{rad}"/></a>')
    p, w, h, alt = LOGO_RASMIO
    hub = (f'<a class="hub" href="{root}ecosystem/rasmio/" aria-label="رسمیو، لایه‌ی اتصال زیست‌بوم" data-id="rasmio">'
           f'<circle class="hub-r" cx="{CX}" cy="{CY}" r="74"/><circle class="hub-c" cx="{CX}" cy="{CY}" r="62"/>'
           f'<image href="{root}{p}" x="{CX - 46}" y="{CY - 14}" width="92" height="28.5"/>'
           f'<text x="{CX}" y="{CY + 36}" text-anchor="middle" class="hub-t">لایه‌ی اتصال</text></a>')
    return (f'<svg class="eco-map" viewBox="0 0 1100 860" role="group" aria-label="نقشه‌ی زیست‌بوم داده‌ی باز ایران">'
            f'{"".join(wedges)}<g class="lks">{"".join(links)}</g>{"".join(labels)}{hub}{"".join(dots)}</svg>')


def eco_legend():
    n = {s['id']: sum(1 for x in E_ENT if x['sector_type'] == s['id']) for s in CATALOG['sectors']}
    items = ''.join(f'<span><i style="background:{s["accent"]}"></i>{s["title"]} <b>{num(n[s["id"]])}</b></span>'
                    for s in CATALOG['sectors'])
    return (f'<div class="eco-legend">{items}<span class="lg-api"><i class="lg-big"></i>دارای API</span>'
            f'<span class="lg-un"><i class="lg-un"></i>تأیید نشد</span></div>')


def eco_card(x):
    cat, sec, st = E_CAT[x['category']], E_SEC[x['sector_type']], E_ST[x['status']]
    api = '<span class="ec-tag api">API</span>' if x['api_available'] else ''
    com = '<span class="ec-tag">جامعه</span>' if x['sector_type'] == 'community' else ''
    fmts = ''.join(f'<span class="ec-tag f eng">{e(f)}</span>' for f in x['formats'][:3])
    warn = ('<p class="ec-warn">ممکن است از خارج ایران در دسترس نباشد.</p>' if x['status'] == 'unverified' else '')
    chk = f'<span>آخرین بررسی: {jalali(x["last_verified"])}</span>' if x['last_verified'] else '<span>بررسی نشده</span>'
    en = f'<p class="ec-en eng">{e(x["name_en"])}</p>' if x['name_en'] and x['name_en'] != x['name_fa'] else ''
    return f"""<article class="ecard{' ft' if x['featured'] else ''}" {eco_attrs(x)} style="--c1:{cat['accent']};--sc:{sec['accent']}">
  <div class="ec-top"><span class="ec-cat">{E_SHORT[x['category']]}</span><span class="ec-st" style="--st:{st['accent']}"><i></i>{st['title']}</span></div>
  <h3>{e(x['name_fa'])}</h3>{en}
  <p class="ec-d">{e(x['description_fa'])}</p>
  <div class="ec-tags"><span class="ec-tag sec"><i></i>{sec['title']}</span>{api}{com}{fmts}</div>{warn}
  <div class="ec-foot">{chk}<a class="ec-go eng" href="{e(x['url'])}" target="_blank" rel="noopener nofollow" aria-label="{e(x['name_fa'])}: رفتن به سایت">{e(host_of(x['url']))} ↗</a></div>
  <button type="button" class="ec-open" data-open="{x['id']}" aria-label="جزئیات {e(x['name_fa'])}"></button>
</article>"""


def eco_row(x):
    st = E_ST[x['status']]
    acc = '، '.join(E_ACC[a]['title'] for a in x['access_methods'])
    return (f'<tr {eco_attrs(x)} tabindex="0" data-open="{x["id"]}"><th scope="row">{e(x["name_fa"])}'
            f'<span class="eng">{e(x["name_en"])}</span></th><td>{E_SHORT[x["category"]]}</td>'
            f'<td>{E_SEC[x["sector_type"]]["title"]}</td><td>{acc}</td>'
            f'<td><span class="ec-st" style="--st:{st["accent"]}"><i></i>{st["title"]}</span></td>'
            f'<td>{"●" if x["api_available"] else "—"}</td></tr>')


def eco_data_json():
    out = []
    for x in E_ENT:
        d = dict(x)
        d['jdate'] = jalali(x['last_verified']) if x['last_verified'] else ''
        d['host'] = host_of(x['url'])
        out.append(d)
    meta = {k: {i['id']: i for i in CATALOG[k]} for k in ('categories', 'sectors', 'access', 'statuses')}
    return json.dumps({'entries': out, 'meta': meta, 'short': E_SHORT}, ensure_ascii=False,
                      separators=(',', ':')).replace('</', '<\\/')


def write_eco_exports():
    import csv, io
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(['id', 'name_fa', 'name_en', 'url', 'category', 'sector_type', 'role', 'status', 'api_available',
                'access_methods', 'formats', 'license', 'last_verified', 'description_fa', 'source_urls'])
    for x in E_ENT:
        w.writerow([x['id'], x['name_fa'], x['name_en'], x['url'], x['category'], x['sector_type'], x['role'],
                    x['status'], int(x['api_available']), ' '.join(x['access_methods']), ' '.join(x['formats']),
                    x['license'], x['last_verified'] or '', x['description_fa'], ' '.join(x['source_urls'])])
    write('ecosystem/ecosystem.csv', '﻿' + buf.getvalue())
    write('ecosystem/ecosystem.json', json.dumps(
        {'categories': CATALOG['categories'], 'sectors': CATALOG['sectors'], 'access': CATALOG['access'],
         'statuses': CATALOG['statuses'], 'entries': E_ENT}, ensure_ascii=False, indent=1))


def rasmio_spot(root, count=False):
    """کارت ویژه‌ی رسمیو؛ عددها از ecosystem.json می‌آیند و منبع و تاریخشان زیرشان است."""
    a = ACTORS[0]

    def fnum(s):
        return float(s.translate(str.maketrans(FA, '0123456789')).replace('٫', '.'))
    figs = ''
    for f in a['figures'][:4]:
        v = fnum(f['value'])
        dec = 1 if v != int(v) else 0
        big = (f'<b data-to="{v:g}" data-dec="{dec}">{e(f["value"])}</b>' if count else f'<b>{e(f["value"])}</b>')
        figs += (f'<div><span class="pre">{e(f["prefix"])}</span>{big}<span class="unit">{e(f["unit"])}</span>'
                 f'<p>{e(f["label"])}</p></div>')
    return (f'<div class="rs-logo">{logo(root, LOGO_RASMIO)}</div>'
            f'<p class="rs-tag">{e(a["tagline"])}.</p><div class="rs-figs">{figs}</div>'
            f'<p class="rs-src">گزارش خود شرکت · {e(a["figures_source"])}</p>')


def build_ecosystem_index():
    intro = ECO['intro']
    blocks, _ = render_blocks(intro['body'], '../')
    fw = REPORT_BY_SLUG[intro['framework_slug']]
    root = '../'
    cats = CATALOG['categories']
    cnt = {c['id']: sum(1 for x in E_ENT if x['category'] == c['id']) for c in cats}
    chips = (f'<button type="button" class="chip on" data-eco-cat="">همه <span class="cnt">{num(N_ECO)}</span></button>'
             + ''.join(f'<button type="button" class="chip" data-eco-cat="{c["id"]}" style="--cc:{c["accent"]}"><i></i>'
                       f'{E_SHORT[c["id"]]} <span class="cnt">{num(cnt[c["id"]])}</span></button>' for c in cats))
    opt = lambda items, all_: (f'<option value="">{all_}</option>'
                               + ''.join(f'<option value="{i["id"]}">{i["title"]}</option>' for i in items))
    groups = ''.join(
        f'<section class="eco-grp" data-g="{c["id"]}" style="--c1:{c["accent"]}"><h3><i></i>{c["title"]}'
        f' <span>{num(cnt[c["id"]])}</span></h3><div class="eco-grid">'
        + ''.join(eco_card(x) for x in E_ENT if x['category'] == c['id']) + '</div></section>' for c in cats)
    rows = ''.join(eco_row(x) for c in cats for x in E_ENT if x['category'] == c['id'])
    gov = E_BY['data-gov-ir']
    ito_card = f"""<article class="feat feat-ito">
    <span class="feat-k">منتشرکننده</span>
    <div class="feat-logo plate">{logo(root, LOGO_ITO)}</div>
    <h3>{e(gov['name_fa'])}</h3>
    <p>درگاه واحد داده‌های باز دولت، زیر نظر سازمان فناوری اطلاعات ایران. داده‌ی هر دستگاه یک بار این‌جا منتشر می‌شود تا واسط‌ها و کاربران نهایی بتوانند به آن برسند.</p>
    <div class="feat-act"><a class="btn btn-ink" href="https://catalog.data.gov.ir/" target="_blank" rel="noopener">{ic('arrowr')}درگاه ملی داده‌ی باز</a>
      <a class="btn btn-line" href="https://iranfoia.ir/" target="_blank" rel="noopener">سامانه‌ی دسترسی آزاد به اطلاعات</a></div>
  </article>"""
    ras_card = f"""<article class="feat feat-ras">
    <span class="feat-k">واسط داده‌ی باز دولتی · از {ACTORS[0]['since']}</span>
    {rasmio_spot(root, count=False)}
    <div class="feat-act"><a class="btn btn-p" href="rasmio/">{ic('arrowr')}پروفایل کامل رسمیو</a>
      <a class="btn btn-g" href="https://rasmio.com" target="_blank" rel="noopener">rasmio.com ↗</a>
      <a class="btn btn-g" href="https://rasmio.com/content/about-api/" target="_blank" rel="noopener">API</a>
      <a class="btn btn-g" href="https://github.com/Rasmio-com" target="_blank" rel="noopener">GitHub</a></div>
  </article>"""
    flow = f"""<div class="eco-flow" aria-label="مسیر داده از انتشار تا کاربر">
    <div class="fl-n"><b>منتشرکنندگان</b><span>درگاه ملی، روزنامه‌ی رسمی، ثبت شرکت‌ها، ایران‌کد، گمرک، بانک مرکزی</span></div>
    <div class="fl-a" aria-hidden="true"><i></i><i></i><i></i></div>
    <div class="fl-n fl-mid"><b>لایه‌ی اتصال</b><span>رسمیو؛ خوانش ماشینی، پیوند میان منبع‌ها، API</span></div>
    <div class="fl-a" aria-hidden="true"><i></i><i></i><i></i></div>
    <div class="fl-n"><b>کاربران نهایی</b><span>نهادهای دولتی، بانک‌ها، خبرنگاران، پژوهشگران، کسب‌وکارها</span></div>
  </div>"""
    stats = ''.join(f'<div><b data-to="{n}">{num(n)}</b><span>{t}</span></div>' for n, t in
                    [(N_ECO, 'کنشگر در فهرست'), (len(cats), 'دسته'), (N_ECO_API, 'دارای API'),
                     (len(CATALOG['sectors']), 'بخش')])
    ld = json.dumps([
        {'@context': 'https://schema.org', '@type': 'ItemList', 'name': 'زیست‌بوم داده‌ی باز ایران',
         'numberOfItems': N_ECO,
         'itemListElement': [{'@type': 'ListItem', 'position': i + 1, 'name': x['name_fa'], 'url': x['url']}
                             for i, x in enumerate(E_ENT)]},
        {'@context': 'https://schema.org', '@type': 'Organization', 'name': 'رسمیو', 'alternateName': 'Rasmio',
         'url': 'https://rasmio.com',
         'sameAs': ['https://github.com/Rasmio-com', 'https://www.linkedin.com/company/rasmio']}],
        ensure_ascii=False).replace('</', '<\\/')
    body = f"""<main class="eco" style="--c1:#1D4ED8;--c2:#60A5FA">
<section class="case-hero eco-hero"><div class="wrap">
  <div class="crumb"><a href="../">خانه</a>{ic('arrow')}<span>زیست‌بوم ایران</span></div>
  <h1>زیست‌بوم داده‌ی باز ایران</h1>
  <p class="sub">{e(intro['sub'])}</p>
  <div class="eco-stats">{stats}</div>
  {cobrand(root, 'on-dark')}
</div></section>

<div class="wrap">
<section class="eco-feat" aria-label="کنشگران ویژه">
  <div class="eco-feat-grid">{ito_card}{ras_card}</div>
  {flow}
</section>

<section class="eco-mapsec">
  <div class="sec-head"><span class="sec-kicker">نقشه‌ی زیست‌بوم</span>
    <h2>{num(N_ECO)} کنشگر در {num(len(cats))} دسته، با رسمیو در مرکز</h2>
    <p>هر نقطه یک کنشگر است. رنگ نقطه بخش آن را نشان می‌دهد و نقطه‌ی بزرگ‌تر یعنی API دارد. خط‌های آبی نشان می‌دهند رسمیو از کدام منبع‌ها می‌خواند. روی نقطه بروید، یا بزنید تا جزئیاتش باز شود؛ با فیلترهای پایین، نقطه‌هایی که با جست‌وجوی شما نمی‌خوانند کم‌رنگ می‌شوند.</p></div>
  <div class="eco-map-wrap">{eco_map(root)}</div>
  {eco_legend()}
</section>

<section class="eco-cat" id="catalog">
  <div class="sec-head"><span class="sec-kicker">فهرست کامل</span>
    <h2>جست‌وجو و فیلتر</h2>
    <p>بر اساس دسته، بخش، روش دسترسی و وضعیت فیلتر کنید یا در نام، حوزه‌ی داده و توضیح جست‌وجو کنید.</p></div>
  <div class="eco-bar" data-eco-bar>
    <div class="eco-bar-row">
      <label class="search"><input type="search" data-eco-q placeholder="جست‌وجو: نام، حوزه‌ی داده، قالب…" aria-label="جست‌وجو در کنشگران">{ic('search')}</label>
      <label class="eco-sel"><span class="sr">بخش</span><select data-eco-sector aria-label="فیلتر بخش">{opt(CATALOG['sectors'], 'همه‌ی بخش‌ها')}</select></label>
      <label class="eco-sel"><span class="sr">روش دسترسی</span><select data-eco-acc aria-label="فیلتر روش دسترسی">{opt(CATALOG['access'], 'هر روش دسترسی')}</select></label>
      <div class="seg" role="group" aria-label="نمای نتایج"><button type="button" data-eco-v="grid" aria-pressed="true">کارت</button><button type="button" data-eco-v="table" aria-pressed="false">جدول</button></div>
    </div>
    <div class="filters eco-chips" role="group" aria-label="فیلتر دسته">{chips}</div>
    <div class="eco-bar-row eco-bar-foot">
      <label class="tg"><input type="checkbox" data-eco-api><span>دارای API</span></label>
      <label class="tg"><input type="checkbox" data-eco-act><span>فقط فعال‌ها</span></label>
      <label class="tg"><input type="checkbox" data-eco-unv><span>پنهان کردن «تأیید نشد»</span></label>
      <span class="eco-count" aria-live="polite"><b data-eco-n>{num(N_ECO)}</b> از {num(N_ECO)} کنشگر</span>
      <button type="button" class="eco-reset" data-eco-reset hidden>پاک کردن فیلترها</button>
    </div>
  </div>
  <div class="eco-groups" data-eco-grid>{groups}</div>
  <div class="eco-tablewrap" data-eco-table hidden><table class="eco-table"><thead><tr><th scope="col">نام</th><th scope="col">دسته</th><th scope="col">بخش</th><th scope="col">دسترسی</th><th scope="col">وضعیت</th><th scope="col">API</th></tr></thead><tbody>{rows}</tbody></table></div>
  <div class="empty" data-eco-empty hidden><b>چیزی پیدا نشد</b>فیلترها را سبک‌تر کنید یا واژه‌ی دیگری را امتحان کنید.</div>
</section>

<section class="eco-about">
  <article class="article" style="padding:20px 0 30px;max-width:78ch">
  {blocks}
  <p>{e(intro['framework'])} <a href="../reports/{fw['slug']}/" style="color:var(--accent);font-weight:600">{e(fw['title'])} ←</a></p>
  </article>
  <div class="eco-dl">
    <a class="btn btn-ink" href="ecosystem.csv" download>{ic('doc')}دریافت فهرست (CSV)</a>
    <a class="btn btn-line" href="ecosystem.json" download>JSON</a>
    <a class="btn btn-line" href="https://github.com/Rasmio-com/odimpact-fa/issues/new" target="_blank" rel="noopener">کنشگر یا اصلاحیه پیشنهاد دهید ↗</a>
  </div>
  <p class="note">«فعال» یعنی در بررسی اخیر شواهد وجود سامانه دیده شد؛ «تأیید نشد» یعنی فقط از فهرست‌های ثانویه می‌دانیم و آزمون مستقیم نکرده‌ایم. دامنه‌های ‎.ir ممکن است از خارج ایران باز نشوند. حضور در فهرست به معنی تأیید یا ارزیابی کیفیت نیست.</p>
</section>
</div>

<div class="eco-ov" data-eco-ov hidden></div>
<aside class="eco-drawer" data-eco-drawer role="dialog" aria-modal="true" aria-labelledby="eco-dr-t" hidden>
  <button type="button" class="eco-x" data-eco-close aria-label="بستن">×</button>
  <div class="eco-dr-in" data-eco-dr></div>
</aside>
<script type="application/json" id="eco-data">{eco_data_json()}</script>
</main>"""
    write('ecosystem/index.html', page(
        body, title=f'زیست‌بوم داده‌ی باز ایران — {SITE}',
        desc='کاتالوگ تعاملی و فیلترپذیر کنشگران داده‌ی باز ایران؛ محصول مشترک رسمیو و سازمان فناوری اطلاعات ایران',
        root=root, active='ecosystem/',
        extra_head=f'<script type="application/ld+json">{ld}</script>\n',
        extra_foot='<script src="../assets/js/ecosystem.js" defer></script>\n'))
    write_eco_exports()


def build_actor(a):
    root = '../../'
    body_html, toc = render_blocks(a['body'], root, a)

    def rel(href, k, t):
        return f'<a class="relitem" href="{href}"><span class="k">{e(k)}</span><b>{e(t)}</b></a>'

    extra, n = [], sum(1 for b in a['body'] if b['type'] == 'h2')
    items = ''.join(rel(f'{root}cases/{s}/', f'{BYCAT[BYSLUG[s]["category"]]["title"]} · {BYSLUG[s]["country"]}',
                        BYSLUG[s]['title']) for s in a['related_cases'])
    items += ''.join(rel(f'{root}reports/{s}/', 'گزارش فارسی', REPORT_BY_SLUG[s]['title'])
                     for s in a['related_reports'])
    n += 1
    toc.append(f'<a href="#h-{n}">هم‌ارزهای جهانی</a>')
    extra.append(f'<h2 id="h-{n}">هم‌ارزهای جهانی</h2><p>مطالعه‌ها و گزارش‌هایی در همین سایت که همین نقش را در جای دیگری '
                 f'روایت می‌کنند.</p><div class="rel">{items}</div>')
    laws = ''.join(rel(f'{root}laws/#law-{x}', LAW_BY_NO[x]['title'], f'{law_label(LAW_BY_NO[x])} · {LAW_BY_NO[x]["date"]}')
                   for x in a['related_laws'])
    n += 1
    toc.append(f'<a href="#h-{n}">پشتوانه‌ی قانونی</a>')
    extra.append(f'<h2 id="h-{n}">پشتوانه‌ی قانونی</h2><p>{e(a["related_laws_note"])}</p><div class="rel">{laws}</div>')
    refs = ''.join(
        f'<li>{e("، ".join(r["authors"]) + ". " if r["authors"] else "")}<b>{e(r["title"])}</b>. {e(r["venue"])}'
        f'{f" ({num(r["year"])})" if r["year"] else ""}'
        f'{f" <a href={chr(34)}{e(r["url"])}{chr(34)} target=_blank rel=noopener>پیوند ↗</a>" if r["url"] else ""}</li>'
        for r in a['refs'])
    n += 1
    toc.append(f'<a href="#h-{n}">منبع‌ها</a>')
    extra.append(f'<h2 id="h-{n}">منبع‌ها</h2><ul class="srcs">{refs}</ul>')

    summary = '<div class="summary rv"><span class="t">' + ic('spark') + 'خلاصه‌ی مطلب</span>' + ''.join(
        f'<p>{e(x)}</p>' for x in a['summary']) + '</div>'
    keys = ('<div class="keys rv"><div class="t">' + ic('spark') + 'نکات کلیدی</div><ol>'
            + ''.join(f'<li>{e(k)}</li>' for k in a['key_points']) + '</ol></div>')
    tocbox = f'<aside class="toc"><div class="t">در این مطلب</div>{"".join(toc)}</aside>'
    meta = (f'<span>{ic("net")}{e(a["role"])}</span><span>{ic("cal")}فعال از {a["since"]}</span>'
            f'<span>{ic("arrowr")}<a href="{e(a["url"])}" target="_blank" rel="noopener" class="eng">'
            f'{e(a["url"].replace("https://", ""))}</a></span>')
    body = f"""<div class="progress" style="--c1:{a['accent']};--c2:{a['accent2']}"></div>
<main style="--c1:{a['accent']};--c2:{a['accent2']}">
<section class="case-hero"><div class="wrap">
  <div class="crumb"><a href="{root}">خانه</a>{ic('arrow')}<a href="../">زیست‌بوم ایران</a>{ic('arrow')}<span>{e(a['name'])}</span></div>
  <h1>{e(a['name'])}</h1>
  <p class="sub">{e(a['tagline'])}</p>
  <p class="en"><span class="eng">{e(a['name_en'])}</span></p>
  <div class="case-meta">{meta}</div>
</div></section>
<div class="wrap"><div class="layout">
  <article class="article">
    {summary}
    {keys}
    {body_html}
    {''.join(extra)}
  </article>
  {tocbox}
</div></div>
</main>"""
    write(f'ecosystem/{a["slug"]}/index.html', page(
        body, title=f'{a["name"]}، {a["role"]} — {SITE}', desc=a['summary'][0][:170],
        root=root, active='ecosystem/'))


# ── قوانین ایران ──────────────────────────────────────────────────
def build_laws():
    groups, laws = LAWS['groups'], LAWS['laws']
    cnt = {g['slug']: sum(1 for x in laws if x['group'] == g['slug']) for g in groups}
    chips = (f'<button class="chip on" data-cat="all">همه '
             f'<span class="cnt">{num(len(laws))}</span></button>')
    chips += ''.join(
        f'<button class="chip" data-cat="{g["slug"]}" style="--cc:{REPORT_ACCENT}"><i></i>'
        f'{g["title"]} <span class="cnt">{num(cnt[g["slug"]])}</span></button>'
        for g in groups if cnt[g['slug']])

    def actor_chip(lw):
        return ''.join(f'<span><a href="../ecosystem/{a["slug"]}/">{ic("net")}کنشگر مرتبط: {e(a["name"])}</a></span>'
                       for a in LAW_ACTORS.get(lw['no'], []))

    rows = ''.join(f"""<article class="law rv" id="law-{lw['no']}" data-card="{lw['group']}"
 data-k="{e((lw['title'] + ' ' + lw['source'] + ' ' + lw['date'] + ' ' + lw['text']).lower())}">
  <div class="law-head">
    <span class="law-no">{num(lw['no'])}</span>
    <div><h3>{e(lw['title'])}</h3>
      <div class="law-meta"><span>{ic('cal')}{e(lw['date'])}</span><span>{ic('doc')}{e(lw['source'])}</span>{actor_chip(lw)}</div>
    </div>
  </div>
  <details><summary>متن مصوبه</summary><p>{e(lw['text'])}</p></details>
</article>""" for lw in laws)

    body = f"""<main style="--c1:{REPORT_ACCENT};--c2:{REPORT_ACCENT2}">
<section class="case-hero" style="padding:62px 0"><div class="wrap">
  <div class="crumb"><a href="../">خانه</a>{ic('arrow')}<span>قوانین ایران</span></div>
  <h1>داده‌ی باز در قوانین ایران</h1>
  <p class="sub">هر مفادی از قانون اساسی تا مصوبه‌های هیأت وزیران که به دسترسی آزاد به اطلاعات و انتشار داده مربوط می‌شود.</p>
</div></section>
<div class="wrap"><section style="padding-bottom:70px">
  <p class="lead" style="max-width:74ch;margin:0 0 26px">
    <b data-count>{num(len(laws))}</b> مفاد قانونی، از اصل ۵۵ قانون اساسی (۱۳۵۸) تا مصوبه‌های اخیر.
    روی نوع مأخذ فیلتر کنید یا در عنوان و متن مصوبه‌ها جست‌وجو کنید.</p>
  <div class="filters">
    {chips}
    <label class="search">
      <input type="search" data-search placeholder="جست‌وجو در عنوان و متن مصوبه‌ها…" aria-label="جست‌وجو">
      {ic('search')}
    </label>
  </div>
  <div class="laws" data-list>{rows}</div>
  <div class="empty" data-empty style="display:none"><b>چیزی پیدا نشد</b>واژه‌ی دیگری را امتحان کنید.</div>
  <p class="note">این فهرست به‌صورت خودکار از سند اصلی استخراج شده است. متن هر مصوبه
    برای مطالعه است، نه برای استناد حقوقی؛ برای استناد به متن رسمی قانون مراجعه کنید.
    <a href="../assets/docs/قوانین-داده-باز-ایران.pdf" download>دریافت سند اصلی (PDF)</a></p>
</section></div>
</main>"""
    write('laws/index.html', page(
        body, title=f'قوانین داده‌ی باز در ایران — {SITE}',
        desc='فهرست مفاد قانونی ایران درباره‌ی دسترسی آزاد به اطلاعات و داده‌ی باز',
        root='../', active='laws/', extra_foot=HOME_INDICES_META))


# ── ایران در شاخص‌های جهانی ──────────────────────────────────────
def build_indices():
    """داشبورد و صفحه‌ی هر شاخص؛ خروجی آماده در data/indices/ که فقط ریشه‌ی دارایی‌ها در آن‌ها می‌نشیند."""
    d = os.path.join(ROOT, 'data', 'indices')
    for fn in sorted(os.listdir(d)):
        name = fn[:-5]
        dash = name == 'index'
        root = '../' if dash else '../../'
        html = load_html('indices/' + fn)
        head = (f'<link rel="preload" href="{root}assets/fonts/YekanBakh-Regular.woff2" as="font" type="font/woff2" crossorigin>\n'
                f'<link rel="preload" href="{root}assets/fonts/YekanBakh-Black.woff2" as="font" type="font/woff2" crossorigin>\n'
                f'<link rel="stylesheet" href="{root}assets/css/style.css">\n'
                f'<link rel="icon" href="{root}assets/favicon.svg" type="image/svg+xml">')
        html = html.replace('<style>%%CSS%%</style>', head)
        scripts = f'<script src="{root}assets/js/app.js" defer></script>'
        if dash:
            scripts += (f'\n<script src="{root}assets/js/chart.min.js" defer></script>'
                        f'\n<script src="{root}assets/js/indices.js" defer></script>')
        html = re.sub(r'<script>%%APP%%</script>(\s*<script>%%CHART%%</script>\s*<script>%%IDXJS%%</script>)?',
                      lambda m: scripts, html)
        assert '%%' not in html, fn
        write('indices/index.html' if dash else f'indices/{name}/index.html', html)


# ── کتابخانه‌ی منابع ──────────────────────────────────────────────
def build_library():
    groups, items = LIB['groups'], LIB['items']
    cnt = {g['slug']: sum(1 for x in items if x['group'] == g['slug']) for g in groups}
    chips = (f'<button class="chip on" data-cat="all">همه '
             f'<span class="cnt">{num(len(items))}</span></button>')
    chips += ''.join(
        f'<button class="chip" data-cat="{g["slug"]}" style="--cc:{REPORT_ACCENT}"><i></i>'
        f'{g["title"]} <span class="cnt">{num(cnt[g["slug"]])}</span></button>'
        for g in groups)

    def row(it):
        bits = []
        if it['authors']:
            bits.append(f'<span class="eng">{e("، ".join(it["authors"]))}</span>')
        if it['venue']:
            bits.append(f'<i>{e(it["venue"])}</i>')
        if it['pages']:
            bits.append(f'{num(it["pages"])} صفحه')
        link = it['url'] or (f'https://doi.org/{it["doi"]}' if it['doi'] else '')
        go = (f'<a class="go" href="{e(link)}" target="_blank" rel="noopener">منبع اصلی ↗</a>'
              if link else '')
        cls = ' fa' if it['lang'] == 'fa' else ''
        return f"""<article class="ref rv{cls}" data-card="{it['group']}"
 data-k="{e((it['title'] + ' ' + ' '.join(it['authors']) + ' ' + it['venue'] + ' ' + it['year']).lower())}">
  <span class="yr">{num(it['year']) if it['year'] else '—'}</span>
  <div><h3>{e(it['title'])}</h3>
    <div class="ref-meta">{' · '.join(bits)}</div></div>
  {go}
</article>"""

    body = f"""<main style="--c1:{REPORT_ACCENT};--c2:{REPORT_ACCENT2}">
<section class="case-hero" style="padding:62px 0"><div class="wrap">
  <div class="crumb"><a href="../">خانه</a>{ic('arrow')}<span>منابع</span></div>
  <h1>کتابخانه‌ی منابع</h1>
  <p class="sub">فهرست پژوهش‌ها، گزارش‌ها و کتاب‌هایی که پشتوانه‌ی محتوای این سایت بوده‌اند.</p>
</div></section>
<div class="wrap"><section style="padding-bottom:70px">
  <p class="lead" style="max-width:74ch;margin:0 0 26px">
    <b data-count>{num(len(items))}</b> منبع، دسته‌بندی‌شده بر اساس موضوع. خودِ فایل‌ها اینجا
    منتشر نشده‌اند؛ هرجا نشانی منبع اصلی در دسترس بوده، لینک آمده است.</p>
  <div class="filters">
    {chips}
    <label class="search">
      <input type="search" data-search placeholder="جست‌وجو در عنوان و نام نویسنده…" aria-label="جست‌وجو">
      {ic('search')}
    </label>
  </div>
  <div class="refs" data-list>{''.join(row(i) for i in items)}</div>
  <div class="empty" data-empty style="display:none"><b>چیزی پیدا نشد</b>واژه‌ی دیگری را امتحان کنید.</div>
</section></div>
</main>"""
    write('library/index.html', page(
        body, title=f'کتابخانه‌ی منابع — {SITE}',
        desc='فهرست منابع پژوهشی درباره‌ی داده‌ی باز و حکمرانی داده',
        root='../', active='library/'))


# ── درباره ────────────────────────────────────────────────────────
def build_about():
    rows = ''.join(f"""<tr><td style="font-weight:700;color:{c['accent']}">{c['title']}</td>
      <td><span class="eng">{c['title_en']}</span></td>
      <td>{num(sum(1 for x in CASES if x['category'] == c['slug']))}</td></tr>""" for c in CATS)
    body = f"""<main>
<section class="case-hero" style="--c1:#6C5CE7;--c2:#0EA5A5;padding:66px 0"><div class="wrap">
  <div class="crumb"><a href="../">خانه</a>{ic('arrow')}<span>درباره</span></div>
  <h1>درباره‌ی این پروژه</h1>
  <p class="sub">چرا مستندسازی تأثیر داده‌ی باز اهمیت دارد و این سایت دقیقاً چیست.</p>
</div></section>
<div class="wrap"><article class="article" style="padding:56px 0 90px;--c1:#6C5CE7;--c2:#A78BFA">
  <p class="lede">سال‌هاست درباره‌ی وعده‌های داده‌ی باز حرف زده می‌شود؛ اما شواهد تجربی درباره‌ی این‌که آزادسازی داده‌های عمومی دقیقاً <em>چه چیزی</em> را تغییر می‌دهد، پراکنده و کم بوده است.</p>
  <p>پروژه‌ی <span class="eng">Open Data’s Impact</span> در <span class="eng">GovLab</span> دانشگاه نیویورک، با حمایت بنیاد اُمیدیار، به همین پرسش پاسخ می‌دهد: مجموعه‌ای از مطالعات موردی مستند از سراسر جهان که هر کدام یک ابتکار داده‌ی باز را از آغاز تا پیامدهایش دنبال می‌کنند — شامل جایی که کار نکرده است.</p>
  <h2>این سایت چیست</h2>
  <p>هسته‌ی سایت روایت فارسیِ آن مجموعه است: {num(len(CASES))} مطالعه‌ی موردی ترجمه‌شده، بازچینی‌شده برای خواندن روی وب، همراه با شکل‌ها و نمودارهای اصلی. متن‌ها راست‌چین و با قلم یکان بخ صفحه‌آرایی شده‌اند تا خواندن روان باشد.</p>
  <p>کنار آن سه بخش دیگر هست که تجربه‌ی جهانی را به زمینه‌ی ایران وصل می‌کند:
    <a href="../cases/?cat=reports">{num(len(REPORTS))} گزارش فارسی</a> (تألیفی و ترجمه‌ای، از منشور
    بین‌المللی داده‌ی باز تا نقد به طرح پورتال ملی داده)،
    <a href="../laws/">{num(len(LAWS['laws']))} مفاد قانونی ایران</a> درباره‌ی دسترسی آزاد به
    اطلاعات، و <a href="../library/">کتاب‌شناسیِ {num(len(LIB['items']))} منبع</a> پژوهشی.</p>
  <p>بخش چهارم، <a href="../ecosystem/">زیست‌بوم داده‌ی باز ایران</a>، از سمت دیگر ماجرا می‌آید: به‌جای
    این‌که فقط از سیاست و قانون بگوید، {num(N_ECO)} کنشگر را در یک کاتالوگ تعاملی نشان می‌دهد؛ از درگاه‌های
    ملی و آمار رسمی تا داده‌های فارسی و خدمت‌های خصوصی. <a href="../ecosystem/rasmio/">رسمیو</a> پروفایل کامل دارد:
    از چه داده‌ای استفاده می‌کند و خدمتش در چهار بُعد تأثیر چه جایی دارد، بی‌آنکه خودِ داده را منتشر کنیم.</p>
  <h2>محصول مشترک</h2>
  <div style="margin:1.2em 0">{cobrand('../', 'on-light')}</div>
  <p>این سایت محصول مشترک <a href="https://rasmio.com" target="_blank" rel="noopener">رسمیو</a> و
    <a href="https://ito.gov.ir" target="_blank" rel="noopener">سازمان فناوری اطلاعات ایران</a> است. سازمان فناوری
    اطلاعات، که درگاه ملی داده‌ی باز را اداره می‌کند، نگاه حاکمیتیِ انتشار داده را به پروژه می‌آورد و رسمیو
    تجربه‌ی ساختن خدمت روی داده‌ی رسمی را. متن مطالعات موردی همچنان از گاورلب است و نشان این دو نهاد
    تأییدی بر محتوای منبع‌های خارجی نیست.</p>
  <h2>چهار بُعد تأثیر</h2>
  <p>گاورلب تأثیر داده‌ی باز را در چهار بُعد دسته‌بندی می‌کند. توزیع مطالعات این مجموعه چنین است:</p>
  <div style="overflow-x:auto;margin:1.6em 0">
  <table style="width:100%;border-collapse:collapse;font-size:16.5px">
    <thead><tr style="border-bottom:2px solid var(--line)">
      <th style="text-align:right;padding:12px 8px">بُعد</th>
      <th style="text-align:right;padding:12px 8px">عنوان اصلی</th>
      <th style="text-align:right;padding:12px 8px">تعداد</th></tr></thead>
    <tbody>{rows}</tbody>
  </table></div>
  <h2>روش کار</h2>
  <p>هر مطالعه‌ی موردی از فایل اصلی ترجمه‌شده استخراج و به‌صورت خودکار به ساختار وب تبدیل شده است: خلاصه‌ی مطلب، نکات کلیدی، بخش‌بندی موضوعی و شکل‌ها. کد این تبدیل و کد تولید سایت هر دو در همین مخزن در دسترس‌اند.</p>
  <h2>حق مؤلف</h2>
  <p>منشأ محتوا یکسان نیست و هر بخش جداگانه نشان‌گذاری شده است:</p>
  <ul>
    <li>متن اصلی مطالعات موردی متعلق به <span class="eng">The GovLab</span> در دانشگاه نیویورک است و روی <a href="https://odimpact.org" target="_blank" rel="noopener" style="color:var(--accent);font-weight:600">odimpact.org</a> منتشر شده؛ این سایت روایت فارسی و غیرتجاری آن است.</li>
    <li>گزارش‌های فارسی تألیف یا ویرایش نویسندگان همین مجموعه‌اند. آن‌هایی که بر پایه‌ی سند دیگری نوشته یا از متنی ترجمه شده‌اند، در پایان هر گزارش منبعشان آمده است — از جمله منشور بین‌المللی داده‌ی باز که با پروانه‌ی <span class="eng">CC BY</span> منتشر شده.</li>
    <li>متن مفاد قانونی از قوانین موضوعه‌ی کشور است و به‌صورت خودکار از یک سند جمع‌آوری‌شده استخراج شده؛ برای استناد حقوقی به متن رسمی مراجعه کنید.</li>
    <li>کتابخانه‌ی منابع فقط فهرست کتاب‌شناختی است؛ هیچ فایلی از آثار دیگران اینجا منتشر نشده است.</li>
  </ul>
</article></div>
</main>"""
    write('about/index.html', page(body, title=f'درباره — {SITE}',
                                   desc='درباره‌ی پروژه‌ی تأثیر داده‌ی باز و این روایت فارسی',
                                   root='../', active='about/'))


def build_404():
    body = f"""<main><section class="hero" style="min-height:64vh;display:grid;place-items:center"><div class="wrap" style="text-align:center">
  <h1 style="max-width:none">صفحه‌ای که دنبالش بودید پیدا نشد</h1>
  <p class="lead" style="margin-inline:auto">شاید نشانی تغییر کرده باشد. از فهرست مطالعات موردی شروع کنید.</p>
  <div class="hero-cta" style="justify-content:center">
    <a class="btn btn-p" href="{BASE}">بازگشت به خانه</a>
    <a class="btn btn-g" href="{BASE}cases/">فهرست مطالب</a>
  </div>
</div></section></main>"""
    write('404.html', page(body, title=f'پیدا نشد — {SITE}', desc='صفحه پیدا نشد', root=BASE))


def build_extras():
    write('assets/favicon.svg', """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="#6C5CE7"/><stop offset=".42" stop-color="#0EA5A5"/>
<stop offset=".74" stop-color="#E8850C"/><stop offset="1" stop-color="#E11D62"/></linearGradient></defs>
<rect width="64" height="64" rx="18" fill="url(#g)"/>
<circle cx="32" cy="32" r="10" fill="#fff"/></svg>""")
    write('.nojekyll', '')
    write('robots.txt', 'User-agent: *\nAllow: /\n')
    urls = (['', 'cases/', 'ecosystem/', 'laws/', 'indices/', 'library/', 'about/']
            + [f'ecosystem/{a["slug"]}/' for a in ACTORS]
            + [f'indices/{n[:-5]}/' for n in sorted(os.listdir(os.path.join(ROOT, 'data', 'indices'))) if n != 'index.html']
            + [f'cases/{c["slug"]}/' for c in CASES]
            + [f'reports/{r["slug"]}/' for r in REPORTS])
    write('sitemap.txt', '\n'.join(urls))


def write(rel, content):
    p = os.path.join(OUT, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, 'w', encoding='utf8') as f:
        f.write(content)


def main():
    build_home()
    build_index()
    order = [c for cat in CATS for c in CASES if c['category'] == cat['slug']]
    for i, c in enumerate(order):
        build_case(c, order[i - 1] if i else None, order[i + 1] if i + 1 < len(order) else None)
    rorder = [r for t in TOPICS for r in REPORTS if r['topic'] == t['slug']]
    for i, r in enumerate(rorder):
        build_report(r, rorder[i - 1] if i else None,
                     rorder[i + 1] if i + 1 < len(rorder) else None)
    build_ecosystem_index()
    for a in ACTORS:
        build_actor(a)
    build_laws()
    build_indices()
    build_library()
    build_about()
    build_404()
    build_extras()
    print(f'ساخته شد: {len(order) + len(rorder) + len(ACTORS) + 7} صفحه')


if __name__ == '__main__':
    main()
