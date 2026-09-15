# -*- coding: utf-8 -*-
"""استخراج فهرست مفاد قانونی داده‌ی باز از PDF به data/laws.json

سه دشواری در این PDF هست که هرکدام جدا درمان می‌شود:

۱. ساختار سطر/ستونِ خودِ جدول ناهمگون است (سلول‌های ادغام‌شده)، پس ستون‌ها از روی
   مختصات افقی تشخیص داده می‌شوند نه از روی ایندکس سلول.
۲. لیگاتور «لا» در کل سند به «ال» استخراج می‌شود؛ صفر مورد «لا» سالم باقی مانده.
   پس یک جدول واژه‌به‌واژه‌ی دست‌بررسی‌شده لازم است.
۳. ویرگول‌ها یک واژه زودتر از جای درست‌شان می‌نشینند (اثر جانبی دوسویه‌نویسی).
"""
import json, os, re, sys

import pymupdf

from parse import fa_digits

SRC = os.environ.get('ODFA_SRC',
                     '/Users/khani/Documents/Claude/Projects/OpenData/odimpact-fa/داده- باز')
PDF = os.path.join(SRC, 'لیست قوانین داده باز.pdf')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# مرزهای افقی ستون‌ها (عرض صفحه ۸۴۲)؛ راست‌ترین ستون «ردیف» است
COLS = [(757, 'no'), (688, 'date'), (628, 'source'), (521, 'title'), (0, 'text')]

MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
          'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']

# واژه‌هایی که در متن اصلی «لا» داشته‌اند و به «ال» استخراج شده‌اند.
# هر ۱۱۱ واژه‌ی دارای «ال» یک‌به‌یک بررسی شد؛ آن‌هایی که «ال» اصیل دارند
# (الزام، الحاق، مالیات، سال، عالی، ارسال، اشغال، ابطال، انفصال، اعمال، …) نیامده‌اند.
LIGATURE = {
    'اطالعات': 'اطلاعات', 'اطالع': 'اطلاع', 'اطالعاتی': 'اطلاعاتی',
    'اطالعاتى': 'اطلاعاتی', 'آمارواطالعات': 'آمار و اطلاعات',
    'اعالم': 'اعلام', 'اعالمی': 'اعلامی', 'اعالن': 'اعلان',
    'اسالمی': 'اسلامی', 'اسالمى': 'اسلامی',
    'الزم': 'لازم', 'االجراء': 'الاجراء', 'االجرای': 'الاجرای',
    'االمکان': 'الامکان',
    'ابالغ': 'ابلاغ', 'ابالغیه': 'ابلاغیه',
    'سالمت': 'سلامت', 'معامالت': 'معاملات', 'مبادالت': 'مبادلات',
    'امالک': 'املاک', 'کاال': 'کالا', 'کالن': 'کلان',
    'ساالنه': 'سالانه', 'فعاالن': 'فعالان', 'مسؤوالن': 'مسؤولان',
    'معلوالن': 'معلولان', 'وکالی': 'وکلای',
    'خالف': 'خلاف', 'خالصه': 'خلاصه', 'اخالقی': 'اخلاقی', 'اخالق': 'اخلاق',
    'اخالل': 'اخلال', 'اختالفات': 'اختلافات', 'انقالب': 'انقلاب',
    'اصالح': 'اصلاح', 'اصالحات': 'اصلاحات',
    'اقالم': 'اقلام', 'تسهیالت': 'تسهیلات',
    'تشکیالت': 'تشکیلات', 'تشکیالتی': 'تشکیلاتی',
    'بالفاصله': 'بلافاصله', 'بیالن': 'بیلان', 'آنالین': 'آنلاین',
    'باالدستی': 'بالادستی', 'باالدست': 'بالادست',
    'باالتر': 'بالاتر', 'باالترین': 'بالاترین',
    'سؤاالت': 'سؤالات', 'اعتالی': 'اعتلای', 'عالوه': 'علاوه',
    'صالحیتدار': 'صلاحیت‌دار',
}
# واژه‌هایی که استخراج وسطشان را شکسته است
PHRASE = [
    ('اط العات', 'اطلاعات'), ('الکت رونیک', 'الکترونیک'),
    ('ذی صالح', 'ذی‌صلاح'), ('ذی صالحیت', 'ذی‌صلاحیت'),
    ('ش کایات', 'شکایات'), ('نفراز', 'نفر از'), ('کتبا ', 'کتباً '),
    ('فوقالعاده', 'فوق‌العاده'), ('همهساله', 'همه‌ساله'),
    ('پنجساله', 'پنج‌ساله'), ('یکسال', 'یک سال'), ('دستورالعملها', 'دستورالعمل‌ها'),
    ('دستور العمل', 'دستورالعمل'), ('ذی ربط', 'ذی‌ربط'), ('راهاندازی', 'راه‌اندازی'),
    ('ی برا ', 'برای '), ('وب سایت', 'وب‌سایت'), ('داده پیام', 'داده‌پیام'),
]
# پسوندهایی که در PDF با فاصله‌ی کامل آمده‌اند و باید نیم‌فاصله شوند
SUFFIX = re.compile(r'(?<=[\u0621-\u064A\u066E-\u06FF])\s+'
                    r'(ها|های|هایی|هایش|سازی|گذاری|بندی|پذیری|نامه|آوری|رسانی|ریزی|دهی)\b')
