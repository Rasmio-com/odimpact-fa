<div align="right" dir="rtl">

# تأثیر داده‌ی باز — روایت فارسی

سایتی ایستا، فارسی و راست‌چین که **۳۷ مطالعه‌ی موردی** پروژه‌ی
[Open Data’s Impact](https://odimpact.org) (گاورلب دانشگاه نیویورک) را به شکلی
خوانا روی وب منتشر می‌کند: از نبرد با ابولا در سیرالئون تا اقتصاد جی‌پی‌اس،
و نمونه‌هایی که در آن‌ها داده‌ی باز نتیجه‌ی معکوس داد.

</div>

## What this is

A static, right-to-left Persian website presenting 37 translated case studies from
the GovLab’s *Open Data’s Impact* project, organised by the project’s four impact
dimensions. Built as plain HTML/CSS/JS generated from the source Word documents —
no framework, no build step at deploy time.

| | |
|---|---|
| مطالعات موردی | ۳۷ |
| کشورها | ۲۵ |
| ابعاد تأثیر | ۴ |
| واژه‌ی فارسی | ~۱۷۷٬۰۰۰ |
| شکل و نمودار | ۷۰ |

## ابعاد تأثیر

| بُعد | Dimension | تعداد |
|---|---|---|
| بهبود حکمرانی | Improving Government | ۱۳ |
| ایجاد فرصت | Creating Opportunity | ۹ |
| حل مسائل عمومی | Solving Public Problems | ۸ |
| توانمندسازی شهروندان | Empowering Citizens | ۷ |

## ساختار مخزن

```
build/
  catalog.py   فراداده‌ی دستی هر مطالعه (عنوان، زیرعنوان، کشور، دسته، سال)
  parse.py     استخراج ساختاریافته از فایل‌های ورد  →  data/cases.json
  site.py      تولید صفحه‌های HTML از روی data/cases.json  →  site/
data/
  cases.json   کل محتوا به‌صورت ساختاریافته (خلاصه، نکات کلیدی، بخش‌ها، شکل‌ها)
site/          خروجی قابل انتشار — همین پوشه روی GitHub Pages سرو می‌شود
```

## بازتولید سایت

`parse.py` به فایل‌های ورد اصلی نیاز دارد (به‌دلیل حجم، در مخزن نیستند). اگر
فقط می‌خواهید HTML را دوباره بسازید، `data/cases.json` کافی است:

```bash
python3 build/site.py          # بازسازی صفحه‌ها از روی داده‌ی موجود
python3 -m http.server 4173 --directory site
```

برای استخراج دوباره از ورد (نیازمند `lxml` و `Pillow`)، مسیر `SRC` را در
`build/parse.py` تنظیم کنید و اجرا کنید:

```bash
python3 build/parse.py && python3 build/site.py
```

## طراحی

- قلم **یکان بخ** (وزن‌های Light تا Black، فرمت `woff2`)
- راست‌چین کامل، حالت روشن/تاریک، واکنش‌گرا
- رنگ اختصاصی برای هر بُعد تأثیر؛ هر کارت گرادیان و بافت منحصربه‌فرد خود را از
  روی `slug` می‌سازد
- نقشه‌ی مکان‌نمای هر کشور به‌صورت خودکار از فایل ورد تشخیص داده و به شبح شفاف
  تبدیل می‌شود
- فهرست مطالب چسبان، نوار پیشرفت مطالعه، لایت‌باکس تصاویر، جست‌وجوی زنده

## حق مؤلف و مجوزها

- **متن مطالعات موردی** متعلق به [The GovLab](https://thegovlab.org) دانشگاه
  نیویورک است و در [odimpact.org](https://odimpact.org) منتشر شده. این مخزن
  صرفاً روایت فارسی و غیرتجاری آن است.
- **قلم یکان بخ** نرم‌افزاری مالکیتی از [فونت ایران](https://fontiran.com) است.
  فایل‌های وب‌فونت طبق شرایط ناشر همراه با `site/assets/fonts/FontLicense.txt`
  عرضه شده‌اند؛ **کد لایسنس خود را در آن فایل درج کنید**. اگر مجوز انتشار وب
  ندارید، فایل‌های `woff2` را از مخزن حذف و قلم دیگری جایگزین کنید.
- **کد** (`build/`, `site/assets/css`, `site/assets/js`) تحت مجوز MIT است.
