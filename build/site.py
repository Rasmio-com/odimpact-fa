# -*- coding: utf-8 -*-
"""تولید صفحه‌های ایستای سایت از روی data/cases.json"""
import colorsys, html, json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'site')
# مسیر پایه‌ی سایت روی سرور؛ برای گیت‌هاب‌پیجزِ یک مخزن پروژه «/<نام مخزن>/» است.
# اگر دامنه‌ی اختصاصی تنظیم شد، ODFA_BASE=/ بگذارید. فقط صفحه‌ی ۴۰۴ به آن نیاز دارد،
# چون در هر مسیری ممکن است سرو شود و نمی‌تواند نشانی نسبی داشته باشد.
BASE = os.environ.get('ODFA_BASE', '/odimpact-fa/')


def load(name):
    return json.load(open(os.path.join(ROOT, 'data', name), encoding='utf8'))


DATA = load('cases.json')
CATS = DATA['categories']
CASES = DATA['cases']
BYCAT = {c['slug']: c for c in CATS}

REPORTS = load('reports.json')['reports']
TOPICS = load('reports.json')['topics']
BYTOPIC = {t['slug']: t for t in TOPICS}
LAWS = load('laws.json')
LIB = load('library.json')

REPORT_ACCENT, REPORT_ACCENT2 = '#0F766E', '#5EEAD4'

SITE = 'تأثیر داده‌ی باز'
TAGLINE = 'سی‌وهفت مطالعه‌ی موردی از سراسر جهان درباره‌ی این‌که داده‌ی باز واقعاً چه چیزی را تغییر داده است'
FA = '۰۱۲۳۴۵۶۷۸۹'

e = html.escape
def num(n): return str(n).translate(str.maketrans('0123456789', FA))

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
}
def ic(name, cls=''):
    return (f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" '
            f'stroke-linecap="round" stroke-linejoin="round"{f" class={cls}" if cls else ""}>{ICON[name]}</svg>')


def page(body, *, title, desc, root, active='', extra_head='', cls=''):
    y = num(1404)
    nav_items = [('', 'خانه'), ('cases/', 'مطالعات موردی'), ('laws/', 'قوانین ایران'),
                 ('library/', 'منابع'), ('about/', 'درباره'), ]
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
    </div>
    <div><h4>ابعاد تأثیر</h4><ul>{foot_cats}</ul></div>
    <div><h4>پیوندها</h4><ul>
      <li><a href="{root}cases/">همه‌ی مطالعات موردی</a></li>
      <li><a href="{root}cases/?cat=reports">گزارش‌های فارسی</a></li>
      <li><a href="{root}laws/">قوانین داده‌ی باز در ایران</a></li>
      <li><a href="{root}library/">کتابخانه‌ی منابع</a></li>
      <li><a href="{root}about/">درباره‌ی این پروژه</a></li>
      <li><a href="https://odimpact.org" rel="noopener" target="_blank">odimpact.org<span class="eng"> ↗</span></a></li>
      <li><a href="https://thegovlab.org" rel="noopener" target="_blank">The GovLab<span class="eng"> ↗</span></a></li>
    </ul></div>
  </div>
  <div class="f-bot">
    <span>متن اصلی از گاورلب دانشگاه نیویورک · ترجمه‌ی فارسی</span>
    <span>ساخته‌شده با قلم یکان بخ</span>
  </div>
</div></footer>
<div class="lb"><img alt=""></div>
<script src="{root}assets/js/app.js" defer></script>
</body></html>"""


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
    dims = ''.join(f"""<a class="dim rv" href="cases/?cat={c['slug']}" style="--c1:{c['accent']};--c2:{c['accent2']}">
  <span class="ic"><svg viewBox="0 0 24 24"><path d="{c['icon']}"/></svg></span>
  <h3>{c['title']}</h3>
  <p>{e(c['desc'])}</p>
  <span class="n">{num(sum(1 for x in CASES if x['category'] == c['slug']))} مطالعه‌ی موردی {ic('arrow')}</span>
