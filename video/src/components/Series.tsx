import React from 'react';
import { AbsoluteFill, Easing, Sequence, interpolate, useCurrentFrame } from 'remotion';

/**
 * دنباله‌ی صحنه‌ها با گذارهای هم‌پوشان (جایگزین سبک TransitionSeries).
 * هر صحنه T فریم با صحنه‌ی بعدی هم‌پوشانی دارد؛ نوع گذار ورود هر صحنه
 * روی خروج صحنه‌ی قبلی هم اعمال می‌شود.
 *
 * - push: هل‌دادن راست‌به‌چپ؛ صفحه‌ی بعدی در فارسی سمت چپ است، پس از چپ می‌آید.
 * - cross: محوشدن متقابل (صحنه‌ها شفاف‌اند، پس خروجی هم محو می‌شود).
 * - slant: پرده‌ی اریب که از چپ به راست کنار می‌رود (برای صفحه‌های رنگی مات).
 */
export type Kind = 'push' | 'cross' | 'slant';
export type SeriesItem = { key: string; duration: number; enter?: Kind; node: React.ReactNode };

const ease = Easing.inOut(Easing.cubic);
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

// صحنه‌ی خروجی زودتر محو می‌شود و ورودی دیرتر می‌آید تا دو تیتر روی هم دیده نشوند
const fadeIn = (p: number, from: number) => Math.min(1, Math.max(0, (p - from) / (1 - from)));
const fadeOut = (p: number, until: number) => Math.min(1, Math.max(0, 1 - p / until));

const enterStyle = (kind: Kind, p: number): React.CSSProperties => {
  if (kind === 'push') return { transform: `translateX(${-(1 - p) * 30}%) scale(${0.965 + 0.035 * p})`, opacity: fadeIn(p, 0.3) };
  if (kind === 'cross') return { transform: `scale(${1.04 - 0.04 * p})`, opacity: fadeIn(p, 0.38) };
  const e = p * 130 - 15;
  return { clipPath: `polygon(0 0, ${e + 8}% 0, ${e - 8}% 100%, 0 100%)` };
};

const exitStyle = (kind: Kind, p: number): React.CSSProperties => {
  if (kind === 'push') return { transform: `translateX(${p * 30}%) scale(${1 - 0.035 * p})`, opacity: fadeOut(p, 0.65) };
  if (kind === 'cross') return { transform: `scale(${1 - 0.03 * p})`, opacity: fadeOut(p, 0.55) };
  return { transform: `translateX(${p * 7}%)` };
};

const Shot: React.FC<{
  duration: number; T: number; enter?: Kind; exit?: Kind; children: React.ReactNode;
}> = ({ duration, T, enter, exit, children }) => {
  const f = useCurrentFrame();
  let style: React.CSSProperties = {};
  if (enter && f < T) style = enterStyle(enter, interpolate(f, [0, T], [0, 1], { ...clamp, easing: ease }));
  else if (exit && f >= duration - T) style = exitStyle(exit, interpolate(f, [duration - T, duration], [0, 1], { ...clamp, easing: ease }));
  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};

export const Series: React.FC<{ items: SeriesItem[]; T: number }> = ({ items, T }) => {
  let from = 0;
  return (
    <>
      {items.map((it, i) => {
        const start = from;
        from += it.duration - T;
        return (
          <Sequence key={it.key} from={start} durationInFrames={it.duration} name={it.key}>
            <Shot duration={it.duration} T={T} enter={i > 0 ? it.enter ?? 'cross' : undefined}
              exit={i < items.length - 1 ? items[i + 1].enter ?? 'cross' : undefined}>
              {it.node}
            </Shot>
          </Sequence>
        );
      })}
    </>
  );
};
