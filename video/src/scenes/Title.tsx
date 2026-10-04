import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Words } from '../components/Words';
import { Mark, Scene, clamp } from '../components/ui';
import { BRAND_GRADIENT } from '../theme';

export const Title: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const m = spring({ frame: f - 2, fps, config: { damping: 12, mass: 0.8, stiffness: 110 } });
  const rule = spring({ frame: f - 30, fps, config: { damping: 200 } });
  const drift = interpolate(f, [0, 160], [0, -18]);
  return (
    <Scene>
      <AbsoluteFill
        style={{
          alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center',
          transform: `translateY(${drift}px)`,
        }}
      >
        <div style={{ position: 'relative', width: 156, height: 156 }}>
          {[0, 12, 24].map((d) => {
            const r = interpolate(f, [4 + d, 64 + d], [0, 1], clamp);
            return (
              <div
                key={d}
                style={{
                  position: 'absolute', left: 78 - 260, top: 78 - 260, width: 520, height: 520,
                  borderRadius: '50%', border: '2px solid rgba(255,255,255,.55)',
                  transform: `scale(${0.3 + r * 0.9})`, opacity: (1 - r) * 0.6,
                }}
              />
            );
          })}
          <div style={{ transform: `scale(${0.35 + 0.65 * m}) rotate(${(1 - m) * -16}deg)`, opacity: Math.min(1, m * 1.5) }}>
            <Mark size={156} />
          </div>
        </div>
        <div style={{ fontSize: 176, fontWeight: 900, lineHeight: 1.25, marginTop: 34 }}>
          <Words segs="تأثیر داده‌ی باز" delay={12} stagger={6} rise={64} />
        </div>
        <div
          style={{
            width: 560, height: 8, borderRadius: 9, backgroundImage: BRAND_GRADIENT, marginTop: 6,
            transform: `scaleX(${rule})`, opacity: rule,
          }}
        />
        <div style={{ fontSize: 48, fontWeight: 400, color: 'rgba(255,255,255,.84)', marginTop: 40 }}>
          <Words
            segs={['روایت فارسی پروژه‌ی', { t: 'Open Data’s Impact', ltr: true, weight: 600 }]}
            delay={36}
            stagger={3}
          />
        </div>
        <div style={{ fontSize: 36, fontWeight: 300, color: 'rgba(255,255,255,.6)', marginTop: 12 }}>
          <Words segs="گاورلب دانشگاه نیویورک" delay={54} stagger={3} />
        </div>
      </AbsoluteFill>
    </Scene>
  );
};