SUFFIX_E = re.compile(r'(?<=[هاوی])\s+(ای|اش|اند)\b')
REF = re.compile(r'\b(اصل|ماده|تبصره|بند|جزء|فصل|مورخ|شماره)(?=[\d۰-۹])')
WORD = re.compile(r'[ء-يٮ-ۿ‌]+')
# واژه‌هایی که به «ها» ختم می‌شوند ولی جمع نیستند
NOT_PLURAL = {'تنها', 'بها', 'رها', 'اشتها', 'گواها', 'شاها', 'راها'}
ZWNJ_SUFFIX = ('ها', 'های', 'هایی')
CLITIC = ('ها', 'های', 'هایی', 'سازی', 'شود', 'شده', 'کند', 'اند', 'ای', 'تر', 'ترین')


def fix_text(t):
    # ۱) نویسه‌های عربی و کشیدگی — پیش از هر کار دیگری
    t = (t.replace('\u0640', '').replace('\u200b', '').replace('\ufeff', '')
          .replace('ي', 'ی').replace('ك', 'ک').replace('ى', 'ی'))
    t = re.sub(r'[ \t\u00a0]+', ' ', t).strip()

    # ۲) بازسازی لیگاتور «لا» که در استخراج به «ال» تبدیل شده
    t = WORD.sub(lambda m: LIGATURE.get(m.group(0), m.group(0)), t)
    for a, b in PHRASE:
        t = t.replace(a, b)

    # ۳) ویرگول‌ها — پیش از هر یکسان‌سازیِ فاصله، چون جای خودشان غلط است
    def midcomma(m):
        a, b = m.group(1), m.group(2)
        return a + ('\u200c' if b in CLITIC else ' ') + b + '،'
    t = re.sub(r'([^\s،]+)،([^\s،]+)', midcomma, t)       # وسط واژه
    # ویرگولی که هر دو طرفش فاصله دارد سر جای خود است؛ فقط می‌چسبد
    t = re.sub(r'\s،\s+', '، ', t)
    # ویرگولی که به واژه‌ی بعد چسبیده، یک واژه زودتر نشسته است
    t = re.sub(r'\s،(\S+)', r' \1، ', t)

    # «ی» جدامانده که در استخراج از انتهای واژه‌ی پیش از خود کنده شده است
    t = re.sub(r'(?<=[\u0621-\u064A\u066E-\u06FF])\s+ی(?![\u0621-\u064A\u066E-\u06FF])',
               lambda m: '\u200cی' if m.string[m.start() - 1] == 'ه' else 'ی', t)

    # ۴) نیم‌فاصله‌هایی که PDF از دست داده است
    t = re.sub(r'\bن?می\s+(?=[\u0621-\u064A\u066E-\u06FF])',
               lambda m: m.group(0).strip() + '\u200c', t)
    t = SUFFIX.sub('\u200c\\1', t)
    t = SUFFIX_E.sub('\u200c\\1', t)
    t = WORD.sub(lambda m: zwnj_plural(m.group(0)), t)

    # ۵) فاصله‌گذاری نهایی
    t = REF.sub(r'\1 ', t)
    t = re.sub(r'([.؟!])(?=[\u0621-\u064A\u066E-\u06FF])', r'\1 ', t)
    t = re.sub(r'\s+([.،؛:!؟])', r'\1', t)
    t = re.sub(r'([،؛:])(?=\S)', r'\1 ', t)
    t = t.replace('\u200cی\u200cها', '\u200cهای')   # سامانه‌ی‌ها ← سامانه‌های
    t = re.sub(r'\u200c\s+', '\u200c', t)

    # پرانتز و گیومه
    t = re.sub(r'\(\s*\)', '', t)
    t = re.sub(r'\(\s+', '(', t)
    t = re.sub(r'\s+\)', ')', t)
    t = re.sub(r'\)(?=[^\s.،؛:)])', ') ', t)
    t = re.sub(r'«\s+', '«', t)
    t = re.sub(r'\s+»', '»', t)
    t = re.sub(r'(?<=[\u0621-\u064A\u066E-\u06FF])\.(?=\s*[\u0621-\u064A\u066E-\u06FF]{1,3}\b)',
               lambda m: m.group(0) if m.string[m.start() - 1] != 'ه' else '\u200c', t)
    t = re.sub(r'\s{2,}', ' ', t)
    return fa_digits(t.strip(' ،'))


