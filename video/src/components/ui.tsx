import React from 'react';
import {
  AbsoluteFill, Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig,
} from 'remotion';
import { BRAND_GRADIENT, C, FONT, MARK_GRADIENT, alpha, faNum } from '../theme';
import { DURATION } from '../timeline';

export const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/** ظرف هر صحنه: راست‌به‌چپ، قلم یکان بخ، متن سفید */
export const Scene: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({
  children, style,
}) => (
  <AbsoluteFill dir="rtl" style={{ direction: 'rtl', fontFamily: FONT, color: C.white, ...style }}>
    {children}
  </AbsoluteFill>
);

/** شمارنده با رقم فارسی */
export const CountUp: React.FC<{
  to: number;
  start?: number;
  dur?: number;
  decimals?: number;
  style?: React.CSSProperties;
}> = ({ to, start = 0, dur = 40, decimals = 0, style }) => {
  const f = useCurrentFrame();
  const v = interpolate(f, [start, start + dur], [0, to], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  return <span style={style}>{faNum(decimals ? v : Math.round(v), decimals)}</span>;
};

/** نشان سایت: مربع گرد با گرادیان چهار رنگ و نقطه‌ی سفید */
export const Mark: React.FC<{ size: number; glow?: number }> = ({ size, glow = 1 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.32,
      background: MARK_GRADIENT,
      display: 'grid',
      placeItems: 'center',
      boxShadow: `0 ${size * 0.2}px ${size * 0.6}px -${size * 0.12}px rgba(108,92,231,${0.7 * glow})`,
    }}
  >
    <div
      style={{
        width: size * 0.32,
        height: size * 0.32,
        borderRadius: '50%',
        background: '#fff',
        boxShadow: `0 0 0 ${size * 0.11}px rgba(255,255,255,.28)`,
      }}
    />
  </div>
);

export const Icon: React.FC<{ d: string; size: number; color: string; stroke?: number; style?: React.CSSProperties }> = ({
  d, size, color, stroke = 1.9, style,
}) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={stroke}
    strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d={d} />
  </svg>
);

export const ICONS = {
  pin: 'M12 21s7-6 7-11a7 7 0 10-14 0c0 5 7 11 7 11zM12 7.4a2.6 2.6 0 110 5.2 2.6 2.6 0 010-5.2z',
  doc: 'M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5zM14 3v5h5',
  law: 'M4 7h16M6 7v13h12V7M9 11v5M15 11v5M12 3l8 4H4z',
  book: 'M4 5h6v14H4zM14 5h6v14h-6M4 9h6M14 9h6',
  net: 'M6 4.4a2.6 2.6 0 110 5.2 2.6 2.6 0 010-5.2zM18 4.4a2.6 2.6 0 110 5.2 2.6 2.6 0 010-5.2zM12 15.4a2.6 2.6 0 110 5.2 2.6 2.6 0 010-5.2zM8.3 8.4l2.4 7.2M15.7 8.4l-2.4 7.2M8.6 7h6.8',
  arrowLeft: 'M19 12H5M11 6l-6 6 6 6',
  warn: 'M12 3l10 18H2L12 3zM12 10v5M12 18h.01',
};

/** برچسب کوچک بالای تیترها؛ خط رنگی از راست (آغاز سطر) رشد می‌کند */
export const Kicker: React.FC<{
  text: string;
  delay?: number;
  color?: string;
  bar?: string;
  size?: number;
}> = ({ text, delay = 0, color = 'rgba(255,255,255,.72)', bar = BRAND_GRADIENT, size = 30 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: f - delay, fps, config: { damping: 200 } });
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: size, fontWeight: 700, color }}>
      <span
        style={{
          width: 64, height: 7, borderRadius: 9, backgroundImage: bar,
          transform: `scaleX(${p})`, transformOrigin: 'right center',
        }}
      />
      <span style={{ opacity: p, transform: `translateX(${(1 - p) * 24}px)` }}>{text}</span>
    </div>
  );
};