</a>""" for c in CATS)

    featured = ['us-gps', 'sierra-leone-ebola', 'uruguay-a-tu-servicio',
                'slovakia-open-contracting', 'nyc-business-atlas', 'eightmaps']
    feat = ''.join(card(next(x for x in CASES if x['slug'] == s), '') for s in featured)

    body = f"""<main>
<section class="hero"><div class="wrap">
  <span class="eyebrow"><i></i>پروژه‌ی «تأثیر داده‌ی باز» گاورلب دانشگاه نیویورک — به فارسی</span>
  <h1>داده‌ی باز <span class="grad">چه چیزی</span> را واقعاً تغییر داد؟</h1>
  <p class="lead">{TAGLINE}. از نبرد با ابولا در سیرالئون تا اقتصاد میلیارد‌دلاری جی‌پی‌اس؛ روایت‌هایی مستند از موفقیت‌ها، شکست‌ها و درس‌هایی که ماند.</p>
  <div class="hero-cta">
    <a class="btn btn-p" href="cases/">{ic('grid')}کاوش در مطالعات موردی</a>
    <a class="btn btn-g" href="#dims">چهار بُعد تأثیر</a>
  </div>
</div></section>

<div class="wrap"><div class="stats rv">
  <div><b>{num(len(CASES))}</b><span>مطالعه‌ی موردی</span></div>
  <div><b>{num(len(REPORTS))}</b><span>گزارش فارسی</span></div>
  <div><b>{num(countries)}</b><span>کشور و قلمرو</span></div>
  <div><b>{num(len(LAWS['laws']))}</b><span>مفاد قانونی ایران</span></div>
  <div><b>{num(round(words_total / 1000))} هزار</b><span>واژه‌ی فارسی</span></div>
</div></div>

<section id="dims"><div class="wrap">
  <div class="sec-head rv">
    <span class="sec-kicker">چارچوب تحلیلی</span>
    <h2>داده‌ی باز از چهار مسیر اثر می‌گذارد</h2>
    <p>گاورلب پس از بررسی ده‌ها ابتکار در سراسر جهان، تأثیر داده‌ی باز را در چهار بُعد دسته‌بندی کرد. هر مطالعه‌ی موردی ذیل یکی از این ابعاد قرار می‌گیرد.</p>
  </div>
  <div class="dims">{dims}</div>
</div></section>

<section style="background:var(--paper-2);border-block:1px solid var(--line)"><div class="wrap">
  <div class="sec-head rv">
    <span class="sec-kicker">پیشنهاد سردبیر</span>
    <h2>از کجا شروع کنیم؟</h2>
    <p>شش روایت که تصویری کامل از دامنه‌ی کار می‌دهند — از یک کالای عمومی جهانی تا نمونه‌ای که در آن داده‌ی باز به ابزار آزار تبدیل شد.</p>
  </div>
  <div class="grid">{feat}</div>
  <div style="margin-top:34px;text-align:center">
    <a class="btn btn-p" style="background:var(--ink);color:#fff;box-shadow:var(--shadow-m)" href="cases/">
      دیدن همه‌ی {num(len(CASES))} مطالعه{ic('arrow')}</a>
  </div>
</div></section>

