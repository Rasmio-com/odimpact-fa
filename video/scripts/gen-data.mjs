// داده‌ی سبکِ ویدئو و نقشه‌ی نقطه‌ای جهان را از روی data/*.json می‌سازد.
//
// خروجی‌ها:
//   data/world.json                    نقشه‌ی نقطه‌ای + جای کشورها (برای site.py و ویدئو)
//   site/assets/img/world-dots.svg     همان نقشه به‌صورت SVG (ماسک CSS در سایت)
//   video/src/generated/data.json      فقط فیلدهایی که ویدئو لازم دارد، نه متن کامل مطالعات
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { geoNaturalEarth1, geoContains } from 'd3-geo';
import { merge } from 'topojson-client';

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '..', '..');
const read = (n) => JSON.parse(fs.readFileSync(path.join(ROOT, 'data', n), 'utf8'));
const write = (rel, s) => {
  const p = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, s);
  console.log('→', rel, `(${(Buffer.byteLength(s) / 1024).toFixed(1)}KB)`);
};

const { categories, cases } = read('cases.json');
const { reports } = read('reports.json');
const { laws } = read('laws.json');
const { items: library } = read('library.json');

// ── نقشه‌ی نقطه‌ای ────────────────────────────────────────────────
// خشکی‌ها بدون جنوبگان؛ نقطه‌ها روی شبکه‌ای منظم در فضای تصویر نمونه‌برداری می‌شوند.
const topo = require('world-atlas/countries-110m.json');
const land = merge(topo, topo.objects.countries.geometries.filter((g) => g.id !== '010'));
const W = 1000;
const projection = geoNaturalEarth1().fitWidth(W, land);
const [[, y0], [, y1]] = [projection([0, 84]), projection([0, -57])];
const top = Math.floor(y0), H = Math.ceil(y1 - y0);
const STEP = 8.4;
const dots = [];
for (let y = top + STEP / 2; y < top + H; y += STEP) {
  for (let x = STEP / 2; x < W; x += STEP) {
    const ll = projection.invert([x, y]);
    if (ll && geoContains(land, ll)) dots.push([+x.toFixed(1), +(y - top).toFixed(1)]);
  }
}
// نقطه‌های پشت‌سرهم یک ردیف با حرکت نسبی کوتاه نوشته می‌شوند تا مسیر سبک بماند
const dotPath = dots.map(([x, y], i) => {
  const prev = dots[i - 1];
  if (prev && prev[1] === y) return `m${+(x - prev[0]).toFixed(1)} 0h0`;
  return `M${x} ${y}h0`;
}).join('');

// مختصات تقریبیِ مرکز دیداری هر کشور [طول، عرض]
const LONLAT = {
  'اسلواکی': [19.7, 48.7], 'بوروندی': [29.9, -3.4], 'بریتانیا': [-1.8, 53.0],
  'سوئد': [16.0, 62.0], 'برزیل': [-52.5, -10.0], 'کامبوج': [105.0, 12.6],
  'کانادا': [-104.0, 56.5], 'هند': [79.0, 22.0], 'اوگاندا': [32.3, 1.4],
  'اندونزی': [116.0, -2.0], 'دانمارک': [9.5, 56.1], 'سیرالئون': [-11.8, 8.5],
  'سنگاپور': [103.8, 1.35], 'ایالات متحده': [-98.0, 39.0], 'نپال': [84.1, 28.4],
  'نیوزیلند': [172.5, -42.0], 'پاراگوئه': [-58.4, -23.4], 'کلمبیا': [-74.3, 4.6],
  'جاماییکا': [-77.3, 18.1], 'غنا': [-1.0, 7.9], 'تانزانیا': [34.9, -6.4],
  'آفریقای جنوبی': [23.0, -30.6], 'اروگوئه': [-55.8, -32.5], 'کنیا': [37.9, 0.0],
  'مکزیک': [-102.5, 23.6],
};
const IRAN = [53.7, 32.4];

