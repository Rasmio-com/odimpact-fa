import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import data from '../generated/data.json';
import { Words } from '../components/Words';
import { CountUp, Kicker, Scene } from '../components/ui';
import { C, alpha } from '../theme';

const N = data.counts;
const TILES: { n: number; label: string; c: readonly [string, string] }[] = [
  { n: N.cases, label: 'مطالعه‌ی موردی', c: [C.purple, C.violet] },
  { n: N.countries, label: 'کشور و قلمرو', c: [C.teal, C.mint] },
  { n: N.dimensions, label: 'بُعد تأثیر', c: [C.amber, C.gold] },
  { n: N.reports, label: 'گزارش فارسی', c: C.reports },
  { n: N.laws, label: 'مفاد قانونی ایران', c: C.laws },
  { n: N.library, label: 'منبع پژوهشی', c: C.library },
];

export const Numbers: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Scene>
      <div style={{ position: 'absolute', top: 92, right: 150, left: 150 }}>
        <Kicker text="در یک نگاه" delay={2} />
        <div style={{ fontSize: 84, fontWeight: 900, lineHeight: 1.35, marginTop: 14 }}>
          <Words segs={['یک کتابخانه‌ی کامل،', { t: 'به فارسی', grad: true }]} delay={6} stagger={4} />
        </div>
      </div>
      <div
        style={{
          position: 'absolute', top: 336, right: 150, left: 150,
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 30,
        }}
      >
        {TILES.map((t, i) => {
          const at = 16 + i * 7;
          const p = spring({ frame: f - at, fps, config: { damping: 15, mass: 0.7, stiffness: 120 } });
          return (
            <div
              key={t.label}
              style={{
                position: 'relative', height: 236, borderRadius: 34, overflow: 'hidden',
                padding: '30px 42px', display: 'flex', flexDirection: 'column', justifyContent: 'center',
                background: `linear-gradient(160deg, rgba(255,255,255,.085), rgba(255,255,255,.02))`,
                border: '1.5px solid rgba(255,255,255,.12)',
                boxShadow: `0 40px 80px -40px ${alpha(t.c[0], 0.7)}`,
                opacity: Math.min(1, p * 1.3),
                transform: `translate3d(${(1 - p) * 90}px, ${(1 - p) * 30}px, 0) scale(${0.93 + 0.07 * p})`,
              }}
            >
              <div style={{ position: 'absolute', inset: '0 0 auto', height: 7, backgroundImage: `linear-gradient(270deg, ${t.c[0]}, ${t.c[1]})` }} />
              <div
                style={{
                  position: 'absolute', width: 380, height: 380, top: -170, right: -120, borderRadius: '50%',
                  background: `radial-gradient(closest-side, ${alpha(t.c[0], 0.5)}, transparent)`,
                }}
              />
              <div
                style={{
                  position: 'relative', fontSize: 132, fontWeight: 900, lineHeight: 1.05,
                  backgroundImage: `linear-gradient(160deg, #fff 30%, ${t.c[1]})`,
                  WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
                  padding: '.12em 0', margin: '-.12em 0',
                }}
              >
                <CountUp to={t.n} start={at + 4} dur={44} />
              </div>
              <div style={{ position: 'relative', fontSize: 38, fontWeight: 600, color: 'rgba(255,255,255,.78)', marginTop: 6 }}>
                {t.label}
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: 'absolute', bottom: 96, right: 150, left: 150, fontSize: 42, fontWeight: 300,
          color: 'rgba(255,255,255,.8)',
        }}
      >
        <Words segs="همراه با" delay={96} stagger={3} /> <WordsCount at={100} />
      </div>
    </Scene>
  );
};

/** «… بیش از ۲۱۴٬۴۱۳ واژه‌ی فارسی و ۱۰۴ شکل و نمودار» با شمارنده‌ی درون‌خطی */
const WordsCount: React.FC<{ at: number }> = ({ at }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: f - at, fps, config: { damping: 200 } });
  return (
    <span style={{ display: 'inline-block', opacity: p, transform: `translateY(${(1 - p) * 24}px)` }}>
      <b style={{ fontWeight: 900, color: '#fff' }}>
        <CountUp to={N.words} start={at} dur={60} />
      </b>{' '}
      واژه‌ی فارسی و{' '}
      <b style={{ fontWeight: 900, color: '#fff' }}>
        <CountUp to={N.figures} start={at + 10} dur={50} />
      </b>{' '}
      شکل و نمودار
    </span>
  );
};
