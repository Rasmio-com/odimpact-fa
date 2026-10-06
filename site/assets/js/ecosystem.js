/* زیست‌بوم داده‌ی باز ایران: فیلتر، نقشه، تولتیپ و کشوی جزئیات.
   صفحه بدون جاوااسکریپت هم کامل دیده می‌شود؛ این فایل فقط تعامل اضافه می‌کند. */
(function () {
  'use strict';
  var dataEl = document.getElementById('eco-data');
  var DATA = null, BY = {};
  try { DATA = dataEl && JSON.parse(dataEl.textContent); } catch (e) {}
  if (DATA) DATA.entries.forEach(function (x) { BY[x.id] = x; });

  function fa2en(s) {
    return String(s).replace(/[۰-۹]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d); })
      .replace(/[٠-٩]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'.indexOf(d); })
      .replace(/ي/g, 'ی').replace(/ى/g, 'ی').replace(/ك/g, 'ک').replace(/‌/g, ' ');
  }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || document).querySelectorAll(s)); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ── تولتیپ روی نقطه‌های نقشه (صفحه‌ی اول و صفحه‌ی زیست‌بوم) ── */
  var maps = $$('.eco-map');
  if (maps.length && DATA) {
    var tip = document.createElement('div');
    tip.className = 'eco-tip'; tip.hidden = true; tip.setAttribute('role', 'tooltip');
    document.body.appendChild(tip);
    var showTip = function (el) {
      var x = BY[el.getAttribute('data-id')]; if (!x) return;
      var st = DATA.meta.statuses[x.status], sec = DATA.meta.sectors[x.sector_type];
      tip.innerHTML = '<b>' + esc(x.name_fa) + '</b><span>' + esc(DATA.short[x.category]) + ' · ' + esc(sec.title) +
        '</span><span class="st" style="--st:' + st.accent + '"><i></i>' + esc(st.title) + (x.api_available ? ' · API' : '') + '</span>';
      tip.hidden = false;
      var r = (el.querySelector('.dt') || el).getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
      var left = Math.min(innerWidth - w - 8, Math.max(8, r.left + r.width / 2 - w / 2));
      var top = r.top - h - 10; if (top < 8) top = r.bottom + 10;
      tip.style.left = left + 'px'; tip.style.top = top + 'px';
    };
    var hideTip = function () { tip.hidden = true; };
    maps.forEach(function (m) {
      $$('.nd, .hub', m).forEach(function (n) {
        n.addEventListener('pointerenter', function () { showTip(n); });
        n.addEventListener('pointerleave', hideTip);
        n.addEventListener('focus', function () { showTip(n); });
        n.addEventListener('blur', hideTip);
      });
    });
    addEventListener('scroll', hideTip, { passive: true });
  }

  var bar = $('[data-eco-bar]');
  if (!bar || !DATA) return;

  /* ── فیلترها ── */
  var S = { q: '', cat: '', sector: '', acc: '', api: false, act: false, unv: false, v: 'grid' };
  var qIn = $('[data-eco-q]'), selS = $('[data-eco-sector]'), selA = $('[data-eco-acc]');
  var cbApi = $('[data-eco-api]'), cbAct = $('[data-eco-act]'), cbUnv = $('[data-eco-unv]');
  var chips = $$('[data-eco-cat]'), vBtns = $$('[data-eco-v]');
  var cards = $$('.ecard'), rows = $$('.eco-table tbody tr'), dots = $$('.eco-map .nd'), wedges = $$('.eco-map .wd');
  var groups = $$('.eco-grp'), links = $$('.eco-map .lk');
  var grid = $('[data-eco-grid]'), table = $('[data-eco-table]'), empty = $('[data-eco-empty]');
  var nEl = $('[data-eco-n]'), resetBtn = $('[data-eco-reset]');
  var FA = '۰۱۲۳۴۵۶۷۸۹';
  function faN(n) { return String(n).replace(/\d/g, function (d) { return FA[d]; }); }

  function match(el) {
    var d = el.dataset;
    if (S.cat && d.c !== S.cat) return false;
    if (S.sector && d.s !== S.sector) return false;
    if (S.acc && (' ' + d.acc + ' ').indexOf(' ' + S.acc + ' ') < 0) return false;
    if (S.api && d.api !== '1') return false;
    if (S.act && d.st !== 'active') return false;
    if (S.unv && d.st === 'unverified') return false;
    if (S.q && fa2en(d.k).indexOf(S.q) < 0) return false;
    return true;
  }

  function readURL() {
    var p = new URLSearchParams(location.search);
    S.q = p.get('q') || ''; S.cat = p.get('cat') || ''; S.sector = p.get('sector') || ''; S.acc = p.get('acc') || '';
    S.api = p.get('api') === '1'; S.act = p.get('act') === '1'; S.unv = p.get('unv') === '1';
    S.v = p.get('v') === 'table' ? 'table' : 'grid';
    qIn.value = S.q; selS.value = S.sector; selA.value = S.acc;
    cbApi.checked = S.api; cbAct.checked = S.act; cbUnv.checked = S.unv;
  }
  function writeURL() {
    var p = new URLSearchParams();
    if (S.q) p.set('q', S.q); if (S.cat) p.set('cat', S.cat); if (S.sector) p.set('sector', S.sector);
    if (S.acc) p.set('acc', S.acc); if (S.api) p.set('api', '1'); if (S.act) p.set('act', '1');
    if (S.unv) p.set('unv', '1'); if (S.v === 'table') p.set('v', 'table');
    var s = p.toString();
    try { history.replaceState(null, '', location.pathname + (s ? '?' + s : '') + location.hash); } catch (e) {}
  }

  function apply() {
    var ok = {}, n = 0;
    cards.forEach(function (c) { var m = match(c); c.hidden = !m; if (m) { n++; ok[c.dataset.id] = 1; } });
    rows.forEach(function (r) { r.hidden = !ok[r.dataset.id]; });
    dots.forEach(function (d) { d.classList.toggle('dim', !ok[d.dataset.id]); });
    links.forEach(function (l) { l.classList.toggle('dim', !ok[l.getAttribute('data-to')]); });
    wedges.forEach(function (w) { w.classList.toggle('on', !!S.cat && w.dataset.c === S.cat); });
    groups.forEach(function (g) { g.hidden = !g.querySelector('.ecard:not([hidden])'); });
    chips.forEach(function (c) { c.classList.toggle('on', c.dataset.ecoCat === S.cat); });
    vBtns.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.ecoV === S.v ? 'true' : 'false'); });
    grid.hidden = S.v === 'table'; table.hidden = S.v !== 'table';
    empty.hidden = n > 0;
    nEl.textContent = faN(n);
    resetBtn.hidden = !(S.q || S.cat || S.sector || S.acc || S.api || S.act || S.unv);
    writeURL();
  }

  var tm;
  qIn.addEventListener('input', function () {
    clearTimeout(tm);
    tm = setTimeout(function () { S.q = fa2en(qIn.value.trim().toLowerCase()); apply(); }, 120);
  });
  selS.addEventListener('change', function () { S.sector = selS.value; apply(); });
  selA.addEventListener('change', function () { S.acc = selA.value; apply(); });
  cbApi.addEventListener('change', function () { S.api = cbApi.checked; apply(); });
  cbAct.addEventListener('change', function () { S.act = cbAct.checked; apply(); });
  cbUnv.addEventListener('change', function () { S.unv = cbUnv.checked; apply(); });
  chips.forEach(function (c) { c.addEventListener('click', function () { S.cat = c.dataset.ecoCat; apply(); }); });
  vBtns.forEach(function (b) { b.addEventListener('click', function () { S.v = b.dataset.ecoV; apply(); }); });
  resetBtn.addEventListener('click', function () {
    S = { q: '', cat: '', sector: '', acc: '', api: false, act: false, unv: false, v: S.v };
    qIn.value = ''; selS.value = ''; selA.value = ''; cbApi.checked = cbAct.checked = cbUnv.checked = false; apply();
  });
  /* برچسب دسته‌ها روی نقشه: فیلتر را اعمال می‌کند و به فهرست می‌رود */
  $$('[data-cat-link]').forEach(function (a) {
    a.addEventListener('click', function (ev) {
      ev.preventDefault(); S.cat = S.cat === a.dataset.catLink ? '' : a.dataset.catLink; apply();
      $('#catalog').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
  $$('.wd').forEach(function (w) {
    w.addEventListener('click', function () { S.cat = S.cat === w.dataset.c ? '' : w.dataset.c; apply(); });
  });

  /* ── کشوی جزئیات ── */
  var dr = $('[data-eco-drawer]'), ov = $('[data-eco-ov]'), body = $('[data-eco-dr]'), lastFocus = null;
  function li(items) { return items.length ? items.map(function (i) { return '<li>' + i + '</li>'; }).join('') : '<li>—</li>'; }
  function fact(k, v) { return '<div><dt>' + k + '</dt><dd>' + v + '</dd></div>'; }
  function render(x) {
    var M = DATA.meta, st = M.statuses[x.status], sec = M.sectors[x.sector_type], cat = M.categories[x.category];
    var acc = x.access_methods.map(function (a) { return esc(M.access[a].title); }).join('، ');
    var by = DATA.entries.filter(function (y) { return (y.uses || []).indexOf(x.id) > -1; });
    var uses = (x.uses || []).map(function (u) { return BY[u]; }).filter(Boolean);
    var h = '<div class="dr-top"><span class="ec-cat" style="--c1:' + cat.accent + '">' + esc(DATA.short[x.category]) + '</span>' +
      '<span class="ec-st" style="--st:' + st.accent + '"><i></i>' + esc(st.title) + '</span></div>' +
      '<h2 id="eco-dr-t">' + esc(x.name_fa) + '</h2>' +
      (x.name_en && x.name_en !== x.name_fa ? '<p class="ec-en eng">' + esc(x.name_en) + '</p>' : '') +
      '<p class="dr-d">' + esc(x.description_fa) + '</p>';
    if (x.status === 'unverified') h += '<p class="ec-warn">این مورد فقط از فهرست‌های ثانویه شناخته شده و آزمون مستقیم نشده است. ممکن است از خارج ایران در دسترس نباشد.</p>';
    h += '<dl class="dr-facts">' +
      fact('بخش', esc(sec.title)) + fact('نقش', esc({ publisher: 'منتشرکننده', intermediary: 'واسط', aggregator: 'گردآورنده', community: 'جامعه' }[x.role] || '')) +
      fact('حوزه‌ی داده', esc((x.data_domains || []).join('، ') || '—')) + fact('روش دسترسی', acc || '—') +
      fact('قالب‌ها', esc((x.formats || []).join('، ') || '—')) + fact('مجوز', esc(x.license || '—')) +
      fact('API', x.api_available ? 'دارد' : 'ندارد') + fact('آخرین بررسی', esc(x.jdate || 'بررسی نشده')) + '</dl>';
    if (uses.length) h += '<h3>رسمیو از این منبع‌ها می‌خواند</h3><ul class="dr-chips">' +
      li(uses.map(function (u) { return '<button type="button" data-open="' + u.id + '">' + esc(u.name_fa) + '</button>'; })) + '</ul>';
    if (by.length) h += '<h3>رسمیو از این منبع می‌خواند</h3><ul class="dr-chips">' +
      li(by.map(function (u) { return '<button type="button" data-open="' + u.id + '">' + esc(u.name_fa) + '</button>'; })) + '</ul>';
    h += '<div class="dr-act"><a class="btn btn-ink" href="' + esc(x.url) + '" target="_blank" rel="noopener nofollow">رفتن به سایت <span class="eng">↗</span></a>' +
      (x.profile ? '<a class="btn btn-line" href="' + esc(x.profile) + '/">پروفایل کامل</a>' : '') + '</div>';
    var src = (x.source_urls || []).filter(Boolean);
    if (src.length) h += '<h3>منبع شاهد</h3><ul class="dr-src">' + li(src.map(function (u) {
      return '<a class="eng" href="' + esc(u) + '" target="_blank" rel="noopener nofollow">' + esc(u.replace(/^https?:\/\//, '')) + '</a>';
    })) + '</ul>';
    return h;
  }
  function open(id, from) {
    var x = BY[id]; if (!x) return;
    if (dr.hidden) lastFocus = from || document.activeElement;
    body.innerHTML = render(x);
    dr.hidden = false; ov.hidden = false;
    requestAnimationFrame(function () { dr.classList.add('on'); ov.classList.add('on'); });
    $('[data-eco-close]').focus();
    dots.forEach(function (d) { d.classList.toggle('sel', d.dataset.id === id); });
    try { var p = new URLSearchParams(location.search); p.set('open', id); history.replaceState(null, '', location.pathname + '?' + p + location.hash); } catch (e) {}
  }
  function close() {
    if (dr.hidden) return;
    dr.classList.remove('on'); ov.classList.remove('on');
    setTimeout(function () { dr.hidden = true; ov.hidden = true; }, 220);
    dots.forEach(function (d) { d.classList.remove('sel'); });
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    writeURL();
  }
  document.addEventListener('click', function (ev) {
    var t = ev.target.closest && ev.target.closest('[data-open]');
    if (t) { ev.preventDefault(); open(t.getAttribute('data-open'), t); return; }
    var d = ev.target.closest && ev.target.closest('.eco-map .nd');
    if (d) { ev.preventDefault(); open(d.dataset.id, d); }
    if (ev.target.closest && ev.target.closest('[data-eco-close]') || ev.target === ov) close();
  });
  $$('.eco-table tbody tr').forEach(function (r) {
    r.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); open(r.dataset.id, r); } });
  });
  document.addEventListener('keydown', function (ev) {
    if (dr.hidden) return;
    if (ev.key === 'Escape') { close(); return; }
    if (ev.key !== 'Tab') return;
    var f = $$('a[href],button:not([disabled])', dr).filter(function (e) { return e.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
    else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
  });

  /* مرتب‌سازی جدول با کلیک روی سرستون */
  $$('.eco-table thead th').forEach(function (th, i) {
    th.tabIndex = 0; th.style.cursor = 'pointer';
    var dir = 1;
    function sort() {
      var tb = $('.eco-table tbody'), rs = [].slice.call(tb.rows);
      rs.sort(function (a, b) { return dir * a.cells[i].textContent.localeCompare(b.cells[i].textContent, 'fa'); });
      rs.forEach(function (r) { tb.appendChild(r); }); dir = -dir;
    }
    th.addEventListener('click', sort);
    th.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') sort(); });
  });

  readURL();
  S.q = fa2en(S.q.toLowerCase());
  apply();
  var openId = new URLSearchParams(location.search).get('open');
  if (openId && BY[openId]) open(openId);
  if (location.hash === '#catalog' && S.cat) $('#catalog').scrollIntoView();
})();
