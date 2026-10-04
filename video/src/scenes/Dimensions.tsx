import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import data from '../generated/data.json';
import { Series } from '../components/Series';
import { Words } from '../components/Words';
import { CountUp, Icon, Kicker, Scene, clamp } from '../components/ui';
import { DIMENSION_PICKS, caseBySlug } from '../stories';
import { SCENES } from '../timeline';
import { alpha, fa } from '../theme';

const INTRO = 92;
const PANEL = 108;
const WIPE = 18;
const TOTAL = SCENES.find((s) => s.id === 'dimensions')!.duration;
// پنل آخر آن‌قدر کش می‌آید که کل صحنه پر شود
const LAST = TOTAL - (INTRO + PANEL * 3 - WIPE * 4);

type Cat = (typeof data.categories)[number];

// عنوان هر بُعد باید در یک سطر جا شود؛ «توانمندسازی شهروندان» بلندترین است (۹۳۵px در ۱۰۰px)
const TITLE_SIZE: Record<string, number> = { 'empowering-citizens': 106 };

export const Dimensions: React.FC = () => (
  <Series
    T={WIPE}
    items={[
      { key: 'intro', duration: INTRO, node: <Intro /> },
      ...data.categories.map((c, i) => ({
        key: c.slug, duration: i === 3 ? LAST : PANEL, enter: 'slant' as const, node: <Panel i={i} cat={c} />,
      })),
    ]}
  />
);

