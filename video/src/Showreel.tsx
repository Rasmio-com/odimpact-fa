import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Backdrop, Finish } from './components/ui';
import { Series, type Kind } from './components/Series';
import { SCENES, TRANSITION, type SceneId } from './timeline';
import { Hook } from './scenes/Hook';
import { Title } from './scenes/Title';
import { Numbers } from './scenes/Numbers';
import { MapScene } from './scenes/MapScene';
import { Dimensions } from './scenes/Dimensions';
import { Stories } from './scenes/Stories';
import { Rasmio } from './scenes/Rasmio';
import { Iran } from './scenes/Iran';
import { Outro } from './scenes/Outro';
import { FONT } from './theme';

const VIEW: Record<SceneId, React.FC> = {
  hook: Hook, title: Title, numbers: Numbers, map: MapScene,
  dimensions: Dimensions, stories: Stories, rasmio: Rasmio, iran: Iran, outro: Outro,
};

// گذار ورود به هر صحنه
const ENTER: Partial<Record<SceneId, Kind>> = {
  title: 'cross', numbers: 'push', map: 'cross', dimensions: 'push', stories: 'push', rasmio: 'cross', iran: 'cross', outro: 'cross',
};

/** ویدئوی معرفی؛ همه‌ی متن‌ها راست‌به‌چپ و با رقم فارسی */
export const Showreel: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill dir="rtl" style={{ direction: 'rtl', fontFamily: FONT, background: '#03040B', overflow: 'hidden' }}>
      <Backdrop frame={frame} />
      <Series
        T={TRANSITION}
        items={SCENES.map((s) => {
          const View = VIEW[s.id];
          return { key: s.id, duration: s.duration, enter: ENTER[s.id], node: <View /> };
        })}
      />
      <Finish frame={frame} />
    </AbsoluteFill>
  );
};
