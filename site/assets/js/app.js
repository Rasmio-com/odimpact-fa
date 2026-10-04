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
