// زمان‌بندی صحنه‌ها؛ هم ترکیب ویدئو و هم فصل‌های پلیر از همین فایل می‌خوانند.
export type SceneId =
  | 'hook' | 'title' | 'numbers' | 'map' | 'dimensions' | 'stories' | 'rasmio' | 'iran' | 'outro';

export type SceneDef = {
  id: SceneId;
  /** عنوان فصل در نوار زمان پلیر */
  chapter: string;
  /** طول صحنه به فریم (۳۰ فریم در ثانیه)، شامل هم‌پوشانی با گذارها */
  duration: number;
};

export const SCENES: SceneDef[] = [
  { id: 'hook', chapter: 'پرسش', duration: 200 },
  { id: 'title', chapter: 'معرفی', duration: 160 },
  { id: 'numbers', chapter: 'در یک نگاه', duration: 250 },
  { id: 'map', chapter: 'نقشه', duration: 290 },
  { id: 'dimensions', chapter: 'چهار بُعد', duration: 470 },
  { id: 'stories', chapter: 'روایت‌ها', duration: 470 },
  { id: 'rasmio', chapter: 'رسمیو', duration: 382 },
  { id: 'iran', chapter: 'تا ایران', duration: 270 },
  { id: 'outro', chapter: 'پایان', duration: 190 },
];

/** طول هر گذار بین دو صحنه (فریم) */
export const TRANSITION = 22;

export const DURATION =
  SCENES.reduce((s, x) => s + x.duration, 0) - TRANSITION * (SCENES.length - 1);

export type Chapter = { id: SceneId; title: string; start: number; end: number };

/**
 * شروع هر فصل = لحظه‌ای که گذار به آن صحنه تمام شده است؛
 * پرش به فصل در حالت توقف، تصویر نیمه‌گذار نشان نمی‌دهد.
 */
export const CHAPTERS: Chapter[] = (() => {
  let from = 0;
  return SCENES.map((s, i) => {
    const start = i === 0 ? 0 : from + TRANSITION;
    from += s.duration - TRANSITION;
    return { id: s.id, title: s.chapter, start, end: 0 };
  }).map((c, i, all) => ({ ...c, end: i + 1 < all.length ? all[i + 1].start : DURATION }));
})();
