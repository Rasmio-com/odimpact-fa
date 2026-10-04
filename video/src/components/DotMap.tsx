import React, { useId } from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import world from '../../../data/world.json';
import data from '../generated/data.json';
import { alpha, fa } from '../theme';
import { clamp } from './ui';

export const MAP_W = world.width;
export const MAP_H = world.height;
export type Country = (typeof world.countries)[number];
export const COUNTRIES: Country[] = world.countries;
export const IRAN = world.iran as [number, number];

const ACCENT: Record<string, [string, string]> = Object.fromEntries(
  data.categories.map((c) => [c.slug, [c.accent, c.accent2]]),
);
export const accentOf = (cat: string) => ACCENT[cat] ?? ['#fff', '#fff'];

/** شناسه‌ی یکتا و امن برای ارجاع‌های SVG (هم‌زمان دو صحنه رندر می‌شوند) */
const useSvgId = () => 'm' + useId().replace(/[^a-zA-Z0-9_-]/g, '');

/**
 * نقشه‌ی نقطه‌ای جهان. reveal از ۰ تا ۱ نقطه‌ها را از راست به چپ آشکار می‌کند
 * (شرق به غرب، هم‌جهت با خواندن فارسی). فرزندان با تابع xy روی نقشه جا می‌گیرند.
 */
export const DotMap: React.FC<{
  width: number;
  reveal?: number;
  dotColor?: string;
  dotOpacity?: number;
  children?: (xy: (x: number, y: number) => [number, number], scale: number) => React.ReactNode;
  style?: React.CSSProperties;
}> = ({ width, reveal = 1, dotColor = '#C9D2FF', dotOpacity = 0.42, children, style }) => {
  const id = useSvgId();
  const s = width / MAP_W;
  const h = MAP_H * s;
  const q = reveal * 1.12 - 0.06; // جای جبهه‌ی آشکارشدن، با کمی حاشیه برای لبه‌ی نرم
  const front = (1 - q) * MAP_W;
  return (
    <div style={{ position: 'relative', width, height: h, ...style }}>
      <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} width={width} height={h} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <defs>
          <linearGradient id={`${id}g`} x1="1" x2="0" y1="0" y2="0">
            <stop offset={Math.max(0, q - 0.06)} stopColor="#fff" />
            <stop offset={Math.max(0, q)} stopColor="#000" />
          </linearGradient>
          <mask id={`${id}k`} maskUnits="userSpaceOnUse" x="0" y="0" width={MAP_W} height={MAP_H}>
            <rect width={MAP_W} height={MAP_H} fill={`url(#${id}g)`} />
          </mask>
          <linearGradient id={`${id}s`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset=".5" stopColor="#fff" stopOpacity=".85" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d={world.dots}
          stroke={dotColor}
          strokeOpacity={dotOpacity}
          strokeWidth={world.step * 0.42}
          strokeLinecap="round"
          mask={reveal < 1 ? `url(#${id}k)` : undefined}
        />
        {reveal > 0 && reveal < 1 ? (
          <rect x={front - 1.2} y={0} width={2.4} height={MAP_H} fill={`url(#${id}s)`} opacity={0.8} />
        ) : null}
      </svg>
      {children ? children((x, y) => [x * s, y * s], s) : null}
    </div>
  );
};

/** سنجاق کشور؛ اگر چند مطالعه با ابعاد مختلف دارد، حلقه‌ای چندرنگ می‌شود */
export const Pin: React.FC<{
  x: number;
  y: number;
  country: Country;
  at: number;
  scale?: number;
  label?: 'r' | 'l' | 't' | 'b' | null;
  dx?: number;
  dy?: number;
  labelSize?: number;
  dim?: number;
}> = ({ x, y, country, at, scale = 1, label = null, dx = 0, dy = 0, labelSize = 24, dim = 1 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: f - at, fps, config: { damping: 11, mass: 0.6, stiffness: 140 } });
  if (f < at) return null;
  const n = country.cases.length;
  const r = (7 + 3.2 * Math.sqrt(n)) * scale;
  const cats = country.cases.map((c) => accentOf(c.category)[0]);
  const step = 360 / n;
  const ring =
    n > 1
      ? `conic-gradient(${cats.map((c, i) => `${c} ${i * step}deg ${(i + 1) * step - 4}deg, transparent ${(i + 1) * step - 4}deg ${(i + 1) * step}deg`).join(',')})`
      : cats[0];
  const main = cats[0];
  const pulse = ((f - at) % 54) / 54;
  const lp = interpolate(f, [at + 4, at + 16], [0, 1], clamp);
  const gap = r + 10 * scale;
  // جای برچسب نسبت به سنجاق: راست، چپ، بالا یا پایین
  const tr = {
    r: `translate(${gap + dx}px, ${dy}px) translateY(-50%)`,
    l: `translate(${dx - gap}px, ${dy}px) translateX(-100%) translateY(-50%)`,
    t: `translate(${dx}px, ${dy - gap}px) translate(-50%, -100%)`,
    b: `translate(${dx}px, ${gap + dy}px) translateX(-50%)`,
  } as const;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: 0, height: 0, opacity: dim }}>
      <div
        style={{
          position: 'absolute', left: -r * 2.6, top: -r * 2.6, width: r * 5.2, height: r * 5.2, borderRadius: '50%',
          border: `${2 * scale}px solid ${alpha(main, 0.9)}`,
          transform: `scale(${0.25 + pulse * 0.75})`, opacity: (1 - pulse) * 0.7 * p,
        }}
      />
      <div
        style={{
          position: 'absolute', left: -r, top: -r, width: r * 2, height: r * 2, borderRadius: '50%',
          background: ring, transform: `scale(${p})`,
          boxShadow: `0 0 ${r * 2.2}px ${alpha(main, 0.85)}`,
        }}
      >
        <div
          style={{
            position: 'absolute', inset: n > 1 ? r * 0.36 : r * 0.3, borderRadius: '50%',
            background: n > 1 ? '#0A0E22' : '#fff', opacity: n > 1 ? 1 : 0.9,
          }}
        />
      </div>
      {label ? (
        <div
          style={{
            position: 'absolute', left: 0, top: 0, whiteSpace: 'nowrap', direction: 'rtl',
            fontSize: labelSize * scale, fontWeight: 700, color: '#fff', lineHeight: 1.2,
            transform: tr[label], opacity: lp,
            textShadow: '0 2px 10px rgba(0,0,0,.9), 0 0 2px rgba(0,0,0,.8)',
          }}
        >
          {country.name}
          {n > 1 ? (
            <span style={{ fontWeight: 400, opacity: 0.7, fontSize: '.82em' }}>{` · ${fa(n)}`}</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
