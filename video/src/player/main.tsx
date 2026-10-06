// پلیر ویدئوی معرفی در صفحه‌ی اول سایت.
//
// خود ویدئو با Remotion Player همین‌جا در مرورگر ساخته می‌شود (نه فایل MP4)،
// پس متن‌ها با قلم واقعی صفحه و در هر اندازه‌ای تیز هستند. کنترل‌ها اختصاصی‌اند:
// نوار زمان فصل‌بندی‌شده از راست به چپ پر می‌شود، زمان با رقم فارسی است و
// ← فصل بعد / → فصل قبل (هم‌جهت با نوار راست‌به‌چپ).
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Player, type PlayerRef } from '@remotion/player';
import { Showreel } from '../Showreel';
import { CHAPTERS, DURATION } from '../timeline';
import { FPS, HEIGHT, WIDTH, fa } from '../theme';

const clock = (frame: number) => {
  const s = Math.floor(frame / FPS);
  return fa(`${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);
};

const chapterAt = (frame: number) => {
  let i = 0;
  CHAPTERS.forEach((c, k) => {
    if (frame >= c.start) i = k;
  });
  return i;
};

const reducedMotion = () => {
  try {
    return matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

const I = {
  play: <path d="M8 5.5v13a1 1 0 001.5.86l11-6.5a1 1 0 000-1.72l-11-6.5A1 1 0 008 5.5z" fill="currentColor" stroke="none" />,
  pause: <path d="M7 5h3.2v14H7zM13.8 5H17v14h-3.2z" fill="currentColor" stroke="none" />,
  expand: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
  shrink: <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />,
};
const Svg: React.FC<{ children: React.ReactNode; size?: number }> = ({ children, size = 20 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2}
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

/** نوار کنترل؛ جدا از پلیر تا به‌روزرسانی هر فریم فقط همین بخش را دوباره رندر کند */
const Bar: React.FC<{
  player: React.RefObject<PlayerRef | null>;
  playing: boolean;
  fullscreen: boolean;
  onToggle: () => void;
  onFullscreen: () => void;
  onJump: (frame: number, play?: boolean) => void;
}> = ({ player, playing, fullscreen, onToggle, onFullscreen, onJump }) => {
  const [frame, setFrame] = useState(0);
  const rail = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  useEffect(() => {
    const p = player.current;
    if (!p) return;
    const on = (e: { detail: { frame: number } }) => setFrame(e.detail.frame);
    p.addEventListener('frameupdate', on);
    p.addEventListener('seeked', on);
    return () => {
      p.removeEventListener('frameupdate', on);
      p.removeEventListener('seeked', on);
    };
  }, [player]);

  // نقطه‌ی x روی نوار فصل‌ها → فریم؛ هر بخش از لبه‌ی راستش پر می‌شود
  const frameFromX = useCallback((x: number) => {
    const segs = rail.current ? Array.from(rail.current.querySelectorAll<HTMLElement>('[data-seg]')) : [];
    for (let k = 0; k < segs.length; k++) {
      const r = segs[k].getBoundingClientRect();
      const next = segs[k + 1]?.getBoundingClientRect();
      // فاصله‌ی بین دو بخش به بخش راستی تعلق دارد
      const leftEdge = next ? next.right : r.left;
      if (x >= leftEdge || k === segs.length - 1) {
        const c = CHAPTERS[k];
        const frac = Math.min(1, Math.max(0, (r.right - x) / r.width));
        return Math.min(DURATION - 1, Math.round(c.start + frac * (c.end - c.start)));
      }
    }
    return 0;
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    onJump(frameFromX(e.clientX));
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragging.current) onJump(frameFromX(e.clientX));
  };
  const onPointerUp = () => {
    dragging.current = false;
  };

  const cur = chapterAt(frame);
  return (
    <div className="reel-bar" dir="rtl">
      <button type="button" className="reel-btn reel-play" onClick={onToggle} aria-label={playing ? 'توقف' : 'پخش'}>
        <Svg>{playing ? I.pause : I.play}</Svg>
      </button>
      <div
        className="reel-rail"
        ref={rail}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="slider"
        tabIndex={-1}
        aria-label="نوار زمان ویدئو"
        aria-valuemin={0}
        aria-valuemax={Math.round(DURATION / FPS)}
        aria-valuenow={Math.round(frame / FPS)}
        aria-valuetext={`${clock(frame)} از ${clock(DURATION)} — ${CHAPTERS[cur].title}`}
      >
        {CHAPTERS.map((c, k) => {
          const p = k < cur ? 1 : k > cur ? 0 : (frame - c.start) / (c.end - c.start);
          return (
            <div key={c.id} data-seg className={`reel-seg${k === cur ? ' on' : ''}`} style={{ flexGrow: c.end - c.start }}>
              <span className="reel-track">
                <i style={{ transform: `scaleX(${Math.min(1, Math.max(0, p))})` }} />
              </span>
              <button
                type="button"
                className="reel-ch"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => onJump(c.start, true)}
                aria-label={`فصل ${fa(k + 1)}: ${c.title}`}
                aria-current={k === cur ? 'step' : undefined}
              >
                {c.title}
              </button>
            </div>
          );
        })}
      </div>
      <span className="reel-time" aria-hidden="true">
        <span className="reel-now">{CHAPTERS[cur].title}</span>
        {clock(frame)} / {clock(DURATION)}
      </span>
      <button type="button" className="reel-btn" onClick={onFullscreen}
        aria-label={fullscreen ? 'خروج از تمام‌صفحه' : 'تمام‌صفحه (حالت ارائه)'}>
        <Svg>{fullscreen ? I.shrink : I.expand}</Svg>
      </button>
    </div>
  );
};

const App: React.FC<{ host: HTMLElement; poster: string | null }> = ({ host, poster }) => {
  const player = useRef<PlayerRef>(null);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [pseudo, setPseudo] = useState(false);
  const userPaused = useRef(false);

  useEffect(() => {
    const p = player.current;
    if (!p) return;
    const onPlay = () => {
      setPlaying(true);
      setStarted(true);
    };
    const onPause = () => setPlaying(false);
    p.addEventListener('play', onPlay);
    p.addEventListener('pause', onPause);
    return () => {
      p.removeEventListener('play', onPlay);
      p.removeEventListener('pause', onPause);
    };
  }, []);

  // پخش خودکار وقتی پلیر دیده می‌شود (بی‌صدا است)؛ با کاهش حرکت در سیستم، خودکار پخش نمی‌شود
  useEffect(() => {
    if (reducedMotion() || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(
      ([en]) => {
        const p = player.current;
        if (!p) return;
        const visible = en.isIntersecting && en.intersectionRatio >= 0.35;
        if (visible && !userPaused.current && !p.isPlaying()) p.play();
        else if (!visible && p.isPlaying() && !document.fullscreenElement) p.pause();
      },
      { threshold: [0, 0.35, 0.6] },
    );
    io.observe(host);
    return () => io.disconnect();
  }, [host]);

  useEffect(() => {
    const on = () => setFullscreen(document.fullscreenElement === host);
    document.addEventListener('fullscreenchange', on);
    return () => document.removeEventListener('fullscreenchange', on);
  }, [host]);

  useEffect(() => {
    host.classList.toggle('is-fs', fullscreen || pseudo);
    host.classList.toggle('is-pseudo-fs', pseudo);
    document.documentElement.classList.toggle('reel-lock', pseudo);
  }, [host, fullscreen, pseudo]);

  useEffect(() => {
    host.classList.toggle('is-playing', playing);
  }, [host, playing]);

  // در حالت تمام‌صفحه، کنترل‌ها پس از چند ثانیه بی‌حرکتی پنهان می‌شوند
  useEffect(() => {
    if (!(fullscreen || pseudo)) {
      host.removeAttribute('data-idle');
      return;
    }
    let t = 0;
    const wake = () => {
      host.removeAttribute('data-idle');
      clearTimeout(t);
      t = window.setTimeout(() => {
        if (player.current?.isPlaying()) host.setAttribute('data-idle', '');
      }, 2600);
    };
    wake();
    host.addEventListener('pointermove', wake);
    host.addEventListener('keydown', wake);
    return () => {
      clearTimeout(t);
      host.removeEventListener('pointermove', wake);
      host.removeEventListener('keydown', wake);
    };
  }, [host, fullscreen, pseudo]);

  const toggle = useCallback(() => {
    const p = player.current;
    if (!p) return;
    if (p.isPlaying()) {
      userPaused.current = true;
      p.pause();
    } else {
      userPaused.current = false;
      p.play();
    }
  }, []);

  const jump = useCallback((frame: number, play = false) => {
    const p = player.current;
    if (!p) return;
    p.seekTo(frame);
    if (play && !p.isPlaying()) {
      userPaused.current = false;
      p.play();
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
      return;
    }
    if (pseudo) {
      setPseudo(false);
      return;
    }
    if (host.requestFullscreen) {
      host.requestFullscreen().catch(() => setPseudo(true));
    } else {
      setPseudo(true); // آیفون: تمام‌صفحه‌ی غیرویدئویی ندارد
    }
    host.focus({ preventScroll: true });
  }, [host, pseudo]);

  // دکمه‌ی «تماشا در حالت ارائه» بیرون از پلیر: از ابتدا، تمام‌صفحه
  useEffect(() => {
    const onPresent = () => {
      userPaused.current = false;
      player.current?.seekTo(0);
      player.current?.play();
      if (document.fullscreenElement !== host) toggleFullscreen();
    };
    host.addEventListener('reel:present', onPresent);
    return () => host.removeEventListener('reel:present', onPresent);
  }, [host, toggleFullscreen]);

  // میان‌برها وقتی تمرکز روی پلیر است یا در تمام‌صفحه
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const inside = host.contains(document.activeElement) || document.fullscreenElement === host || pseudo;
      if (!inside || e.altKey || e.ctrlKey || e.metaKey) return;
      const p = player.current;
      if (!p) return;
      const f = p.getCurrentFrame();
      const cur = chapterAt(f);
      // e.code به چیدمان صفحه‌کلید وابسته نیست؛ با صفحه‌کلید فارسی هم F و K و ارقام کار می‌کنند
      const code = e.code;
      const digit = /^(Digit|Numpad)([1-9])$/.exec(code);
      if (code === 'Space' || code === 'KeyK') {
        if ((e.target as HTMLElement)?.tagName === 'BUTTON' && code === 'Space') return;
        toggle();
      } else if (code === 'ArrowLeft' || code === 'PageDown') {
        jump(CHAPTERS[Math.min(CHAPTERS.length - 1, cur + 1)].start, true);
      } else if (code === 'ArrowRight' || code === 'PageUp') {
        const back = f - CHAPTERS[cur].start > FPS * 1.5 ? cur : Math.max(0, cur - 1);
        jump(CHAPTERS[back].start, true);
      } else if (code === 'KeyF') {
        toggleFullscreen();
      } else if (code === 'Home') {
        jump(0, true);
      } else if (code === 'Escape' && pseudo) {
        setPseudo(false);
      } else if (digit) {
        jump(CHAPTERS[+digit[2] - 1].start, true);
      } else {
        return;
      }
      e.preventDefault();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [host, pseudo, toggle, jump, toggleFullscreen]);

  return (
    <>
      <div className="reel-frame" onClick={toggle} onDoubleClick={toggleFullscreen} dir="ltr">
        <Player
          ref={player}
          component={Showreel}
          durationInFrames={DURATION}
          fps={FPS}
          compositionWidth={WIDTH}
          compositionHeight={HEIGHT}
          style={{ width: '100%', height: '100%' }}
          controls={false}
          clickToPlay={false}
          doubleClickToFullscreen={false}
          spaceKeyToPlayOrPause={false}
          loop
          initiallyMuted
        />
        {poster && !started ? <img className="reel-poster" src={poster} alt="" aria-hidden="true" /> : null}
        {!playing ? (
          <span className="reel-bigplay" aria-hidden="true">
            <Svg size={22}>{I.play}</Svg>
            <span>{started ? 'ادامه‌ی پخش' : 'پخش ویدئو'}</span>
          </span>
        ) : null}
      </div>
      <Bar
        player={player}
        playing={playing}
        fullscreen={fullscreen || pseudo}
        onToggle={toggle}
        onFullscreen={toggleFullscreen}
        onJump={jump}
      />
    </>
  );
};

const mount = () => {
  document.querySelectorAll<HTMLElement>('[data-reel]').forEach((host) => {
    if (host.dataset.mounted) return;
    host.dataset.mounted = '1';
    const poster = host.querySelector<HTMLImageElement>('img')?.getAttribute('src') ?? null;
    host.tabIndex = -1;
    const start = () => createRoot(host).render(<App host={host} poster={poster} />);
    // پیش از اولین فریم، قلم‌های درشت را بار می‌کنیم تا متن ویدئو با قلم جایگزین دیده نشود
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (fonts?.load) {
      Promise.race([
        Promise.all(['300', '400', '700', '800', '900'].map((w) => fonts.load(`${w} 40px "Yekan Bakh"`, 'فا'))),
        new Promise((r) => setTimeout(r, 2500)),
      ]).then(start, start);
    } else start();
  });
};

// پیوند «حالت ارائه»؛ بی‌جاوااسکریپت فقط تا پلیر پایین می‌رود
document.addEventListener('click', (e) => {
  const a = (e.target as Element | null)?.closest?.('[data-reel-present]');
  const host = document.querySelector<HTMLElement>('[data-reel][data-mounted]');
  if (!a || !host) return;
  e.preventDefault();
  host.scrollIntoView({ block: 'center' });
  host.dispatchEvent(new CustomEvent('reel:present'));
});

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
else mount();
