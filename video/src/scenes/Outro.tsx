import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Words } from '../components/Words';
import { ICONS, Icon, Mark, Scene, clamp } from '../components/ui';
import { BRAND_GRADIENT } from '../theme';

export const Outro: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const m = spring({ frame: f - 4, fps, config: { damping: 12, mass: 0.8 } });
  const cta = spring({ frame: f - 52, fps, config: { damping: 14, mass: 0.7 } });
  // پایان ویدئو به همان پس‌زمینه‌ی آغاز محو می‌شود تا حلقه‌ی پخش بی‌درز باشد
  const out = interpolate(f, [150, 186], [1, 0], clamp);
  const sheen = interpolate(f, [60, 110], [-160, 620], clamp);
  return (
    <Scene>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center', opacity: out }}>
        <div style={{ transform: `scale(${0.4 + 0.6 * m})`, opacity: Math.min(1, m * 1.5) }}>
          <Mark size={128} />
        </div>
        <div style={{ fontSize: 150, fontWeight: 900, lineHeight: 1.3, marginTop: 34 }}>
          <Words segs={['تأثیر', { t: 'داده‌ی باز', grad: true }]} delay={10} stagger={6} rise={50} />
        </div>
        <div style={{ fontSize: 46, fontWeight: 300, color: 'rgba(255,255,255,.84)', marginTop: 10 }}>
          <Words segs="سی‌وهفت روایت از این‌که داده‌ی باز واقعاً چه چیزی را تغییر داد" delay={26} stagger={2} rise={18} />
        </div>
        <div
          style={{
            position: 'relative', overflow: 'hidden', marginTop: 56, display: 'inline-flex', alignItems: 'center', gap: 18,
            padding: '24px 46px', borderRadius: 999, background: '#fff', color: '#0C1024', fontSize: 40, fontWeight: 800,
            boxShadow: '0 30px 80px -24px rgba(167,139,250,.75)',
            opacity: cta, transform: `translateY(${(1 - cta) * 40}px) scale(${0.9 + 0.1 * cta})`,
          }}
        >
          <span
            style={{
              position: 'absolute', top: 0, bottom: 0, width: 140, left: 0, transform: `translateX(${sheen}px)`,
              background: 'linear-gradient(100deg, transparent, rgba(167,139,250,.35), transparent)',
            }}
          />
          همه‌ی روایت‌ها را بخوانید
          <Icon d={ICONS.arrowLeft} size={40} color="#0C1024" stroke={2.4} />
        </div>
        <div style={{ position: 'absolute', bottom: 70, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 400, color: 'rgba(255,255,255,.55)', opacity: interpolate(f, [70, 90], [0, 1], clamp) }}>
            روایت فارسی پروژه‌ی <span dir="ltr" style={{ unicodeBidi: 'isolate' }}>Open Data’s Impact</span> · گاورلب دانشگاه نیویورک
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 6, backgroundImage: BRAND_GRADIENT, transformOrigin: 'right center', transform: `scaleX(${interpolate(f, [0, 150], [0, 1], clamp)})`, opacity: 0.85 }} />
      </AbsoluteFill>
    </Scene>
  );
};
