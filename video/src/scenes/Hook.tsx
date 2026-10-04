import React from 'react';
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from 'remotion';
import { Words } from '../components/Words';
import { DataField, Scene, clamp } from '../components/ui';

// «سال‌ها از وعده‌های داده‌ی باز گفته شد… داده‌ی باز واقعاً چه چیزی را تغییر داد؟»
export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const firstOut = interpolate(f, [86, 106], [0, 1], clamp);
  const push = interpolate(f, [0, 200], [1, 1.06]);
  return (
    <Scene>
      <DataField opacity={interpolate(f, [0, 30, 150, 200], [0, 1, 0.65, 0.4], clamp)} />
      <AbsoluteFill style={{ transform: `scale(${push})` }}>
        <Sequence durationInFrames={108}>
          <AbsoluteFill
            style={{
              alignItems: 'center', justifyContent: 'center', textAlign: 'center',
              opacity: 1 - firstOut, transform: `translateY(${-60 * firstOut}px)`,
              filter: firstOut ? `blur(${firstOut * 10}px)` : undefined,
            }}
          >
            <div style={{ fontSize: 66, fontWeight: 300, color: 'rgba(255,255,255,.84)', lineHeight: 1.5 }}>
              <Words segs="سال‌ها از وعده‌های داده‌ی باز گفته شد." delay={10} stagger={4} />
            </div>
            <div style={{ fontSize: 66, fontWeight: 700, marginTop: 14, lineHeight: 1.5 }}>
              <Words segs="اما در عمل…" delay={48} stagger={7} />
            </div>
          </AbsoluteFill>
        </Sequence>
        <Sequence from={98}>
          <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ fontSize: 150, fontWeight: 900, lineHeight: 1.34 }}>
              <div>
                <Words segs="داده‌ی باز واقعاً" delay={0} stagger={5} rise={70} />
              </div>
              <div>
                <Words
                  segs={[{ t: 'چه چیزی', grad: true, mark: true }, 'را تغییر داد؟']}
                  delay={14}
                  stagger={7}
                  rise={70}
                />
              </div>
            </div>
          </AbsoluteFill>
        </Sequence>
      </AbsoluteFill>
    </Scene>
  );
};
