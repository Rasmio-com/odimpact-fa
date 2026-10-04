import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import data from '../generated/data.json';
import { COUNTRIES, DotMap, Pin } from '../components/DotMap';
import { Kicker, Scene, clamp } from '../components/ui';
import { fa } from '../theme';

export const PIN_START = 44;
export const PIN_STEP = 6;

export const MapScene: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reveal = interpolate(f, [4, 70], [0, 1], clamp);
  const shown = Math.max(0, Math.min(COUNTRIES.length, Math.floor((f - PIN_START) / PIN_STEP) + 1));
  const casesShown = COUNTRIES.slice(0, shown).reduce((s, c) => s + c.cases.length, 0);
  const legend = spring({ frame: f - 200, fps, config: { damping: 200 } });
  return (
    <Scene>
      <div style={{ position: 'absolute', inset: 0 }}>
        <DotMap width={1560} reveal={reveal} style={{ position: 'absolute', left: 180, top: 330 }}>
          {(xy, s) =>
            COUNTRIES.map((c, i) => {
              const [x, y] = xy(c.x, c.y);
              const { dir, dx, dy } = c.label;
              return (
                <Pin key={c.name} x={x} y={y} country={c} at={PIN_START + i * PIN_STEP}
                  scale={s / 1.56} label={dir as 'r' | 'l' | 't' | 'b'} dx={dx} dy={dy} />
              );
            })
          }
        </DotMap>
      </div>
      <div style={{ position: 'absolute', top: 80, right: 150 }}>
        <Kicker text="نقشه‌ی روایت‌ها" delay={0} />
        <div style={{ fontSize: 92, fontWeight: 900, lineHeight: 1.3, marginTop: 10, display: 'flex', gap: 26, alignItems: 'baseline' }}>
          <Counter n={shown} label="کشور،" />
          <Counter n={casesShown} label="روایت" grad />
        </div>
      </div>
      <div
        style={{
          position: 'absolute', bottom: 46, right: 150, display: 'flex', gap: 34, fontSize: 28, fontWeight: 600,
          color: 'rgba(255,255,255,.8)', opacity: legend, transform: `translateY(${(1 - legend) * 20}px)`,
        }}
      >
        {data.categories.map((c) => (
          <span key={c.slug} style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
            <i style={{ width: 16, height: 16, borderRadius: '50%', background: c.accent, boxShadow: `0 0 14px ${c.accent}` }} />
            {c.title}
          </span>
        ))}
      </div>
    </Scene>
  );
};

const Counter: React.FC<{ n: number; label: string; grad?: boolean }> = ({ n, label, grad }) => (
  <span style={{ display: 'inline-flex', gap: 18, alignItems: 'baseline' }}>
    <span
      style={{
        display: 'inline-block', minWidth: '1.25em', textAlign: 'center',
        ...(grad
          ? {
              backgroundImage: 'linear-gradient(97deg,#FBBF24,#FB7185)', WebkitBackgroundClip: 'text',
              backgroundClip: 'text', color: 'transparent', padding: '.12em 0', margin: '-.12em 0',
            }
          : {}),
      }}
    >
      {fa(n)}
    </span>
    <span>{label}</span>
  </span>
);
