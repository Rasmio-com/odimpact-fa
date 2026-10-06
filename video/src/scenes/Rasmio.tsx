import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import data from '../generated/data.json';
import { Series } from '../components/Series';
import { Words } from '../components/Words';
import { CountUp, Icon, Kicker, Scene, clamp } from '../components/ui';
import { SCENES } from '../timeline';
import { C, alpha } from '../theme';

// نمونه‌ی ایرانی: متن و عددها از data/ecosystem.json می‌آیند (همان‌ها که در صفحه‌ی سایت هست)
const A = data.actors[0];
const V = A.video;
const [B1, B2] = C.ecosystem;
const BAR = `linear-gradient(270deg, ${B1}, ${B2})`;

const WIPE = 18;
const TOTAL = SCENES.find((s) => s.id === 'rasmio')!.duration;
const D1 = 96;
const D2 = 108;
const D3 = 132;
// جمع طول‌ها منهای هم‌پوشانی گذارها = طول صحنه
const D4 = TOTAL + 3 * WIPE - (D1 + D2 + D3);

export const Rasmio: React.FC = () => (
  <Series
    T={WIPE}
    items={[
      { key: 'problem', duration: D1, node: <Problem /> },
      { key: 'connect', duration: D2, enter: 'cross', node: <Connect /> },
      { key: 'dims', duration: D3, enter: 'cross', node: <Dims /> },
      { key: 'figures', duration: D4, enter: 'cross', node: <Figures /> },
    ]}
  />
);

const toNum = (s: string) =>
  Number(s.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace('٫', '.'));

// ۱) داده‌ی منتشرشده، متنی آزاد
const BARS = [92, 100, 64, 96, 100, 78, 98, 54, 88];
const HIT = [3, 6];

const Problem: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const q = spring({ frame: f - 50, fps, config: { damping: 13, mass: 0.7 } });
  const hit = interpolate(f, [56, 70], [0, 1], clamp);
  return (
    <Scene>
      <div style={{ position: 'absolute', right: 150, top: 140, width: 980 }}>
        <Kicker text="نمونه‌ی ایرانی" delay={0} color={B2} bar={BAR} />
        <div style={{ fontSize: 112, fontWeight: 900, lineHeight: 1.35, marginTop: 20 }}>
          <Words
            segs={['آگهی روزنامه‌ی رسمی،', { t: 'متنی آزاد', grad: `linear-gradient(97deg,${B2},#A78BFA)`, mark: true }]}
            delay={6} stagger={6} rise={56}
          />
        </div>
        <div style={{ fontSize: 44, fontWeight: 300, lineHeight: 1.75, color: 'rgba(255,255,255,.8)', marginTop: 22, maxWidth: 860 }}>
          <Words segs="نام شرکت، هیئت‌مدیره و صاحبان امضا لابه‌لای جمله‌ها پنهان است." delay={26} stagger={3} />
        </div>
        <div
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 22, marginTop: 56, padding: '24px 38px', borderRadius: 999,
            background: alpha(B1, 0.24), border: `1.5px solid ${alpha(B2, 0.55)}`,
            opacity: Math.min(1, q * 1.3), transform: `translateY(${(1 - q) * 40}px) scale(${0.92 + 0.08 * q})`,
          }}
        >
          <span
            style={{
              width: 58, height: 58, borderRadius: '50%', display: 'grid', placeItems: 'center',
              background: B1, fontSize: 38, fontWeight: 900,
            }}
          >
            ؟
          </span>
          <span style={{ fontSize: 50, fontWeight: 700 }}>{V.question}</span>
        </div>
      </div>
      {/* کارت آگهی: خط‌های بی‌ساختار، نه متن واقعی */}
      <div
        style={{
          position: 'absolute', left: 170, top: 150, width: 640, height: 780, padding: '54px 50px', borderRadius: 36,
          background: 'linear-gradient(160deg, rgba(255,255,255,.08), rgba(255,255,255,.025))',
          border: '1.5px solid rgba(255,255,255,.14)', display: 'flex', flexDirection: 'column', gap: 38,
          opacity: interpolate(f, [0, 16], [0, 1], clamp),
        }}
      >
        {BARS.map((w, i) => {
          const grow = interpolate(f, [8 + i * 4, 28 + i * 4], [0, w], clamp);
          const on = HIT.includes(i) ? hit : 0;
          return (
            <div
              key={i}
              style={{
                height: 24, borderRadius: 12, width: `${grow}%`,
                background: on ? `linear-gradient(270deg, ${B1}, ${B2})` : 'rgba(255,255,255,.16)',
                opacity: on ? 0.55 + 0.45 * on : 1,
                boxShadow: on ? `0 0 ${34 * on}px ${alpha(B2, 0.6 * on)}` : undefined,
              }}
            />
          );
        })}
      </div>
    </Scene>
  );
};

