/* تأثیر داده‌ی باز — رفتارهای رابط کاربری */
(function () {
  'use strict';

  /* حالت روشن/تاریک */
  var root = document.documentElement;
  function setTheme(t) {
    root.setAttribute('data-theme', t);
    try { localStorage.setItem('odi-theme', t); } catch (e) {}
    document.querySelectorAll('[data-theme-toggle]').forEach(function (b) {
      b.setAttribute('aria-label', t === 'dark' ? 'حالت روشن' : 'حالت تاریک');
    });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-theme-toggle]');
    if (b) setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  /* منوی موبایل */
  var burger = document.querySelector('[data-burger]');
  var links = document.querySelector('.nav-links');
  if (burger && links) {
    burger.addEventListener('click', function () {
      links.classList.toggle('open');
      burger.setAttribute('aria-expanded', links.classList.contains('open'));
    });
  }

  /* سایه‌ی نوار ناوبری */
  var nav = document.querySelector('.nav');
  function onScroll() {
    if (nav) nav.classList.toggle('stuck', window.scrollY > 8);
    var bar = document.querySelector('.progress');
    if (bar) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ظاهر شدن تدریجی */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    document.querySelectorAll('.rv').forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i % 6, 5) * 55 + 'ms';
      io.observe(el);
    });
  } else {
    document.querySelectorAll('.rv').forEach(function (el) { el.classList.add('in'); });
  }

  /* فهرست مطالب فعال */
  var toc = document.querySelector('.toc');
  if (toc && 'IntersectionObserver' in window) {
    var heads = [].slice.call(document.querySelectorAll('.article h2[id]'));
    var seen = new Map();
    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (en) { seen.set(en.target.id, en.intersectionRatio > 0 && en.boundingClientRect.top < 220); });
      var active = heads.filter(function (h) { return h.getBoundingClientRect().top < 220; }).pop();
      toc.querySelectorAll('a').forEach(function (a) {
        a.classList.toggle('on', !!active && a.getAttribute('href') === '#' + active.id);
      });
    }, { rootMargin: '-100px 0px -70% 0px', threshold: [0, 1] });
    heads.forEach(function (h) { spy.observe(h); });
  }

  /* لایت‌باکس تصاویر */
  var lb = document.querySelector('.lb');
  if (lb) {
    document.addEventListener('click', function (e) {
      var img = e.target.closest('.article figure img');
      if (img) { lb.querySelector('img').src = img.currentSrc || img.src; lb.classList.add('on'); document.body.style.overflow = 'hidden'; }
      else if (e.target.closest('.lb')) { lb.classList.remove('on'); document.body.style.overflow = ''; }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lb.classList.contains('on')) { lb.classList.remove('on'); document.body.style.overflow = ''; }
    });
  }

  var reduce = false;
  try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var FA = '۰۱۲۳۴۵۶۷۸۹';
  function faNum(v, dec) {
    var s = v.toFixed(dec || 0).split('.');
    s[0] = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, '٬');
    return s.join('٫').replace(/\d/g, function (d) { return FA[d]; });
  }

  /* شمارنده‌ها: عدد نهایی در HTML هست؛ وقتی دیده شد از صفر بالا می‌رود */
  var counters = [].slice.call(document.querySelectorAll('[data-to]'));
  if (counters.length && !reduce && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        cio.unobserve(en.target);
        var el = en.target, to = parseFloat(el.dataset.to), dec = +(el.dataset.dec || 0);
        var suf = el.dataset.suffix || '', t0 = null, dur = 1400 + Math.min(900, to * 4);
        function step(t) {
          if (t0 === null) t0 = t;
          var p = Math.min(1, (t - t0) / dur), k = 1 - Math.pow(1 - p, 4);
          el.textContent = faNum(to * k, dec) + suf;
          if (p < 1) requestAnimationFrame(step);
        }
        el.textContent = faNum(0, dec) + suf;
        requestAnimationFrame(step);
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* نور زیر نشانگر روی کارت‌ها */
  document.addEventListener('pointermove', function (e) {
    var el = e.target.closest && e.target.closest('.card, [data-spot]');
    if (!el) return;
    var r = el.getBoundingClientRect();
    el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    el.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, { passive: true });

  /* پلیر ویدئو: با نزدیک‌شدن به وسط صفحه، از حالت مایل صاف می‌شود */
  var reel = document.querySelector('.reel');
  if (reel && !reduce) {
    var ticking = false;
    var tilt = function () {
      ticking = false;
      if (reel.classList.contains('is-fs')) return;
      var r = reel.getBoundingClientRect(), vh = window.innerHeight;
      var p = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.55)));
      reel.style.setProperty('--tilt', ((1 - p) * 16).toFixed(2) + 'deg');
      reel.style.setProperty('--sc', (0.93 + 0.07 * p).toFixed(4));
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(tilt); } }, { passive: true });
    window.addEventListener('resize', tilt);
    tilt();
  }

  /* سنجاق‌های نقشه: با لمس یا کلیک باز و بسته می‌شوند */
  var pins = [].slice.call(document.querySelectorAll('.pin'));
  if (pins.length) {
    var closePins = function (except) {
      pins.forEach(function (p) {
        if (p === except) return;
        p.classList.remove('open');
        p.querySelector('.pin-dot').setAttribute('aria-expanded', 'false');
      });
    };
    document.addEventListener('click', function (e) {
      var dot = e.target.closest('.pin-dot');
      if (dot) {
        var pin = dot.parentNode, open = !pin.classList.contains('open');
        closePins(pin);
        pin.classList.toggle('open', open);
        dot.setAttribute('aria-expanded', String(open));
      } else if (!e.target.closest('.pin-pop')) {
        closePins();
      }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePins(); });
  }

  /* جست‌وجو و فیلتر فهرست مطالعات */
  var list = document.querySelector('[data-list]');
  if (list) {
    var input = document.querySelector('[data-search]');
    var chips = [].slice.call(document.querySelectorAll('[data-cat]'));
    var cards = [].slice.call(list.querySelectorAll('[data-card]'));
    var empty = document.querySelector('[data-empty]');
    var counter = document.querySelector('[data-count]');
    var cat = new URLSearchParams(location.search).get('cat') || 'all';

    function fa2en(s) {
      return s.replace(/[۰-۹]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d); })
              .replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/[‌‏‎]/g, ' ');
    }
    function apply() {
      var q = fa2en((input && input.value || '').trim().toLowerCase());
      var n = 0;
      cards.forEach(function (c) {
        var okCat = cat === 'all' || c.dataset.card === cat;
        var okQ = !q || fa2en(c.dataset.k).indexOf(q) > -1;
        var show = okCat && okQ;
        c.style.display = show ? '' : 'none';
        if (show) n++;
      });
      chips.forEach(function (ch) { ch.classList.toggle('on', ch.dataset.cat === cat); });
      if (empty) empty.style.display = n ? 'none' : '';
      if (counter) counter.textContent = String(n).replace(/\d/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'[d]; });
    }
    chips.forEach(function (ch) {
      ch.addEventListener('click', function () {
        cat = ch.dataset.cat;
        var u = new URL(location.href);
        if (cat === 'all') u.searchParams.delete('cat'); else u.searchParams.set('cat', cat);
        history.replaceState(null, '', u);
        apply();
      });
    });
    if (input) input.addEventListener('input', apply);
    apply();
  }
})();

