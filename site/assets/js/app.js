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