def zwnj_plural(w):
    if w in NOT_PLURAL or '‌' in w:
        return w
    for suf in sorted(ZWNJ_SUFFIX, key=len, reverse=True):
        if w.endswith(suf) and len(w) - len(suf) >= 3:
            return w[:-len(suf)] + '‌' + suf
    return w


def col_of(x):
    for edge, name in COLS:
        if x >= edge:
            return name
    return 'text'


def page_rows(page):
    """سطرهای منطقیِ جدول: بزرگ‌ترین کادرهایی که داخل کادر دیگری نیستند.

    find_tables سطرها را تودرتو گزارش می‌کند (یک رکورد و زیرسطرهایش)؛ فقط
    سطرهای بیرونی مرز واقعی رکوردها هستند.
    """
    tabs = page.find_tables()
    if not tabs.tables:
        return []
    boxes = [(r.bbox[1], r.bbox[3]) for t in tabs.tables for r in t.rows]
    outer = [b for b in boxes
             if not any(o is not b and o[0] <= b[0] + 1 and b[1] <= o[1] + 1
                        and (o[1] - o[0]) > (b[1] - b[0]) for o in boxes)]
    return sorted(set(outer))


def cells(page, y0, y1):
    """متن هر ستون درون یک سطر؛ راست‌به‌چپ و بالا‌به‌پایین."""
    got = {name: [] for _e, name in COLS}
    for blk in page.get_text('dict')['blocks']:
        for ln in blk.get('lines', []):
            t = ''.join(s['text'] for s in ln['spans']).strip()
            if not t:
                continue
            x0, ly0, x1, ly1 = ln['bbox']
            if not (y0 - 1 <= (ly0 + ly1) / 2 <= y1 + 1):
                continue
            got[col_of((x0 + x1) / 2)].append((round(ly0, 1), -x0, t))
    return {k: [t for _y, _x, t in sorted(v)] for k, v in got.items()}


HEADERS = {'متن مصوبه', 'مأخذ', 'تاریخ', 'ردیف'}


