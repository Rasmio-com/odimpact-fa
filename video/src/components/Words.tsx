import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { BRAND_GRADIENT } from '../theme';

/**
 * نمایش واژه‌به‌واژه برای متن فارسی.
 *
 * حروف فارسی به هم می‌چسبند؛ اگر متن حرف‌به‌حرف تکه شود، شکل اتصالی حروف
 * می‌شکند. برای همین واحد انیمیشن «واژه» است (جداشده با فاصله؛ نیم‌فاصله
 * درون واژه می‌ماند) و ترتیب ظاهرشدن همان ترتیب خواندن است، یعنی از راست.
 */
export type Seg =
  | string
  | {
      t: string;
      /** گرادیان رنگی برند روی همین تکه */
      grad?: boolean | string;
      color?: string;
      weight?: number;
      /** متن لاتین؛ جهتش جدا می‌شود تا در جمله‌ی راست‌به‌چپ جابه‌جا نشود */
      ltr?: boolean;
      /** خط تأکید زیر تکه که از راست به چپ کشیده می‌شود */
      mark?: boolean;
    };

type Unit = Exclude<Seg, string>;

const toUnits = (segs: Seg[] | string): Unit[] =>
  (typeof segs === 'string' ? [segs] : segs).flatMap((s) =>
    typeof s === 'string'
      ? s.split(/\s+/).filter(Boolean).map((t) => ({ t }))
      : [s],
  );

export const Words: React.FC<{
  segs: Seg[] | string;
  delay?: number;
  stagger?: number;
  /** فاصله‌ی عمودی شروع (پیکسل) */
  rise?: number;
  /** جابه‌جایی افقی شروع؛ مثبت یعنی از سمت راست می‌آید (جهت خواندن) */
  shift?: number;
  blur?: number;
  style?: React.CSSProperties;
}> = ({ segs, delay = 0, stagger = 4, rise = 34, shift = 18, blur = 10, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const units = toUnits(segs);
  return (
    <span style={style}>
      {units.map((u, i) => {
        const p = spring({
          frame: frame - delay - i * stagger,
          fps,
          config: { damping: 200, mass: 0.7 },
        });
        const grad = u.grad ? (typeof u.grad === 'string' ? u.grad : BRAND_GRADIENT) : null;
        const inner: React.CSSProperties = grad
          ? {
              backgroundImage: grad,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              // پس‌زمینه‌ی گرادیان باید نقطه‌ها و دنباله‌های بلند حروف را هم بپوشاند
              padding: '0.14em 0.04em',
              margin: '-0.14em -0.04em',
            }
          : {};
        const markP = u.mark
          ? spring({ frame: frame - delay - i * stagger - 10, fps, config: { damping: 200 } })
          : 0;
        return (
          <React.Fragment key={i}>
            <span
              dir={u.ltr ? 'ltr' : undefined}
              style={{
                display: 'inline-block',
                position: 'relative',
                whiteSpace: 'pre',
                unicodeBidi: u.ltr ? 'isolate' : undefined,
                opacity: Math.min(1, p * 1.25),
                transform: `translate3d(${(1 - p) * shift}px, ${(1 - p) * rise}px, 0)`,
                filter: blur && p < 0.995 ? `blur(${(1 - p) * blur}px)` : undefined,
                color: u.color,
                fontWeight: u.weight,
              }}
            >
              <span style={{ display: 'inline-block', ...inner }}>{u.t}</span>
              {u.mark ? (
                <span
                  style={{
                    position: 'absolute',
                    right: 0,
                    left: 0,
                    bottom: '-0.07em',
                    height: '0.065em',
                    borderRadius: 99,
                    backgroundImage: grad ?? BRAND_GRADIENT,
                    transformOrigin: 'right center',
                    transform: `scaleX(${markP})`,
                    opacity: 0.9,
                  }}
                />
              ) : null}
            </span>
            {i < units.length - 1 ? ' ' : null}
          </React.Fragment>
        );
      })}
    </span>
  );
};