const Intro: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Scene>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Kicker text="چارچوب تحلیلی گاورلب" delay={0} />
        </div>
        <div style={{ fontSize: 112, fontWeight: 900, lineHeight: 1.35, marginTop: 22 }}>
          <Words segs={['داده‌ی باز از', { t: 'چهار مسیر', grad: true, mark: true }, 'اثر می‌گذارد']} delay={4} stagger={5} rise={56} />
        </div>
        <div style={{ display: 'flex', gap: 30, marginTop: 70 }}>
          {data.categories.map((c, i) => {
            const p = spring({ frame: f - 26 - i * 6, fps, config: { damping: 13, mass: 0.7 } });
            return (
              <div
                key={c.slug}
                style={{
                  width: 380, padding: '30px 30px', borderRadius: 30, textAlign: 'right',
                  background: `linear-gradient(160deg, ${alpha(c.accent, 0.3)}, rgba(255,255,255,.03))`,
                  border: `1.5px solid ${alpha(c.accent2, 0.35)}`,
                  opacity: Math.min(1, p * 1.3), transform: `translateY(${(1 - p) * 70}px) scale(${0.9 + 0.1 * p})`,
                }}
              >
                <div
                  style={{
                    width: 74, height: 74, borderRadius: 22, display: 'grid', placeItems: 'center',
                    background: alpha(c.accent, 0.28),
                  }}
                >
                  <Icon d={c.icon} size={40} color={c.accent2} stroke={2} />
                </div>
                <div style={{ fontSize: 36, fontWeight: 800, marginTop: 22, whiteSpace: 'nowrap' }}>{c.title}</div>
                <div style={{ fontSize: 28, fontWeight: 400, color: 'rgba(255,255,255,.66)', marginTop: 4 }}>
                  {fa(c.count)} مطالعه‌ی موردی
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </Scene>
  );
};

const Panel: React.FC<{ i: number; cat: Cat }> = ({ i, cat }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = i === 3 ? LAST : PANEL;
  const numP = spring({ frame: f - 4, fps, config: { damping: 14, mass: 0.9 } });
  const progress = interpolate(f, [0, dur - WIPE], [0, 1], clamp);
  const picks = DIMENSION_PICKS[cat.slug].map(caseBySlug);
  return (
    <Scene
      style={{
        background: `radial-gradient(60% 85% at 22% 56%, ${alpha(cat.accent, 0.62)}, transparent 72%),
          radial-gradient(55% 60% at 92% 4%, ${alpha(cat.accent2, 0.22)}, transparent 70%),
          linear-gradient(180deg, #070A1C, #04060F)`,
      }}
    >
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${alpha('#ffffff', 0.05)} 1px, transparent 1px), linear-gradient(90deg, ${alpha('#ffffff', 0.05)} 1px, transparent 1px)`,
          backgroundSize: '72px 72px',
          WebkitMaskImage: 'linear-gradient(90deg, #000, transparent 70%)',
          maskImage: 'linear-gradient(90deg, #000, transparent 70%)',
        }}
      />
      {/* ستون چپ: عدد بزرگ و نماد */}
      <div style={{ position: 'absolute', left: 110, top: 120, width: 700, height: 840, display: 'grid', placeItems: 'center' }}>
        <Icon
          d={cat.icon}
          size={700}
          color={alpha(cat.accent2, 0.16)}
          stroke={0.9}
          style={{ position: 'absolute', willChange: 'transform', transform: `rotate(${interpolate(f, [0, dur], [-10, 6])}deg) scale(${0.9 + 0.1 * numP})` }}
        />
        <div style={{ textAlign: 'center', position: 'relative' }}>
          <div
            style={{
              fontSize: 420, fontWeight: 900, lineHeight: 1,
              backgroundImage: `linear-gradient(170deg, #fff 12%, ${cat.accent2} 55%, ${cat.accent})`,
              WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
              padding: '.1em .05em', margin: '-.1em -.05em',
              transform: `scale(${0.7 + 0.3 * numP})`, opacity: Math.min(1, numP * 1.4),
            }}
          >
            <CountUp to={cat.count} start={4} dur={34} />
          </div>
          <div style={{ fontSize: 46, fontWeight: 700, color: cat.accent2, marginTop: 6, opacity: numP }}>
            مطالعه‌ی موردی
          </div>
        </div>
      </div>
      {/* ستون راست: متن */}
      <div style={{ position: 'absolute', right: 150, top: 168, width: 1010 }}>
        <Kicker text={`بُعد ${fa(i + 1)} از ${fa(4)}`} color={cat.accent2}
          bar={`linear-gradient(270deg, ${cat.accent}, ${cat.accent2})`} delay={2} />
        <div style={{ fontSize: TITLE_SIZE[cat.slug] ?? 132, fontWeight: 900, lineHeight: 1.28, marginTop: 18, whiteSpace: 'nowrap' }}>
          <Words segs={cat.title} delay={6} stagger={6} rise={60} />
        </div>
        <div dir="ltr" style={{ textAlign: 'right', fontSize: 28, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', fontWeight: 600, marginTop: 2, opacity: interpolate(f, [16, 30], [0, 1], clamp) }}>
          {cat.titleEn}
        </div>
        <div style={{ fontSize: 46, fontWeight: 300, lineHeight: 1.62, color: 'rgba(255,255,255,.88)', marginTop: 28, maxWidth: 880 }}>
          <Words segs={cat.tagline} delay={16} stagger={2} rise={20} blur={0} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 16, marginTop: 44 }}>
          {picks.map((c, k) => {
            const p = spring({ frame: f - 34 - k * 6, fps, config: { damping: 15, mass: 0.6 } });
            return (
              <div
                key={c.slug}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 16, padding: '14px 28px 14px 30px', borderRadius: 999,
                  background: 'rgba(255,255,255,.075)', border: '1.5px solid rgba(255,255,255,.14)',
                  fontSize: 32, fontWeight: 600, opacity: Math.min(1, p * 1.3),
                  transform: `translateX(${(1 - p) * 70}px)`,
                }}
              >
                <i style={{ width: 14, height: 14, borderRadius: '50%', background: cat.accent2, boxShadow: `0 0 14px ${cat.accent2}` }} />
                {c.title}
                <span style={{ fontWeight: 400, fontSize: 27, color: 'rgba(255,255,255,.58)' }}>{c.country}</span>
              </div>
            );
          })}
        </div>
      </div>
      {/* نشانگر پیشرفت چهار بُعد؛ از راست پر می‌شود */}
      <div style={{ position: 'absolute', bottom: 76, right: 150, display: 'flex', gap: 14 }}>
        {[0, 1, 2, 3].map((j) => (
          <div key={j} style={{ width: 120, height: 8, borderRadius: 9, background: 'rgba(255,255,255,.14)', overflow: 'hidden' }}>
            <div
              style={{
                width: '100%', height: '100%', borderRadius: 9,
                background: data.categories[j].accent2,
                transformOrigin: 'right center',
                transform: `scaleX(${j < i ? 1 : j === i ? progress : 0})`,
              }}
            />
          </div>
        ))}
      </div>
    </Scene>
  );
};