/* ایران در شاخص‌ها: پله‌ها، نمودار قیچی، موزاییک پوشش */
(function () {
  'use strict';
  var FA = '۰۱۲۳۴۵۶۷۸۹';
  function fa(v, dec) {
    return v.toFixed(dec).replace('.', '٫').replace(/\d/g, function (d) { return FA[d]; });
  }

  /* پله‌ها فیلتر نوار شاخص‌ها هستند */
  document.querySelectorAll('[data-idx-stage]').forEach(function (stage) {
    var btns = [].slice.call(stage.querySelectorAll('.st, .st-all'));
    function set(g) {
      stage.setAttribute('data-f', g);
      btns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.g === g)); });
    }
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        var cur = stage.getAttribute('data-f') || 'all';
        set(cur === b.dataset.g ? 'all' : b.dataset.g);
      });
    });
    set('all');
  });

  /* نمودار قیچی: خط راهنما، برچسب و روشن/خاموش کردن سری‌ها */
  document.querySelectorAll('[data-sx]').forEach(function (card) {
    var D = JSON.parse(card.querySelector('.sx-data').textContent);
    var plot = card.querySelector('.sx-plot'), svg = plot.querySelector('svg');
    var tip = plot.querySelector('.sx-tip'), guide = svg.querySelector('.sx-guide');
    var vbW = svg.viewBox.baseVal.width;
    var colors = {};
    card.querySelectorAll('.sx-s').forEach(function (g) { colors[g.dataset.k] = getComputedStyle(g).getPropertyValue('--c1'); });
    var off = {};
    function show(i) {
      var x = D.x[i];
      guide.setAttribute('x1', x); guide.setAttribute('x2', x);
      var rows = D.series.filter(function (s) { return !off[s.k]; })
        .slice().sort(function (a, b) { return b.v[i] - a.v[i]; })
        .map(function (s) { return '<div><i style="background:' + colors[s.k] + '"></i>' + s.n + ': <b style="display:inline">' + fa(s.v[i], 2) + '</b></div>'; }).join('');
      tip.innerHTML = '<b>' + String(D.years[i]).replace(/\d/g, function (d) { return FA[d]; }) + '</b>' + rows;
      var px = x / vbW * plot.clientWidth;
      var half = tip.offsetWidth / 2 + 4;
      tip.style.left = Math.max(half, Math.min(plot.clientWidth - half, px)) + 'px';
      plot.classList.add('hov');
    }
    svg.querySelectorAll('.sx-hit').forEach(function (r) {
      r.addEventListener('pointerenter', function () { show(+r.dataset.i); });
      r.addEventListener('pointerdown', function () { show(+r.dataset.i); });
    });
    svg.addEventListener('pointerleave', function () { plot.classList.remove('hov'); });
    card.querySelectorAll('.sx-leg').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.dataset.k, on = b.getAttribute('aria-pressed') !== 'true';
        var active = card.querySelectorAll('.sx-leg[aria-pressed="true"]').length;
        if (!on && active === 1) return;
        b.setAttribute('aria-pressed', String(on));
        off[k] = !on;
        card.querySelector('.sx-s[data-k="' + k + '"]').classList.toggle('off', !on);
      });
    });
  });

})();