// جای برچسب هر کشور نسبت به سنجاقش: [جهت، جابه‌جایی افقی، جابه‌جایی عمودی] به پیکسلِ
// نقشه‌ی ۱۵۶۰ پیکسلی. دستی تنظیم شده تا خوشه‌های اروپا و شرق آفریقا روی هم نیفتند.
const LABEL = {
  'نیوزیلند': ['l'], 'اندونزی': ['r'], 'کامبوج': ['r'], 'سنگاپور': ['l'], 'نپال': ['t'], 'هند': ['l'],
  'کنیا': ['r', 0, -4], 'تانزانیا': ['r', 0, 6], 'اوگاندا': ['l', 0, -10], 'بوروندی': ['l', 0, 10],
  'آفریقای جنوبی': ['r'], 'اسلواکی': ['r', 0, 4], 'سوئد': ['r', 0, -4], 'دانمارک': ['r'],
  'غنا': ['b'], 'بریتانیا': ['l'], 'سیرالئون': ['l'], 'برزیل': ['r'], 'اروگوئه': ['r'],
  'پاراگوئه': ['l'], 'کلمبیا': ['l'], 'جاماییکا': ['r'], 'ایالات متحده': ['r'], 'مکزیک': ['l'],
  'کانادا': ['r'],
};
const proj = (ll) => {
  const [x, y] = projection(ll);
  return [+x.toFixed(1), +(y - top).toFixed(1)];
};

const catBySlug = Object.fromEntries(categories.map((c) => [c.slug, c]));
const countryNames = [...new Set(cases.map((c) => c.country))];
const missing = countryNames.filter((n) => !LONLAT[n]);
if (missing.length) throw new Error('مختصات این کشورها تعریف نشده: ' + missing.join('، '));

const countries = countryNames.map((name) => {
  const list = cases.filter((c) => c.country === name);
  const [x, y] = proj(LONLAT[name]);
  const [dir, dx = 0, dy = 0] = LABEL[name] ?? ['r'];
  return {
    name, x, y, lon: LONLAT[name][0], label: { dir, dx, dy },
    cases: list.map((c) => ({ slug: c.slug, title: c.title, category: c.category })),
  };
}).sort((a, b) => b.lon - a.lon); // شرق به غرب: ترتیب خواندن راست‌به‌چپ روی نقشه

const world = {
  _note: 'تولیدشده با video/scripts/gen-data.mjs — دستی ویرایش نکنید',
  width: W, height: H, step: STEP,
  dots: dotPath,
  iran: proj(IRAN),
  countries: countries.map(({ lon, ...c }) => c),
};
write('data/world.json', JSON.stringify(world));

write('site/assets/img/world-dots.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">` +
  `<path d="${dotPath}" stroke="#000" stroke-width="${(STEP * 0.42).toFixed(2)}" stroke-linecap="round"/></svg>`);

// ── داده‌ی سبک ویدئو ──────────────────────────────────────────────
const words = cases.reduce((s, c) => s + c.words, 0) + reports.reduce((s, r) => s + r.words, 0);
const data = {
  counts: {
    cases: cases.length, reports: reports.length, laws: laws.length, library: library.length,
    countries: countryNames.length, dimensions: categories.length,
    words, figures: cases.reduce((s, c) => s + c.figures, 0) + reports.reduce((s, r) => s + r.figures, 0),
  },
  categories: categories.map((c) => ({
    slug: c.slug, title: c.title, titleEn: c.title_en, tagline: c.tagline,
    accent: c.accent, accent2: c.accent2, icon: c.icon,
    count: cases.filter((x) => x.category === c.slug).length,
    cases: cases.filter((x) => x.category === c.slug).map((x) => ({ title: x.title, country: x.country })),
  })),
  cases: cases.map((c) => ({
    slug: c.slug, title: c.title, subtitle: c.subtitle, country: c.country,
    category: c.category, accent: catBySlug[c.category].accent,
  })),
  reports: reports.map((r) => r.title),
};
write('video/src/generated/data.json', JSON.stringify(data, null, 1));
console.log(`نقشه: ${dots.length} نقطه، ${countries.length} کشور`);
