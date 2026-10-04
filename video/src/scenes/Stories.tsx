import React from 'react';
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Words } from '../components/Words';
import { CountUp, ICONS, Icon, Kicker, Scene, clamp } from '../components/ui';
import { STORIES, type Story } from '../stories';
import { alpha, fa } from '../theme';

const FIRST = 22; // کارت اول از چپ وارد می‌شود
const HOLD = 52;
const MOVE = 18;
const STEP = HOLD + MOVE;
const CARD_W = 1180;
const GAP = 90;

/** شماره‌ی پیوسته‌ی کارت فعال: ‎-۱ (هنوز نیامده) تا ۵ */
const indexAt = (f: number) => {
  if (f < FIRST) return interpolate(f, [0, FIRST], [-1, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  const t = f - FIRST;
  const j = Math.floor(t / STEP);
  if (j >= STORIES.length - 1) return STORIES.length - 1;
  const local = t - j * STEP;
  const m = interpolate(local, [HOLD, STEP], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  return j + m;
};
export const activeAt = (j: number) => (j === 0 ? 4 : FIRST + j * STEP - 14);

export const Stories: React.FC = () => {
  const f = useCurrentFrame();
  const idx = indexAt(f);
  return (
    <Scene>
      <div style={{ position: 'absolute', top: 70, right: 150 }}>
        <Kicker text="روایت‌ها" delay={0} />
        <div style={{ fontSize: 76, fontWeight: 900, lineHeight: 1.35, marginTop: 8 }}>
          <Words segs={['شواهد،', { t: 'نه شعار', grad: true }]} delay={4} stagger={5} />
        </div>
      </div>
      <div style={{ position: 'absolute', top: 66, left: 150, fontSize: 30, fontWeight: 700, color: 'rgba(255,255,255,.55)' }}>
        {fa(Math.min(STORIES.length, Math.max(1, Math.round(idx) + 1)))} از {fa(STORIES.length)}
      </div>
      {STORIES.map((s, i) => {
        // کارت بعدی سمت چپ است؛ با جلو رفتن، ردیف کارت‌ها به راست سُر می‌خورد
        const k = i - idx;
        if (Math.abs(k) > 1.6) return null;
        const x = 960 - CARD_W / 2 - k * (CARD_W + GAP);
        const focus = 1 - Math.min(1, Math.abs(k));
        return (
          <div
            key={s.slug}
            style={{
              position: 'absolute', top: 246, left: x, width: CARD_W, height: 700,
              transform: `perspective(2200px) scale(${0.84 + 0.16 * focus}) rotateY(${k * -7}deg)`,
              opacity: 0.3 + 0.7 * focus,
            }}
          >
            <Card s={s} at={activeAt(i)} />
          </div>
        );
      })}
      <div style={{ position: 'absolute', bottom: 64, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 12 }}>
        {STORIES.map((s, i) => {
          const on = 1 - Math.min(1, Math.abs(i - idx));
          return (
            <div key={s.slug} style={{ width: 14 + on * 42, height: 14, borderRadius: 9, background: on > 0.5 ? s.c2 : 'rgba(255,255,255,.25)' }} />
          );
        })}
      </div>
    </Scene>
  );
};

const Card: React.FC<{ s: Story; at: number }> = ({ s, at }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: f - at, fps, config: { damping: 16, mass: 0.7 } });
  const stat = s.stat;
  return (
    <div
      style={{
        position: 'relative', width: '100%', height: '100%', borderRadius: 44, overflow: 'hidden',
        background: `radial-gradient(70% 90% at 88% 0%, ${alpha(s.c2, 0.5)}, transparent 70%),
          radial-gradient(60% 80% at 0% 100%, ${alpha(s.c1, 0.55)}, transparent 70%),
          linear-gradient(140deg, ${alpha(s.c1, 0.92)}, #0A0D20 72%)`,
        border: `1.5px solid ${alpha(s.c2, 0.4)}`,
        boxShadow: `0 70px 140px -50px ${alpha(s.c1, 0.75)}, inset 0 1px 0 rgba(255,255,255,.2)`,
        padding: '52px 60px',
      }}
    >
      <div
        style={{
          position: 'absolute', inset: 0, opacity: 0.5,
          backgroundImage: 'radial-gradient(rgba(255,255,255,.5) 1.2px, transparent 1.4px)', backgroundSize: '22px 22px',
          WebkitMaskImage: 'linear-gradient(to top right, #000, transparent 60%)',
          maskImage: 'linear-gradient(to top right, #000, transparent 60%)',
        }}
      />
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12, fontSize: 28, fontWeight: 700, padding: '10px 22px', borderRadius: 99, background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.22)' }}>
          {s.warn ? <Icon d={ICONS.warn} size={30} color="#fff" stroke={2.2} /> : <i style={{ width: 12, height: 12, borderRadius: '50%', background: '#fff' }} />}
          {s.warn ? 'وقتی نتیجه معکوس شد' : s.category}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 30, fontWeight: 700 }}>
          <Icon d={ICONS.pin} size={30} color="#fff" stroke={2} />
          {s.country}
        </span>
      </div>
      <div
        style={{
          position: 'relative', marginTop: 34, display: 'flex', alignItems: 'baseline', gap: 22, flexWrap: 'wrap',
          opacity: Math.min(1, p * 1.4), transform: `translateX(${(1 - p) * 60}px)`,
        }}
      >
        {'text' in stat ? (
          <span style={{ fontSize: 140, fontWeight: 900, lineHeight: 1.15 }}>{stat.text}</span>
        ) : (
          <>
            {stat.prefix ? <span style={{ fontSize: 64, fontWeight: 500, opacity: 0.85 }}>{stat.prefix}</span> : null}
            <span style={{ fontSize: 160, fontWeight: 900, lineHeight: 1.05, textShadow: `0 20px 60px ${alpha(s.c1, 0.6)}` }}>
              <CountUp to={stat.value} decimals={stat.decimals} start={at} dur={34} />
            </span>
            <span style={{ fontSize: 72, fontWeight: 800 }}>{stat.suffix}</span>
          </>
        )}
      </div>
      <div style={{ position: 'relative', fontSize: 37, fontWeight: 400, lineHeight: 1.6, color: 'rgba(255,255,255,.9)', marginTop: 12, maxWidth: 1060 }}>
        <Words segs={s.caption} delay={at + 8} stagger={1.4} rise={16} blur={0} />
      </div>
      <div
        style={{
          position: 'absolute', right: 60, left: 60, bottom: 46, paddingTop: 22, borderTop: '1.5px solid rgba(255,255,255,.18)',
          fontSize: 38, fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}
      >
        <span>{s.title}</span>
        <Icon d={ICONS.arrowLeft} size={40} color="rgba(255,255,255,.75)" stroke={2.2} />
      </div>
    </div>
  );
};