/* شاخص‌ها، نسخه‌ی ۲: تولتیپ، مرتب‌سازی نوار، موزاییک با کادر جزئیات */
(function () {
  'use strict';
  var metaEl = document.getElementById('ix-meta');
  var META = {};
  try { META = metaEl ? JSON.parse(metaEl.textContent) : {}; } catch (e) {}

  /* تولتیپ: نام انگلیسی، نهاد و آخرین سال ارزیابی */
  var tip = document.createElement('div');
  tip.className = 'ixtip'; tip.setAttribute('role', 'tooltip');
  document.body.appendChild(tip);
  var cur = null;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function showTip(el) {
    var m = META[el.dataset.ix]; if (!m) return;
    cur = el;
    tip.style.setProperty('--tc', m.c);
    tip.innerHTML = '<span class="t-ab">' + esc(m.ab) + '</span><span class="t-en">' + esc(m.en) + '</span>' +
      '<span class="t-org">' + esc(m.org) + (m.oe !== m.org ? ' · <span dir="ltr">' + esc(m.oe) + '</span>' : '') + '</span>' +
      '<span class="t-y"><span>آخرین ارزیابی: <b>' + esc(m.y) + '</b></span><span class="t-s ' + m.sk + '">' + esc(m.s) + '</span></span>';
    var r = el.getBoundingClientRect();
    tip.classList.add('on');
    var w = tip.offsetWidth, h = tip.offsetHeight;
    var x = Math.min(window.innerWidth - w - 10, Math.max(10, r.left + r.width / 2 - w / 2));
    var y = r.top - h - 10; if (y < 70) y = r.bottom + 10;
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
  }
  function hideTip() { cur = null; tip.classList.remove('on'); }
  var fine = window.matchMedia && matchMedia('(hover: hover)').matches;
  document.addEventListener('pointerover', function (e) {
    if (e.pointerType === 'touch' || !fine) return;
    var el = e.target.closest && e.target.closest('[data-ix]');
    if (el && el !== cur) showTip(el); else if (!el && cur) hideTip();
  });
  document.addEventListener('focusin', function (e) { var el = e.target.closest && e.target.closest('[data-ix]'); if (el) showTip(el); });
  document.addEventListener('focusout', hideTip);
  window.addEventListener('scroll', hideTip, { passive: true });

  /* نوار جایگاه: مرتب‌سازی و فیلتر نیمه‌ی پایین */
  document.querySelectorAll('[data-idx-stage]').forEach(function (stage) {
    var strip = stage.querySelector('.strip'); if (!strip) return;
    var rows = [].slice.call(strip.querySelectorAll('.sr'));
    var sel = stage.querySelector('[data-strip-sort]'), low = stage.querySelector('[data-strip-low]');
    if (sel) sel.addEventListener('change', function () {
      var k = sel.value, s = rows.slice();
      s.sort(function (a, b) {
        if (k === 'best') return b.dataset.p - a.dataset.p;
        if (k === 'worst') return a.dataset.p - b.dataset.p;
        if (k === 'name') return a.dataset.n.localeCompare(b.dataset.n, 'fa');
        return a.dataset.o - b.dataset.o;
      });
      strip.style.opacity = '0';
      setTimeout(function () { s.forEach(function (r) { strip.appendChild(r); }); strip.style.opacity = '1'; }, 160);
    });
    if (low) low.addEventListener('click', function () {
      var on = low.getAttribute('aria-pressed') !== 'true';
      low.setAttribute('aria-pressed', String(on));
      if (on) stage.setAttribute('data-low', '1'); else stage.removeAttribute('data-low');
    });
  });

  /* موزاییک شاخص‌ها با کادر جزئیات کناری */
  document.querySelectorAll('[data-cv]').forEach(function (card) {
    var tiles = [].slice.call(card.querySelectorAll('.cv'));
    var side = card.querySelector('.cv-side');
    var panes = [].slice.call(side.querySelectorAll('.cvd'));
    var fs = 'all', fg = 'all';
    function apply() {
      tiles.forEach(function (t) {
        var ok = (fs === 'all' || t.dataset.s === fs) && (fg === 'all' || t.dataset.g === fg);
        t.classList.toggle('dim', !ok);
      });
    }
    function group(sel, attr, set) {
      var bs = [].slice.call(card.querySelectorAll(sel));
      bs.forEach(function (b) {
        b.addEventListener('click', function () {
          bs.forEach(function (x) { x.classList.toggle('on', x === b); });
          set(b.dataset[attr]); apply();
        });
      });
    }
    group('.cv-leg', 's', function (v) { fs = v; });
    group('.cv-gl', 'g', function (v) { fg = v; });
    function open(k) {
      panes.forEach(function (p) { p.hidden = p.dataset.for !== k; });
      tiles.forEach(function (t) { t.classList.toggle('on', t.dataset.k === k); });
      side.classList.toggle('open', k !== '_');
      if (k !== '_' && window.innerWidth > 980) {
        var r = side.getBoundingClientRect();
        if (r.top < 70 || r.top > window.innerHeight * .6) side.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
    tiles.forEach(function (t) {
      t.addEventListener('click', function () { hideTip(); open(t.classList.contains('on') ? '_' : t.dataset.k); });
    });
    side.addEventListener('click', function (e) { if (e.target.closest('[data-cvd-close]')) open('_'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') open('_'); });
  });
})();