/** پس‌زمینه‌ی سراسری: شفق رنگی آرام که با طول ویدئو دوره‌ای است تا حلقه‌ی پخش بی‌درز باشد */
export const Backdrop: React.FC<{ frame: number }> = ({ frame }) => {
  const t = (frame / DURATION) * Math.PI * 2;
  // فقط transform تغییر می‌کند تا مرورگر در پلیر هر فریم را از نو نقاشی نکند
  const blob = (
    x: number, y: number, r: number, color: string, a: number, k: number, ph: number, ax: number, ay: number,
  ): React.CSSProperties => ({
    position: 'absolute',
    left: x - r,
    top: y - r,
    width: r * 2,
    height: r * 2,
    borderRadius: '50%',
    willChange: 'transform',
    transform: `translate3d(${(Math.sin(t * k + ph) * ax).toFixed(1)}px, ${(Math.cos(t * k + ph * 1.3) * ay).toFixed(1)}px, 0)`,
    background: `radial-gradient(closest-side, ${alpha(color, a)}, ${alpha(color, a * 0.35)} 45%, ${alpha(color, 0)})`,
  });
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(120% 95% at 50% 38%, #0D1230 0%, #070A1A 52%, #03040B 100%)', overflow: 'hidden' }}>
      <div style={blob(1520, 170, 860, C.purple, 0.5, 1, 0.4, 140, 90)} />
      <div style={blob(330, 300, 760, C.teal, 0.36, 2, 2.1, 120, 110)} />
      <div style={blob(1240, 1020, 820, C.pink, 0.3, 1, 4.2, 160, 70)} />
      <div style={blob(160, 980, 640, C.amber, 0.28, 2, 1.1, 90, 80)} />
      <AbsoluteFill
        style={{
          WebkitMaskImage: 'radial-gradient(75% 70% at 50% 45%, #000 0%, transparent 78%)',
          maskImage: 'radial-gradient(75% 70% at 50% 45%, #000 0%, transparent 78%)',
          opacity: 0.55,
        }}
      >
        <div
          style={{
            position: 'absolute', top: 0, bottom: 0, left: 0, right: -36, willChange: 'transform',
            backgroundImage: 'radial-gradient(rgba(255,255,255,.16) 1.3px, transparent 1.6px)',
            backgroundSize: '36px 36px',
            transform: `translate3d(${-((frame * 0.35) % 36).toFixed(2)}px, 0, 0)`,
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const NOISE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`,
  );

/** دانه‌ی فیلم و سایه‌ی لبه‌ها روی همه‌چیز */
export const Finish: React.FC<{ frame: number }> = ({ frame }) => (
  <>
    <AbsoluteFill style={{ overflow: 'hidden', pointerEvents: 'none', opacity: 0.06 }}>
      <div
        style={{
          position: 'absolute', inset: -220, willChange: 'transform', backgroundImage: `url("${NOISE}")`,
          transform: `translate3d(${(frame * 71) % 220}px, ${(frame * 43) % 220}px, 0)`,
        }}
      />
    </AbsoluteFill>
    <AbsoluteFill
      style={{
        background: 'radial-gradient(120% 120% at 50% 50%, transparent 58%, rgba(0,0,0,.55) 100%)',
        pointerEvents: 'none',
      }}
    />
  </>
);

/** میدان نقطه‌های چشمک‌زن؛ «داده» در پس‌زمینه‌ی صحنه‌ی آغاز */
export const DataField: React.FC<{ count?: number; opacity?: number }> = ({ count = 56, opacity = 1 }) => {
  const f = useCurrentFrame();
  const colors = [C.violet, C.mint, C.gold, C.rose, '#fff'];
  const drift = (f * 0.35) % 36;
  return (
    <AbsoluteFill style={{ opacity }}>
      {Array.from({ length: count }, (_, i) => {
        const gx = Math.floor(random(`x${i}`) * 54) * 36 + 18;
        const gy = Math.floor(random(`y${i}`) * 30) * 36 + 18;
        const ph = random(`p${i}`) * Math.PI * 2;
        const sp = 0.05 + random(`s${i}`) * 0.07;
        const tw = Math.max(0, Math.sin(f * sp + ph));
        const col = colors[i % colors.length];
        const appear = interpolate(f, [i * 1.5, i * 1.5 + 20], [0, 1], clamp);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: gx - 4,
              top: gy - 4,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: col,
              opacity: (0.15 + tw * 0.85) * appear,
              transform: `translate3d(${-drift.toFixed(2)}px, 0, 0) scale(${(0.5 + tw * 0.5).toFixed(3)})`,
              boxShadow: `0 0 22px ${alpha(col, 0.8)}`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