// ۲) رسمیو منبع‌های عمومی را به هم وصل می‌کند
const CHIP_W = 540;
const CHIP_H = 74;
const CHIP_GAP = 18;
const CHIP_TOP = 330;
const CHIP_LEFT = 1920 - 150 - CHIP_W; // لبه‌ی چپ ستون منبع‌ها
const CARD = { left: 160, top: 290, w: 740, h: 650 };

const Connect: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ty = CARD.top + CARD.h / 2;
  return (
    <Scene>
      <div style={{ position: 'absolute', right: 150, top: 120, width: 1640 }}>
        <div style={{ fontSize: 80, whiteSpace: 'nowrap', fontWeight: 900, lineHeight: 1.3 }}>
          <Words
            segs={['رسمیو منبع‌های عمومی را', { t: 'به هم وصل', grad: `linear-gradient(97deg,${B2},#A78BFA)`, mark: true }, 'می‌کند']}
            delay={2} stagger={5} rise={50}
          />
        </div>
      </div>
      <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        {V.sources.map((_, i) => {
          const cy = CHIP_TOP + i * (CHIP_H + CHIP_GAP) + CHIP_H / 2;
          const p = interpolate(f, [24 + i * 5, 52 + i * 5], [0, 1], clamp);
          const x1 = CHIP_LEFT;
          const x2 = CARD.left + CARD.w;
          const mx = (x1 + x2) / 2;
          return (
            <path
              key={i}
              d={`M${x1} ${cy} C${mx} ${cy}, ${mx} ${ty}, ${x2} ${ty}`}
              fill="none" stroke={B2} strokeOpacity={0.7} strokeWidth={2.4} strokeLinecap="round"
              pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p}
            />
          );
        })}
      </svg>
      {V.sources.map((s, i) => {
        const p = spring({ frame: f - 10 - i * 4, fps, config: { damping: 15, mass: 0.7 } });
        return (
          <div
            key={s}
            style={{
              position: 'absolute', right: 150, top: CHIP_TOP + i * (CHIP_H + CHIP_GAP), width: CHIP_W, height: CHIP_H,
              display: 'flex', alignItems: 'center', gap: 18, padding: '0 28px', borderRadius: 22, fontSize: 36, fontWeight: 700,
              background: 'rgba(255,255,255,.07)', border: '1.5px solid rgba(255,255,255,.16)',
              opacity: Math.min(1, p * 1.3), transform: `translateX(${(1 - p) * 90}px)`,
            }}
          >
            <span style={{ width: 14, height: 14, borderRadius: '50%', background: B2, flex: 'none' }} />
            {s}
          </div>
        );
      })}
      <div
        style={{
          position: 'absolute', left: CARD.left, top: CARD.top, width: CARD.w, height: CARD.h, padding: '40px 46px',
          borderRadius: 36, background: `linear-gradient(160deg, ${alpha(B1, 0.4)}, rgba(10,13,30,.9))`,
          border: `1.5px solid ${alpha(B2, 0.5)}`, boxShadow: `0 40px 90px -40px ${alpha(B1, 0.9)}`,
          opacity: interpolate(f, [30, 50], [0, 1], clamp),
          transform: `scale(${interpolate(f, [30, 54], [0.94, 1], clamp)})`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 44, fontWeight: 800 }}>
          <span style={{ width: 18, height: 18, borderRadius: '50%', background: B2, boxShadow: `0 0 0 8px ${alpha(B2, 0.25)}` }} />
          پروفایل شرکت
        </div>
        <div style={{ marginTop: 30, display: 'flex', flexDirection: 'column', gap: 22 }}>
          {V.profile.map((row, i) => {
            const p = interpolate(f, [58 + i * 6, 74 + i * 6], [0, 1], clamp);
            return (
              <div
                key={row}
                style={{
                  display: 'flex', alignItems: 'center', gap: 22, height: 72, padding: '0 26px', borderRadius: 20,
                  background: 'rgba(255,255,255,.07)', fontSize: 34, fontWeight: 600,
                  opacity: p, transform: `translateY(${(1 - p) * 20}px)`,
                }}
              >
                {row}
                <span style={{ marginRight: 'auto', height: 16, width: 60 + ((i * 37) % 90), borderRadius: 8, background: alpha(B2, 0.5) }} />
              </div>
            );
          })}
        </div>
      </div>
    </Scene>
  );
};

