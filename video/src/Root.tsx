import React, { useEffect, useState } from 'react';
import { Composition, continueRender, delayRender, staticFile } from 'remotion';
import { Showreel } from './Showreel';
import { DURATION } from './timeline';
import { FPS, HEIGHT, WIDTH } from './theme';

// در سایت، قلم را CSS خود صفحه بار می‌کند؛ این‌جا (استودیو و رندر MP4) خودمان بارش می‌کنیم.
const WEIGHTS: [number, string][] = [
  [300, 'Light'], [400, 'Regular'], [600, 'SemiBold'], [700, 'Bold'], [800, 'ExtraBold'], [900, 'Black'],
];

const WithFonts: React.FC = () => {
  const [handle] = useState(() => delayRender('بارگذاری قلم یکان بخ'));
  useEffect(() => {
    Promise.all(
      WEIGHTS.map(async ([w, name]) => {
        const face = new FontFace('Yekan Bakh', `url(${staticFile(`fonts/YekanBakh-${name}.woff2`)}) format('woff2')`, {
          weight: String(w),
        });
        document.fonts.add(await face.load());
      }),
    )
      .then(() => continueRender(handle))
      .catch((err) => {
        console.error(err);
        continueRender(handle);
      });
  }, [handle]);
  return <Showreel />;
};

export const Root: React.FC = () => (
  <Composition
    id="Showreel"
    component={WithFonts}
    durationInFrames={DURATION}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
  />
);
