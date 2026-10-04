// محتوای روایی ویدئو از data/highlights.json می‌آید؛ صفحه‌ی اول سایت هم از همان فایل می‌خواند.
import data from './generated/data.json';
import highlights from '../../data/highlights.json';

const bySlug = Object.fromEntries(data.cases.map((c) => [c.slug, c]));
const catBySlug = Object.fromEntries(data.categories.map((c) => [c.slug, c]));

export type Stat =
  | { value: number; decimals?: number; prefix?: string; suffix: string }
  | { text: string };

export type Story = {
  slug: string;
  title: string;
  country: string;
  category: string;
  c1: string;
  c2: string;
  stat: Stat;
  caption: string;
  warn?: boolean;
};

export const caseBySlug = (slug: string) => {
  const c = bySlug[slug];
  if (!c) throw new Error(`مطالعه‌ی ${slug} پیدا نشد`);
  return c;
};

type Raw = (typeof highlights.stories)[number] & {
  value?: number; decimals?: number; prefix?: string; suffix?: string; text?: string;
  warn?: boolean; accent?: string; accent2?: string;
};

export const STORIES: Story[] = (highlights.stories as Raw[]).map((h) => {
  const c = caseBySlug(h.slug);
  const cat = catBySlug[c.category];
  const stat: Stat = h.text
    ? { text: h.text }
    : { value: h.value ?? 0, decimals: h.decimals, prefix: h.prefix, suffix: h.suffix ?? '' };
  return {
    slug: h.slug, title: c.title, country: c.country, category: cat.title,
    c1: h.accent ?? cat.accent, c2: h.accent2 ?? cat.accent2, stat, caption: h.caption, warn: h.warn,
  };
});

/** سه نمونه برای هر بُعد تأثیر در صحنه‌ی «چهار بُعد» */
export const DIMENSION_PICKS: Record<string, string[]> = highlights.dimensionPicks;