// ۳) خدمتی که به هر چهار بُعد می‌رسد
const Dims: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Scene>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Kicker text="در چارچوب گاورلب" delay={0} color={B2} bar={BAR} />
        </div>
        <div style={{ fontSize: 100, fontWeight: 900, lineHeight: 1.35, marginTop: 18 }}>
          <Words
            segs={['خدمتی که به', { t: 'هر چهار بُعد', grad: true, mark: true }, 'می‌رسد']}
            delay={4} stagger={5} rise={56}
          />
        </div>
        <div style={{ display: 'flex', gap: 30, marginTop: 64 }}>
          {V.dims.map((d, i) => {
            const c = data.categories.find((x) => x.slug === d.dimension)!;
            const p = spring({ frame: f - 24 - i * 8, fps, config: { damping: 13, mass: 0.7 } });
            return (
              <div
                key={d.dimension}
                style={{
                  width: 380, minHeight: 440, padding: '30px 30px', borderRadius: 30, textAlign: 'right',
                  background: `linear-gradient(160deg, ${alpha(c.accent, 0.3)}, rgba(255,255,255,.03))`,
                  border: `1.5px solid ${alpha(c.accent2, 0.38)}`,
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
                <div style={{ fontSize: 36, fontWeight: 800, marginTop: 22, whiteSpace: 'nowrap', color: c.accent2 }}>{c.title}</div>
                <div style={{ fontSize: 33, fontWeight: 400, lineHeight: 1.75, color: 'rgba(255,255,255,.86)', marginTop: 10 }}>
                  {d.line}
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </Scene>
  );
};

// ۴) عددها، با منبع و تاریخ
const PICK = [0, 2, 3]; // پایگاه، به‌روزرسانی روزانه، استعلام روزانه

const Figures: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Scene>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ fontSize: 92, fontWeight: 900, lineHeight: 1.35 }}>
          <Words
            segs={['واسط داده‌ی باز، داده را', { t: 'به خدمت', grad: true, mark: true }, 'تبدیل می‌کند']}
            delay={2} stagger={5} rise={50}
          />
        </div>
        <div style={{ display: 'flex', gap: 34, marginTop: 70 }}>
          {PICK.map((k, i) => {
            const fg = A.figures[k];
            const p = spring({ frame: f - 14 - i * 8, fps, config: { damping: 14, mass: 0.8 } });
            return (
              <div
                key={fg.label}
                style={{
                  width: 520, padding: '34px 34px 30px', borderRadius: 34, textAlign: 'right',
                  background: `linear-gradient(160deg, ${alpha(B1, 0.32)}, rgba(255,255,255,.03))`,
                  border: `1.5px solid ${alpha(B2, 0.4)}`,
                  opacity: Math.min(1, p * 1.3), transform: `translateY(${(1 - p) * 60}px)`,
                }}
              >
                <div style={{ fontSize: 30, fontWeight: 600, color: 'rgba(255,255,255,.62)', minHeight: 40 }}>{fg.prefix}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
                  <span
                    style={{
                      fontSize: 168, fontWeight: 900, lineHeight: 1.1,
                      backgroundImage: `linear-gradient(170deg, #fff 12%, ${B2} 60%, ${B1})`,
                      WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
                    }}
                  >
                    <CountUp to={toNum(fg.value)} start={16 + i * 8} dur={38} />
                  </span>
                  <span style={{ fontSize: 46, fontWeight: 800 }}>{fg.unit}</span>
                </div>
                <div style={{ fontSize: 34, fontWeight: 400, lineHeight: 1.6, color: 'rgba(255,255,255,.82)' }}>{fg.label}</div>
              </div>
            );
          })}
        </div>
        <div
          style={{
            marginTop: 44, fontSize: 28, fontWeight: 400, color: 'rgba(255,255,255,.52)',
            opacity: interpolate(f, [40, 56], [0, 1], clamp),
          }}
        >
          منبع: {A.figuresSource}
        </div>
      </AbsoluteFill>
    </Scene>
  );
};