def parse():
    doc = pymupdf.open(PDF)
    rows, cur = [], None
    for pno, page in enumerate(doc):
        for y0, y1 in page_rows(page):
            c = cells(page, y0, y1)
            if set(c['no'] + c['date'] + c['source']) & HEADERS:
                continue
            no = next((int(t) for t in c['no'] if re.fullmatch(r'\d{1,3}', t)), None)
            # چند مصوبه‌ی پایانی در سند اصلی شماره نخورده‌اند؛ آن‌ها را از روی
            # تغییرِ همزمانِ تاریخ و مأخذ تشخیص می‌دهیم
            stamp = (' '.join(c['date']), ' '.join(c['source']))
            fresh = (no is not None and not (cur and cur['no'] == no)) or (
                no is None and cur is not None and all(stamp)
                and re.search(r'1[34]\d\d', stamp[0]) and stamp != cur['stamp'])
            if not fresh:
                if cur is None:
                    continue
            else:
                cur = {'no': no, 'page': pno + 1, 'stamp': stamp,
                       'date': [], 'source': [], 'title': [], 'text': []}
                rows.append(cur)
            for k in ('date', 'source'):        # بین صفحه‌ها تکرار می‌شوند
                cur[k] += [t for t in c[k] if t not in cur[k]]
            for k in ('title', 'text'):          # تکرارِ واقعیِ واژه‌ها مجاز است
                cur[k] += c[k]
    out = []
    for i, r in enumerate(rows):
        r['no'] = r['no'] or (rows[i - 1]['no'] + 1 if i else 1)
        out.append(finish(r))
    return out


def finish(r):
    r.pop('stamp', None)
    digits = re.findall(r'\d+', ' '.join(r['date']))
    date, key = '', ''
    if len(digits) == 1 and 1300 < int(digits[0]) < 1500:
        return dict(no=r['no'], date=fa_digits(digits[0]), date_key=f'{int(digits[0]):04d}-00-00',
                    source=fix_text(' '.join(r['source'])), title=fix_text(' '.join(r['title'])),
                    text=fix_text(' '.join(r['text'])), page=r['page'])
    if len(digits) >= 3:
        dd, mm, yy = int(digits[0]), int(digits[1]), int(digits[2])
        if 1 <= mm <= 12 and 1300 < yy < 1500:
            date = f'{fa_digits(str(dd))} {MONTHS[mm - 1]} {fa_digits(str(yy))}'
            key = f'{yy:04d}-{mm:02d}-{dd:02d}'
    return {
        'no': r['no'], 'date': date, 'date_key': key,
        'source': fix_text(' '.join(r['source'])),
        'title': fix_text(' '.join(r['title'])),
        'text': fix_text(' '.join(r['text'])),
        'page': r['page'],
    }


GROUPS = [
    ('constitution', 'قانون اساسی', ('قانون اساسی',)),
    ('leader', 'ابلاغیه‌های رهبری', ('ابلاغیه', 'رهبری', 'سیاست‌های کلی')),
    ('parliament', 'مصوبه‌ی مجلس', ('مجلس',)),
    ('cabinet', 'مصوبه‌ی هیأت وزیران', ('هیأت وزیران', 'هیئت وزیران', 'وزیران')),
]


def group_of(src):
    for slug, _t, keys in GROUPS:
        if any(k in src for k in keys):
            return slug
    return 'other'


def main():
    laws = parse()
    for lw in laws:
        lw['group'] = group_of(lw['source'])
    with open(os.path.join(ROOT, 'data', 'laws.json'), 'w', encoding='utf8') as f:
        json.dump({'groups': [{'slug': s, 'title': t} for s, t, _ in GROUPS]
                   + [{'slug': 'other', 'title': 'سایر'}], 'laws': laws},
                  f, ensure_ascii=False, indent=1)
    import collections
    print(f'{len(laws)} مفاد قانونی')
    print(collections.Counter(lw['group'] for lw in laws))
    print('بدون تاریخ:', sum(1 for lw in laws if not lw['date']))
    print('بدون متن:', sum(1 for lw in laws if len(lw['text']) < 20))
    if '--show' in sys.argv:
        for lw in laws[:int(sys.argv[sys.argv.index('--show') + 1])]:
            print('\n' + '─' * 90)
            print(f"[{lw['no']}] {lw['date']} · {lw['source']} · ص{lw['page']}")
            print(f"  عنوان: {lw['title']}")
            print(f"  متن: {lw['text'][:600]}")


if __name__ == '__main__':
    main()