<section><div class="wrap">
  <div class="sec-head rv">
    <span class="sec-kicker">فراتر از مطالعات موردی</span>
    <h2>و اگر بخواهیم از تجربه‌ی جهانی به ایران برسیم؟</h2>
    <p>کنار روایت‌های گاورلب، سه مجموعه‌ی دیگر هم اینجاست: گزارش‌های فارسیِ تألیفی و ترجمه‌ای،
      فهرست مفاد قانونی ایران، و کتاب‌شناسیِ منابعی که این کارها روی آن‌ها بنا شده‌اند.</p>
  </div>
  <div class="dims">
    <a class="dim rv" href="cases/?cat=reports" style="--c1:{REPORT_ACCENT};--c2:{REPORT_ACCENT2}">
      <span class="ic"><svg viewBox="0 0 24 24"><path d="M6 4h9l4 4v12H6z"/></svg></span>
      <h3>گزارش‌های فارسی</h3>
      <p>از منشور بین‌المللی داده‌ی باز و داده‌ی بازِ بودجه و قرارداد، تا نقد به طرح پورتال ملی داده.</p>
      <span class="n">{num(len(REPORTS))} گزارش {ic('arrow')}</span>
    </a>
    <a class="dim rv" href="laws/" style="--c1:#BE123C;--c2:#FB7185">
      <span class="ic"><svg viewBox="0 0 24 24"><path d="M4 7h16M6 7v13h12V7M9 11v5M15 11v5"/></svg></span>
      <h3>قوانین ایران</h3>
      <p>هر مفادی از قانون اساسی تا مصوبه‌های هیأت وزیران که به دسترسی آزاد به اطلاعات مربوط است.</p>
      <span class="n">{num(len(LAWS['laws']))} مفاد قانونی {ic('arrow')}</span>
    </a>
    <a class="dim rv" href="library/" style="--c1:#4338CA;--c2:#A78BFA">
      <span class="ic"><svg viewBox="0 0 24 24"><path d="M4 5h6v14H4zM14 5h6v14h-6M4 9h6M14 9h6"/></svg></span>
      <h3>کتابخانه‌ی منابع</h3>
      <p>پژوهش‌ها، گزارش‌ها و کتاب‌هایی که پشتوانه‌ی این مجموعه بوده‌اند، با لینک به منبع اصلی.</p>
      <span class="n">{num(len(LIB['items']))} منبع {ic('arrow')}</span>
    </a>
  </div>
</div></section>
</main>"""
    write('index.html', page(body, title=f'{SITE} — {TAGLINE}', desc=TAGLINE, root='', active=''))


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
<section style="padding-bottom:34px"><div class="wrap">
  <div class="sec-head" style="margin-bottom:30px">
    <span class="sec-kicker">کتابخانه</span>
    <h2>همه‌ی مطالب</h2>
    <p>هم‌اکنون <b data-count>{num(total)}</b> مطلب در دسترس است: {num(len(CASES))} مطالعه‌ی موردی
      از گاورلب و {num(len(REPORTS))} گزارش فارسی. بر اساس بُعد تأثیر فیلتر کنید یا نام کشور،
      سازمان و موضوع را جست‌وجو کنید.</p>
  </div>
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


def render_blocks(blocks, root):
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
            inner, _ = render_blocks(b['blocks'], root)
            parts.append(f'<aside class="callout">{inner}</aside>')
        elif b['type'] == 'table':
            head = ('<thead><tr>' + ''.join(f'<th>{e(x)}</th>' for x in b['head'])
                    + '</tr></thead>') if b['head'] else ''
            rows = ''.join('<tr>' + ''.join(f'<td>{e(x)}</td>' for x in r) + '</tr>'
                           for r in b['rows'])
            parts.append(f'<div class="tbl"><table>{head}<tbody>{rows}</tbody></table></div>')
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

    rows = ''.join(f"""<article class="law rv" data-card="{lw['group']}"
 data-k="{e((lw['title'] + ' ' + lw['source'] + ' ' + lw['date'] + ' ' + lw['text']).lower())}">
  <div class="law-head">
    <span class="law-no">{num(lw['no'])}</span>
    <div><h3>{e(lw['title'])}</h3>
      <div class="law-meta"><span>{ic('cal')}{e(lw['date'])}</span><span>{ic('doc')}{e(lw['source'])}</span></div>
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
        root='../', active='laws/'))


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
    urls = (['', 'cases/', 'laws/', 'library/', 'about/']
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
    build_laws()
    build_library()
    build_about()
    build_404()
    build_extras()
    print(f'ساخته شد: {len(order) + len(rorder) + 6} صفحه')


if __name__ == '__main__':
    main()
