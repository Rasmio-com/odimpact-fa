import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import data from '../generated/data.json';
import { COUNTRIES, DotMap, IRAN, Pin, accentOf } from '../components/DotMap';
import { Words } from '../components/Words';
import { CountUp, ICONS, Icon, Kicker, Scene, clamp } from '../components/ui';
import { C, alpha } from '../theme';

const N = data.counts;
const MAP_LEFT = 240;
const MAP_TOP = 250;
const MAP_WIDTH = 1440;

type Pt = [number, number];
/** نقطه‌ی t روی منحنی درجه‌دوم بزیه */
const quad = (a: Pt, c: Pt, b: Pt, t: number): Pt => {
  const u = 1 - t;
  return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]];
};

// کمان از هر کشور تا ایران، با برآمدگی رو به بالا
const ARCS = COUNTRIES.map((c, i) => {
  const a: Pt = [c.x, c.y];
  const b: Pt = [IRAN[0], IRAN[1]];
  const dist = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const ctrl: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - dist * 0.32];
  let len = 0;
  for (let k = 1, prev = a; k <= 40; k++) {
    const p = quad(a, ctrl, b, k / 40);
    len += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
    prev = p;
  }
  const d = `M${a[0]} ${a[1]} Q${ctrl[0].toFixed(1)} ${ctrl[1].toFixed(1)} ${b[0]} ${b[1]}`;
  return { d, a, ctrl, b, len, color: accentOf(c.cases[0].category)[1], at: 18 + i * 3, country: c };
});

const CARDS = [
  { n: N.reports, label: 'گزارش فارسی', sub: 'تألیفی و ترجمه‌ای', icon: ICONS.doc, c: C.reports },
  { n: N.laws, label: 'مفاد قانونی ایران', sub: 'از قانون اساسی تا مصوبه‌ها', icon: ICONS.law, c: C.laws },
  { n: N.library, label: 'منبع پژوهشی', sub: 'کتاب‌شناسی کامل', icon: ICONS.book, c: C.library },
];

export const Iran: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const iranP = spring({ frame: f - 56, fps, config: { damping: 10, mass: 0.7 } });
  const pulse = ((f % 50) / 50);
  return (
    <Scene>
      <DotMap width={MAP_WIDTH} reveal={1} dotOpacity={0.24} style={{ position: 'absolute', left: MAP_LEFT, top: MAP_TOP }}>
        {(xy, s) => {
          const [ix, iy] = xy(IRAN[0], IRAN[1]);
          return (
            <>
              <svg viewBox="0 0 1000 441" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
                {ARCS.map((a) => {
                  const p = interpolate(f, [a.at, a.at + 34], [0, 1], clamp);
                  if (p <= 0) return null;
                  return (
                    <path key={a.country.name} d={a.d} fill="none" stroke={a.color} strokeOpacity={0.55} strokeWidth={1.3}
                      strokeLinecap="round" strokeDasharray={`${a.len} ${a.len}`} strokeDashoffset={a.len * (1 - p)} />
                  );
                })}
              </svg>
              {/* ذره‌های روان روی کمان‌ها در لایه‌ای جدا، تا کمان‌های ثابت هر فریم دوباره نقاشی نشوند */}
              <svg viewBox="0 0 1000 441" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', willChange: 'transform' }}>
                {ARCS.map((a) => {
                  if (f < a.at + 34) return null;
                  const t = ((f - a.at - 34) % 46) / 46;
                  const pt = quad(a.a, a.ctrl, a.b, t);
                  return <circle key={a.country.name} cx={pt[0]} cy={pt[1]} r={2.1} fill="#fff" opacity={Math.sin(t * Math.PI)} />;
                })}
              </svg>
              {COUNTRIES.map((c, i) => {
                const [x, y] = xy(c.x, c.y);
                return <Pin key={c.name} x={x} y={y} country={c} at={2 + i * 1.5} scale={0.62 * (s / 1.44)} dim={0.9} />;
              })}
              <div style={{ position: 'absolute', left: ix, top: iy }}>
                {[0, 0.33, 0.66].map((o) => {
                  const q = (pulse + o) % 1;
                  return (
                    <div key={o} style={{
                      position: 'absolute', left: -70, top: -70, width: 140, height: 140, borderRadius: '50%',
                      border: `2px solid ${alpha(C.rose, 0.9)}`, transform: `scale(${0.2 + q})`, opacity: (1 - q) * iranP,
                    }} />
                  );
                })}
                <div style={{
                  position: 'absolute', left: -15, top: -15, width: 30, height: 30, borderRadius: '50%',
                  background: 'radial-gradient(circle, #fff 30%, #FB7185 70%)', transform: `scale(${iranP})`,
                  boxShadow: `0 0 40px 10px ${alpha(C.pink, 0.8)}`,
                }} />
                <div style={{
                  position: 'absolute', top: 30, left: 0, transform: `translateX(-50%) translateY(${(1 - iranP) * 14}px)`,
                  fontSize: 40, fontWeight: 900, opacity: Math.min(1, iranP), textShadow: '0 4px 18px rgba(0,0,0,.9)',
                }}>
                  ایران
                </div>
              </div>
            </>
          );
        }}
      </DotMap>
      <div style={{ position: 'absolute', top: 62, right: 150 }}>
        <Kicker text="فراتر از مطالعات موردی" delay={0} />
        <div style={{ fontSize: 96, fontWeight: 900, lineHeight: 1.3, marginTop: 8 }}>
          <Words segs={['از تجربه‌ی جهانی،', { t: 'تا ایران', grad: 'linear-gradient(97deg,#FBBF24,#FB7185 60%,#E11D62)', mark: true }]} delay={6} stagger={5} />
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 46, right: 150, left: 150, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 26 }}>
        {CARDS.map((k, i) => {
          const at = 112 + i * 9;
          const p = spring({ frame: f - at, fps, config: { damping: 15, mass: 0.7 } });
          return (
            <div key={k.label} style={{
              display: 'flex', alignItems: 'center', gap: 20, padding: '22px 26px', borderRadius: 30,
              background: 'linear-gradient(160deg, rgba(14,18,40,.92), rgba(10,13,30,.82))',
              border: `1.5px solid ${alpha(k.c[1], 0.35)}`, boxShadow: `0 30px 70px -30px ${alpha(k.c[0], 0.8)}`,
              opacity: Math.min(1, p * 1.3), transform: `translate3d(${(1 - p) * 70}px, ${(1 - p) * 30}px, 0)`,
            }}>
              <div style={{ width: 76, height: 76, borderRadius: 22, flex: 'none', display: 'grid', placeItems: 'center', background: alpha(k.c[0], 0.35) }}>
                <Icon d={k.icon} size={40} color={k.c[1]} stroke={2} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, whiteSpace: 'nowrap' }}>
                  <span style={{ fontSize: 74, fontWeight: 900, lineHeight: 1.1 }}>
                    <CountUp to={k.n} start={at + 2} dur={36} />
                  </span>
                  <span style={{ fontSize: 31, fontWeight: 800 }}>{k.label}</span>
                </div>
                <div style={{ fontSize: 25, fontWeight: 400, color: 'rgba(255,255,255,.6)', whiteSpace: 'nowrap' }}>{k.sub}</div>
              </div>
            </div>
          );
        })}
      </div>
    </Scene>
  );
};
