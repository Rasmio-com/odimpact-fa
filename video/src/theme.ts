// رنگ، قلم و قالب‌بندی اعداد؛ همه با سامانه‌ی طراحی سایت هم‌خوان است.
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const FPS = 30;

export const FONT = "'Yekan Bakh', Vazirmatn, Tahoma, system-ui, sans-serif";

export const C = {
  ink: '#04060E',
  ink2: '#0A0E20',
  ink3: '#121937',
  white: '#FFFFFF',
  purple: '#6C5CE7',
  violet: '#A78BFA',
  teal: '#0EA5A5',
  mint: '#5EEAD4',
  amber: '#E8850C',
  gold: '#FBBF24',
  pink: '#E11D62',
  rose: '#FB7185',
  // سه مجموعه‌ی کنار مطالعات موردی، همان رنگ‌های صفحه‌ی اول سایت
  reports: ['#0F766E', '#5EEAD4'],
  laws: ['#BE123C', '#FB7185'],
  library: ['#4338CA', '#A78BFA'],
} as const;

// همان گرادیان «چه چیزی» در قهرمان سایت
export const BRAND_GRADIENT = 'linear-gradient(97deg,#A78BFA,#5EEAD4 40%,#FBBF24 72%,#FB7185)';
export const MARK_GRADIENT = 'linear-gradient(135deg,#6C5CE7,#0EA5A5 42%,#E8850C 74%,#E11D62)';

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
/** رقم‌های لاتین را فارسی می‌کند. */
export const fa = (s: string | number) => String(s).replace(/\d/g, (d) => FA_DIGITS[+d]);

/** عدد با جداکننده‌ی هزارگان فارسی (٬) و ممیز فارسی (٫). */
export const faNum = (n: number, decimals = 0) => {
  const [int, frac] = n.toFixed(decimals).split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, '٬');
  return fa(frac ? `${grouped}٫${frac}` : grouped);
};

/** رنگ hex را با شفافیت ترکیب می‌کند. */
export const alpha = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};
