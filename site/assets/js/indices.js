/* داشبورد «ایران در شاخص‌های جهانی» — نمودارها با Chart.js */
(function () {
  'use strict';
  var FA = '۰۱۲۳۴۵۶۷۸۹';
  var fa = function (v) { if (v === null || v === undefined) return ''; return String(v).replace(/\d/g, function (d) { return FA[d]; }).replace(/\./g, '٫').replace(/-/g, '−'); };
  var css = function (n) { return getComputedStyle(document.body).getPropertyValue(n).trim(); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* زبانه‌ها */
  var tabs = [].slice.call(document.querySelectorAll('.idx-tabs button'));
  var panels = [].slice.call(document.querySelectorAll('.panel'));
  var charts = {}, B = {};
  var PANELS = { overview: [], coverage: [], compare: [], egdi: ['egdi', 'peer', 'slope', 'osi'], opendata: ['odin', 'odinEl', 'godi'],
    business: ['db', 'dbTrend', 'dbSub'], gov: ['rti', 'rtiCat', 'wjp', 'cpi', 'cpiPeer', 'fotn'], digital: ['nri', 'ai'], method: [] };
  function current() { var a = document.querySelector('.panel.active'); return a ? a.id : 'overview'; }
  function build(t) { if (window.Chart) PANELS[t].forEach(function (k) { B[k](); }); }
  function show(t, scroll) {
    if (!PANELS[t]) t = 'overview';
    tabs.forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.tab === t)); });
    panels.forEach(function (p) { p.classList.toggle('active', p.id === t); });
    var on = tabs.filter(function (b) { return b.dataset.tab === t; })[0];
    if (on) on.scrollIntoView({ block: 'nearest', inline: 'center' });
    // بلوک‌های ظاهرشونده‌ی زبانه‌ی تازه را بلافاصله نشان بده
    document.getElementById(t).querySelectorAll('.rv').forEach(function (el) { el.classList.add('in'); });
    build(t);
    if (scroll) {
      var nav = document.querySelector('.idx-tabs');
      window.scrollTo({ top: nav.getBoundingClientRect().top + window.scrollY - 72, behavior: reduce ? 'auto' : 'smooth' });
    }
  }
  tabs.forEach(function (b) {
    b.addEventListener('click', function () {
      try { history.replaceState(null, '', '#' + b.dataset.tab); } catch (e) {}
      show(b.dataset.tab, true);
    });
  });

  /* فیلتر جدول پوشش */
  var covBtns = [].slice.call(document.querySelectorAll('#covFilter button'));
  covBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      covBtns.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      var f = b.dataset.f;
      document.querySelectorAll('#covTable tbody tr').forEach(function (tr) {
        var s = tr.dataset.s;
        tr.style.display = f === 'all' || (f === 'yes' ? s === 'yes' : s !== 'yes') ? '' : 'none';
      });
    });
  });

  function seg(id, cb) {
    var bs = [].slice.call(document.querySelectorAll('#' + id + ' button'));
    bs.forEach(function (b) { b.addEventListener('click', function () { bs.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); cb(b); }); });
  }

  function base(extra) {
    var ink = css('--text'), muted = css('--muted'), line = css('--gridc');
    return Object.assign({
      responsive: true, maintainAspectRatio: false, locale: 'fa-IR',
      animation: reduce ? false : { duration: 900, easing: 'easeOutQuart' },
      interaction: { mode: 'nearest', intersect: false },
      plugins: {
        legend: { rtl: true, textDirection: 'rtl', labels: { color: ink, font: { size: 13 }, usePointStyle: true, boxWidth: 8, padding: 16 } },
        tooltip: { rtl: true, textDirection: 'rtl', backgroundColor: '#0C1024', padding: 12, cornerRadius: 12, titleFont: { weight: '800' },
          callbacks: { title: function (c) { return fa(c[0].label); }, label: function (c) { return ' ' + (c.dataset.label ? c.dataset.label + ': ' : '') + fa(c.raw); } } }
      },
      scales: {
        x: { ticks: { color: muted, callback: function (v) { return fa(this.getLabelForValue ? this.getLabelForValue(v) : v); } }, grid: { color: line }, border: { display: false } },
        y: { ticks: { color: muted, callback: function (v) { return fa(v); } }, grid: { color: line }, border: { display: false } }
      }
    }, extra || {});
  }
  function hbar(o, max, unit) {
    o.plugins.legend.display = false;
    o.scales.x.min = 0; if (max) o.scales.x.max = max;
    o.scales.x.reverse = true; o.scales.y.position = 'right';
    o.scales.x.ticks.callback = function (v) { return fa(v) + (unit || ''); };
    o.scales.y.ticks.callback = function (v) { return this.getLabelForValue(v); };
    o.scales.y.grid = { display: false };
    return o;
  }
  function mk(id, cfg) { if (charts[id]) charts[id].destroy(); charts[id] = new Chart(document.getElementById(id), cfg); }
  var CN = ['ایران', 'عربستان', 'امارات', 'ترکیه', 'گرجستان', 'تونس', 'مصر', 'پاکستان'];
  function peerColors(labels) { return labels.map(function (l) { return l === 'ایران' ? css('--iran') : l === 'میانگین جهانی' ? css('--world') : css('--peer'); }); }

  /* دولت الکترونیک */
  var Y = [2003, 2004, 2005, 2008, 2010, 2012, 2014, 2016, 2018, 2020, 2022, 2024];
  var E = {
    EGDI: [0.3296, 0.3282, 0.3813, 0.4067, 0.4234, 0.4876, 0.4508, 0.4649, 0.6083, 0.6593, 0.6433, 0.6564],
    OSI: [0.1485, 0.1622, 0.2962, 0.2575, 0.2667, 0.4902, 0.3701, 0.3333, 0.6319, 0.5882, 0.4196, 0.3773],
    TII: [0.0904, 0.0924, 0.1079, 0.1747, 0.2157, 0.2638, 0.2940, 0.3514, 0.4566, 0.6210, 0.7300, 0.8987],
    HCI: [0.75, 0.73, 0.74, 0.7923, 0.7927, 0.7089, 0.6882, 0.7101, 0.7364, 0.7686, 0.7804, 0.6932],
    EPI: [0.0345, 0.0328, 0.0317, 0.0909, 0.0714, 0.1842, 0.2941, 0.2034, 0.5281, 0.4643, 0.1818, 0.1781] };
  var ER = { EGDI: [107, 115, 98, 108, 102, 100, 105, 106, 86, 89, 91, 101], EPI: [102, 97, 105, 98, 117, 75, 110, 149, 111, 118, 167, 164] };
  var WORLD = [null, null, null, null, null, 0.4882, 0.4712, 0.4922, 0.5491, 0.5988, 0.6102, 0.6382];
  var EN = { EGDI: 'EGDI', OSI: 'خدمات آنلاین', TII: 'زیرساخت ارتباطی', HCI: 'سرمایه‌ی انسانی', EPI: 'مشارکت الکترونیک' };
  var EC = { EGDI: '--iran', OSI: '--c-data', TII: '--c-cap', HCI: '--muted', EPI: '--c-gov' };
  var egdiM = 'all', egdiV = 'score';
  B.egdi = function () {
    var ds = [], keys = egdiM === 'all' ? Object.keys(E) : [egdiM];
    if (egdiV === 'score') {
      keys.forEach(function (k) { ds.push({ label: EN[k], data: E[k], borderColor: css(EC[k]), backgroundColor: css(EC[k]), borderWidth: k === 'EGDI' ? 4 : 2.2, tension: .3, pointRadius: 3, pointHoverRadius: 6 }); });
      if (keys.indexOf('EGDI') > -1) ds.push({ label: 'میانگین جهانی EGDI', data: WORLD, borderColor: css('--world'), borderDash: [6, 5], borderWidth: 1.5, pointRadius: 2, spanGaps: true });
    } else {
      var rk = keys.filter(function (k) { return ER[k]; }); if (!rk.length) rk = ['EGDI', 'EPI'];
      rk.forEach(function (k) { ds.push({ label: 'رتبه‌ی ' + EN[k], data: ER[k], borderColor: css(EC[k]), backgroundColor: css(EC[k]), borderWidth: 3, tension: .25, pointRadius: 3 }); });
    }
    var o = base(); o.scales.y.reverse = egdiV === 'rank';
    if (egdiV === 'score') { o.scales.y.min = 0; o.scales.y.max = 1; }
    o.scales.y.title = { display: true, text: egdiV === 'rank' ? 'رتبه (بالاتر = بهتر)' : 'امتیاز (۰ تا ۱)', color: css('--muted') };
    mk('cEgdi', { type: 'line', data: { labels: Y, datasets: ds }, options: o });
  };
  seg('egdiMetric', function (b) { egdiM = b.dataset.m; B.egdi(); });
  seg('egdiMode', function (b) { egdiV = b.dataset.v; B.egdi(); });
  var PEER = { EGDI: [0.6564, 0.9602, 0.9533, 0.8913, 0.7792, 0.6935, 0.6699, 0.5096], OSI: [0.3773, 0.9899, 0.9163, 0.9225, 0.5652, 0.5951, 0.7002, 0.7042], EPI: [0.1781, 0.9589, 0.7808, 0.8630, 0.5616, 0.4521, 0.5890, 0.4932] };
  var peerM = 'EGDI', peerO = 'v';
  B.peer = function () {
    var labels = CN.slice(), data = PEER[peerM].slice();
    if (peerM === 'EGDI') { labels.push('میانگین جهانی'); data.push(0.6382); }
    var idx = data.map(function (v, i) { return i; });
    if (peerO === 'v') idx.sort(function (a, b) { return data[b] - data[a]; });
    labels = idx.map(function (i) { return labels[i]; }); data = idx.map(function (i) { return data[i]; });
    var o = hbar(base({ indexAxis: 'y' }), 1);
    mk('cPeer', { type: 'bar', data: { labels: labels, datasets: [{ label: peerM, data: data, backgroundColor: peerColors(labels), borderRadius: 6, barPercentage: .72 }] }, options: o });
  };
  seg('peerMetric', function (b) { peerM = b.dataset.p; B.peer(); });
  seg('peerSort', function (b) { peerO = b.dataset.o; B.peer(); });
  B.slope = function () {
    var S = [['ایران', 0.6433, 0.6564], ['عربستان', 0.8539, 0.9602], ['امارات', 0.9010, 0.9533], ['ترکیه', 0.7983, 0.8913], ['پاکستان', 0.4238, 0.5096], ['گرجستان', 0.7501, 0.7792], ['تونس', 0.6530, 0.6935], ['مصر', 0.5895, 0.6699], ['میانگین جهانی', 0.6102, 0.6382]];
    var ds = S.map(function (s) {
      var c = s[0] === 'ایران' ? css('--iran') : s[0] === 'میانگین جهانی' ? css('--world') : css('--peer');
      return { label: s[0], data: [s[1], s[2]], borderColor: c, backgroundColor: c, borderWidth: s[0] === 'ایران' ? 4.5 : 1.6, borderDash: s[0] === 'میانگین جهانی' ? [6, 4] : [], pointRadius: 4 };
    });
    var o = base(); o.scales.y.min = 0.4; o.scales.y.max = 1;
    mk('cSlope', { type: 'line', data: { labels: ['۲۰۲۲', '۲۰۲۴'], datasets: ds }, options: o });
  };
  B.osi = function () {
    var o = hbar(base({ indexAxis: 'y' }), 1);
    mk('cOsi', { type: 'bar', data: { labels: ['چارچوب نهادی', 'ارائه‌ی محتوا', 'ارائه‌ی خدمات', 'مشارکت الکترونیک', 'فناوری'], datasets: [{ label: 'امتیاز', data: [0.68, 0.4444, 0.4337, 0.1781, 0.4375], backgroundColor: css('--c-data'), borderRadius: 6 }] }, options: o });
  };

  /* داده‌ی باز */
  var odinV = 'score';
  B.odin = function () {
    var o = base(), L = ['۲۰۱۵', '۲۰۱۸/۱۹', '۲۰۲۰/۲۱', '۲۰۲۲/۲۳'];
    if (odinV === 'pos') {
      o.scales.y.min = 0; o.scales.y.max = 100; o.plugins.legend.display = false;
      o.scales.y.title = { display: true, text: 'جایگاه نسبی (۱۰۰ = رتبه‌ی اول)', color: css('--muted') };
      o.plugins.tooltip.callbacks.label = function (c) { var R = [[48, 125], [110, 178], [131, 187], [135, 195]][c.dataIndex]; return ' جایگاه ' + fa(c.raw) + ' · رتبه‌ی ' + fa(R[0]) + ' از ' + fa(R[1]); };
      mk('cOdin', { type: 'line', data: { labels: L, datasets: [{ label: 'جایگاه نسبی', data: [62, 38, 30, 31], borderColor: css('--warn'), backgroundColor: css('--warn'), borderWidth: 4, tension: .3, pointRadius: 5 }] }, options: o });
      return;
    }
    o.scales.y.min = 0; o.scales.y.max = 70;
    mk('cOdin', { type: 'line', data: { labels: L, datasets: [
      { label: 'امتیاز کل', data: [34.3, 38, 41, 40], borderColor: css('--iran'), backgroundColor: css('--iran'), borderWidth: 4, tension: .3 },
      { label: 'پوشش', data: [44.1, 47, 44, 42], borderColor: css('--c-cap'), backgroundColor: css('--c-cap'), borderWidth: 2, tension: .3 },
      { label: 'باز بودن', data: [25.3, 29, 38, 38], borderColor: css('--c-gov'), backgroundColor: css('--c-gov'), borderWidth: 2, tension: .3 },
      { label: 'میانه‌ی جهانی (کل)', data: [null, null, 48.9, 51.0], borderColor: css('--world'), borderDash: [6, 5], borderWidth: 1.5, spanGaps: true }] }, options: o });
  };
  seg('odinMode', function (b) { odinV = b.dataset.v; B.odin(); });
  B.odinEl = function () {
    var D = [75, 42, 21, 16, 14, 0, 0];
    var o = hbar(base({ indexAxis: 'y' }), 100);
    mk('cOdinEl', { type: 'bar', data: { labels: ['قالب غیرانحصاری', 'فراداده', 'سطح استان', 'خوانایی ماشینی', 'گزینه‌های دانلود', 'سطح شهرستان', 'شرایط استفاده (مجوز)'],
      datasets: [{ label: 'امتیاز', data: D, backgroundColor: D.map(function (v) { return v === 0 ? css('--warn') : css('--c-data'); }), borderRadius: 6, minBarLength: 4 }] }, options: o });
  };
  var godiF = 'all', godiS = 'v';
  B.godi = function () {
    var G = [['آمار ملی', 85], ['کیفیت هوا', 65], ['قوانین ملی', 50], ['بودجه‌ی دولت', 45], ['پیش‌نویس قوانین', 45], ['دفتر ثبت شرکت‌ها', 30], ['هزینه‌کرد دولت', 0], ['نتایج انتخابات', 0], ['نقشه‌ی ملی', 0], ['نشانی و کد پستی', 0], ['مرزهای اداری', 0], ['تدارکات عمومی', 0], ['کیفیت آب', 0], ['مالکیت زمین', 0], ['پیش‌بینی هوا', 0]];
    G = G.filter(function (g) { return godiF === 'all' || (godiF === 'zero' ? g[1] === 0 : g[1] > 0); });
    G.sort(godiS === 'n' ? function (a, b) { return a[0].localeCompare(b[0], 'fa'); } : function (a, b) { return b[1] - a[1]; });
    var o = hbar(base({ indexAxis: 'y' }), 100, '٪');
    mk('cGodi', { type: 'bar', data: { labels: G.map(function (g) { return g[0]; }), datasets: [{ label: 'امتیاز', data: G.map(function (g) { return g[1]; }), backgroundColor: G.map(function (g) { return g[1] === 0 ? css('--warn') : css('--c-data'); }), borderRadius: 6, minBarLength: 4 }] }, options: o });
  };
  seg('godiF', function (b) { godiF = b.dataset.f; B.godi(); });
  seg('godiS', function (b) { godiS = b.dataset.s; B.godi(); });

  /* کسب‌وکار */
  B.db = function () {
    var L = ['گرجستان', 'امارات', 'ترکیه', 'عربستان', 'تونس', 'پاکستان', 'مصر', 'ایران'];
    var o = hbar(base({ indexAxis: 'y' }), 190);
    o.scales.x.title = { display: true, text: 'رتبه از ۱۹۰ (کوتاه‌تر = بهتر)', color: css('--muted') };
    mk('cDb', { type: 'bar', data: { labels: L, datasets: [{ label: 'رتبه', data: [7, 16, 33, 62, 78, 108, 114, 127], backgroundColor: peerColors(L), borderRadius: 6 }] }, options: o });
  };
  B.dbTrend = function () {
    var o = base(); o.plugins.legend.display = false; o.scales.y.reverse = true; o.scales.y.min = 100; o.scales.y.max = 160;
    mk('cDbTrend', { type: 'line', data: { labels: ['۲۰۱۳', '۲۰۱۶', '۲۰۱۷', '۲۰۱۸', '۲۰۱۹', '۲۰۲۰'], datasets: [{ label: 'رتبه', data: [152, 117, 120, 124, 128, 127], borderColor: css('--iran'), backgroundColor: css('--iran'), borderWidth: 3.5, tension: .3 }] }, options: o });
  };
  B.dbSub = function () {
    var o = hbar(base({ indexAxis: 'y' }), 100, '٪');
    mk('cDbSub', { type: 'bar', data: { labels: ['عمق اطلاعات اعتباری (۸ از ۸)', 'میزان افشا (۷ از ۱۰)', 'اطمینان برق و شفافیت تعرفه (۵ از ۸)', 'کیفیت اداره‌ی زمین (۱۶ از ۳۰)', 'شفافیت شرکتی (۲ از ۷)', 'کیفیت فرایند قضایی (۵ از ۱۸)'],
      datasets: [{ label: 'درصد از حداکثر', data: [100, 70, 63, 53, 29, 28], backgroundColor: css('--c-cap'), borderRadius: 6 }] }, options: o });
  };

  /* حکمرانی */
  B.rti = function () {
    var o = base(); o.plugins.legend.display = false; o.scales.y.min = 0; o.scales.y.max = 150;
    mk('cRti', { type: 'line', data: { labels: ['۲۰۱۶', '۲۰۱۷', '۲۰۱۸', '۲۰۱۹', '۲۰۲۰', '۲۰۲۴'], datasets: [{ label: 'امتیاز از ۱۵۰', data: [50, 50, 69, 71, 71, 71], borderColor: css('--c-gov'), backgroundColor: css('--c-gov'), borderWidth: 3.5, stepped: true }] }, options: o });
  };
  B.rtiCat = function () {
    var S = [26, 10, 12, 10, 10, 2, 1], M = [30, 16, 30, 30, 30, 8, 6];
    var P = S.map(function (s, i) { return Math.round(s / M[i] * 100); });
    var o = hbar(base({ indexAxis: 'y' }), 100, '٪');
    o.plugins.tooltip.callbacks.label = function (c) { return ' ' + fa(S[c.dataIndex]) + ' از ' + fa(M[c.dataIndex]) + ' (' + fa(P[c.dataIndex]) + '٪)'; };
    mk('cRtiCat', { type: 'bar', data: { labels: ['دامنه‌ی شمول', 'تبلیغ و ترویج', 'تجدیدنظر', 'آیین درخواست', 'استثناها', 'ضمانت اجرا', 'حق دسترسی'], datasets: [{ data: P, backgroundColor: P.map(function (p) { return p < 20 ? css('--warn') : css('--c-gov'); }), borderRadius: 6 }] }, options: o });
  };
  B.wjp = function () {
    var L = ['عدالت مدنی', 'فقدان فساد', 'محدودیت قدرت دولت', 'دولت باز', 'حقوق بنیادین'];
    var o = hbar(base({ indexAxis: 'y' }), 143);
    mk('cWjp', { type: 'bar', data: { labels: L, datasets: [{ label: 'رتبه', data: [75, 104, 129, 140, 142], backgroundColor: L.map(function (l) { return l === 'دولت باز' ? css('--warn') : css('--c-gov'); }), borderRadius: 6 }] }, options: o });
  };
  var cpiR = 'all';
  B.cpi = function () {
    var yr = ['۲۰۱۲', '۲۰۱۳', '۲۰۱۴', '۲۰۱۵', '۲۰۱۶', '۲۰۱۷', '۲۰۱۸', '۲۰۱۹', '۲۰۲۰', '۲۰۲۱', '۲۰۲۲', '۲۰۲۳', '۲۰۲۴', '۲۰۲۵'];
    var ir = [28, 25, 27, 27, 29, 30, 28, 26, 25, 25, 25, 24, 23, 23], w = [43, 43, 43, 43, 43, 43, 43, 43, 43, 43, 43, 43, 43, 42];
    if (cpiR === '5') { yr = yr.slice(-5); ir = ir.slice(-5); w = w.slice(-5); }
    var o = base(); o.scales.y.min = 0; o.scales.y.max = 60;
    mk('cCpi', { type: 'line', data: { labels: yr, datasets: [
      { label: 'ایران', data: ir, borderColor: css('--iran'), backgroundColor: css('--iran'), borderWidth: 3.5, tension: .3 },
      { label: 'میانگین جهانی', data: w, borderColor: css('--world'), borderDash: [6, 5], borderWidth: 1.5, pointRadius: 0 }] }, options: o });
  };
  seg('cpiRange', function (b) { cpiR = b.dataset.r; B.cpi(); });
  B.cpiPeer = function () {
    var L = ['امارات', 'عربستان', 'گرجستان', 'میانگین جهانی', 'تونس', 'ترکیه', 'مصر', 'پاکستان', 'ایران'];
    var o = hbar(base({ indexAxis: 'y' }), 100);
    mk('cCpiPeer', { type: 'bar', data: { labels: L, datasets: [{ label: 'امتیاز از ۱۰۰', data: [68, 59, 53, 43, 39, 34, 30, 27, 23], backgroundColor: peerColors(L), borderRadius: 6 }] }, options: o });
  };
  B.fotn = function () {
    var o = base({ indexAxis: 'y' }); o.scales.x.stacked = true; o.scales.y.stacked = true; o.scales.x.reverse = true; o.scales.y.position = 'right'; o.scales.x.max = 100;
    o.scales.x.ticks.callback = function (v) { return fa(v); };
    o.scales.y.ticks.callback = function (v) { return this.getLabelForValue(v); };
    mk('cFotn', { type: 'bar', data: { labels: ['ایران ۲۰۲۵'], datasets: [
      { label: 'امتیاز کسب‌شده', data: [13], backgroundColor: css('--iran'), borderRadius: 6 },
      { label: 'امتیاز از دست رفته', data: [87], backgroundColor: css('--gridc'), borderRadius: 6 }] }, options: o });
  };

  /* آمادگی دیجیتال */
  B.nri = function () {
    var L = ['انسان‌ها', 'فناوری', 'کل', 'حکمرانی', 'اثرگذاری'];
    var o = hbar(base({ indexAxis: 'y' }), 133);
    o.scales.x.title = { display: true, text: 'رتبه از ۱۳۳ (کوتاه‌تر = بهتر)', color: css('--muted') };
    mk('cNri', { type: 'bar', data: { labels: L, datasets: [{ label: 'رتبه', data: [47, 54, 79, 81, 120], backgroundColor: L.map(function (l) { return l === 'کل' ? css('--iran') : css('--c-cap'); }), borderRadius: 6 }] }, options: o });
  };
  B.ai = function () {
    var o = base(); o.scales.y.min = 0; o.scales.y.max = 70;
    o.scales.x.ticks.callback = function (v) { return this.getLabelForValue(v); };
    mk('cAi', { type: 'bar', data: { labels: ['رکن دولت', 'رکن فناوری', 'رکن داده و زیرساخت'], datasets: [
      { label: '۲۰۲۳', data: [31.56, null, 55.88], backgroundColor: css('--peer'), borderRadius: 6 },
      { label: '۲۰۲۴', data: [26.54, 38.82, null], backgroundColor: css('--c-cap'), borderRadius: 6 }] }, options: o });
  };


  /* کاوشگر همه‌ی شاخص‌ها */
  (function () {
    var ex = document.querySelector('[data-ex]'); if (!ex) return;
    var q = ex.querySelector('[data-ex-q]'), so = ex.querySelector('[data-ex-sort]'), me = ex.querySelector('[data-ex-m]');
    var grid = ex.querySelector('.ex-grid'), tbl = ex.querySelector('.ex-tbl'), tbody = tbl.querySelector('tbody');
    var cards = [].slice.call(grid.children), trs = [].slice.call(tbody.children);
    var nEl = ex.querySelector('[data-ex-n]'), empty = ex.querySelector('[data-ex-empty]');
    var fs = 'all', fg = 'all', view = 'cards';
    function norm(t) { return (t || '').toLowerCase().replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/‌/g, ' '); }
    function cmp(k) {
      return function (a, b) {
        var A = a.dataset, Bd = b.dataset;
        if (k === 'best') return Bd.p - A.p;
        if (k === 'worst') { var pa = A.p < 0 ? 999 : +A.p, pb = Bd.p < 0 ? 999 : +Bd.p; return pa - pb; }
        if (k === 'year') return Bd.y - A.y;
        if (k === 'org') return A.org.localeCompare(Bd.org, 'fa');
        return A.name.localeCompare(Bd.name, 'fa');
      };
    }
    function apply() {
      var t = norm(q.value.trim()), m = me.value, n = 0;
      [cards, trs].forEach(function (list, li) {
        list.forEach(function (el) {
          var d = el.dataset;
          var ok = (fs === 'all' || d.s === fs) && (fg === 'all' || d.g === fg) && (m === 'all' || d.m === m) && (!t || norm(d.q).indexOf(t) > -1);
          el.hidden = !ok; if (ok && !li) n++;
        });
      });
      var k = so.value;
      cards.slice().sort(cmp(k)).forEach(function (c) { grid.appendChild(c); });
      trs.slice().sort(cmp(k)).forEach(function (c) { tbody.appendChild(c); });
      nEl.textContent = fa(n); empty.hidden = n > 0;
      grid.hidden = view !== 'cards' || !n; tbl.hidden = view !== 'table' || !n;
    }
    function chips(attr, set) {
      var bs = [].slice.call(ex.querySelectorAll('[data-ex-' + attr + ']'));
      bs.forEach(function (b) { b.addEventListener('click', function () { bs.forEach(function (x) { x.classList.toggle('on', x === b); }); set(b.getAttribute('data-ex-' + attr)); apply(); }); });
    }
    chips('s', function (v) { fs = v; }); chips('g', function (v) { fg = v; });
    q.addEventListener('input', apply); so.addEventListener('change', apply); me.addEventListener('change', apply);
    seg2(ex.querySelectorAll('[data-ex-v]'), function (b) { view = b.dataset.exV; apply(); });
    ex.querySelectorAll('[data-ex-th]').forEach(function (th) { th.addEventListener('click', function () { so.value = th.dataset.exTh; apply(); }); });
    apply();
  })();
  function seg2(list, cb) { var bs = [].slice.call(list); bs.forEach(function (b) { b.addEventListener('click', function () { bs.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); cb(b); }); }); }

  /* تطبیق با منطقه: دمبل + نقشه‌ی حرارتی */
  (function () {
    var root = document.querySelector('[data-cmp]'); if (!root) return;
    var P = JSON.parse(root.querySelector('.cmp-data').textContent);
    var C = P.countries, M = P.metrics, sel = 3, sortK = null, sortDir = -1;
    function nv(m, v) { if (v === null || v === undefined) return null; return m.kind === 'score1' ? v * 100 : m.kind === 'rank190' ? (190 - v) / 189 * 100 : v; }
    function lab(m, v) { if (v === null || v === undefined) return '—'; return m.kind === 'score1' ? fa(v.toFixed(2)) : m.kind === 'rank190' ? 'رتبه‌ی ' + fa(v) : fa(v); }
    var rowsEl = root.querySelector('[data-cmp-rows]'), sumEl = root.querySelector('[data-cmp-sum]'), heat = root.querySelector('[data-heat]');
    function draw() {
      var behind = 0, ahead = 0, both = 0, gaps = [], html = '';
      M.forEach(function (m) {
        var a = nv(m, m.v[0]), b = nv(m, m.v[sel]);
        if (a === null || b === null) {
          html += '<div class="cr na"><div class="cr-n">' + m.n + '<small>' + m.y + '</small></div><div class="cr-t"></div><div class="cr-v">داده‌ی ' + C[sel] + ' موجود نیست</div></div>';
          return;
        }
        both++; var d = Math.round(a - b); if (d < 0) behind++; else if (d > 0) ahead++; gaps.push(d);
        var lo = Math.min(a, b), hi = Math.max(a, b), cls = d < 0 ? 'bad' : 'good';
        html += '<div class="cr"><div class="cr-n"><a class="ixl" href="' + m.slug + '/" data-ix="' + m.slug + '">' + m.n + '</a><small>' + m.y + '</small></div>' +
          '<div class="cr-t"><span class="cr-bar ' + cls + '" style="inset-inline-start:' + lo + '%;width:' + (hi - lo) + '%"></span>' +
          '<span class="cr-d ot" style="inset-inline-start:' + b + '%" title="' + C[sel] + '"></span><span class="cr-d ir" style="inset-inline-start:' + a + '%" title="ایران"></span></div>' +
          '<div class="cr-v"><span class="ir">ایران <b>' + lab(m, m.v[0]) + '</b></span> · <span class="ot">' + C[sel] + ' <b>' + lab(m, m.v[sel]) + '</b></span>' +
          '<span class="gap ' + cls + '">' + (d < 0 ? fa(-d) + ' واحد عقب‌تر' : d > 0 ? fa(d) + ' واحد جلوتر' : 'برابر') + '</span></div></div>';
      });
      rowsEl.innerHTML = html;
      var avg = gaps.length ? Math.round(gaps.reduce(function (s, x) { return s + x; }, 0) / gaps.length) : 0;
      sumEl.innerHTML = '<div class="' + (behind ? 'bad' : 'good') + '"><b>' + fa(behind) + ' از ' + fa(both) + '</b><span>سنجه‌ای که ایران از ' + C[sel] + ' عقب‌تر است</span></div>' +
        '<div class="' + (avg < 0 ? 'bad' : 'good') + '"><b>' + (avg < 0 ? '−' : '+') + fa(Math.abs(avg)) + '</b><span>میانگین فاصله در مقیاس ۰ تا ۱۰۰</span></div>' +
        '<div><b>' + fa(ahead) + '</b><span>سنجه‌ای که ایران جلوتر است</span></div>';
      // نقشه‌ی حرارتی
      var order = C.map(function (c, i) { return i; });
      if (sortK !== null) order.sort(function (x, y) {
        if (sortK === 'name') return sortDir * C[x].localeCompare(C[y], 'fa') * -1;
        var a = nv(M[sortK], M[sortK].v[x]), b = nv(M[sortK], M[sortK].v[y]);
        if (a === null) return 1; if (b === null) return -1; return sortDir * (a - b) * -1;
      });
      heat.innerHTML = order.map(function (i) {
        return '<tr data-i="' + i + '" class="' + (i === 0 ? 'me' : i === sel ? 'sel' : '') + '"><td>' + C[i] + '</td>' + M.map(function (m) {
          var v = nv(m, m.v[i]); if (v === null) return '<td class="nd">—</td>';
          var h = Math.round(v / 100 * 150), bg = 'hsl(' + (345 + h) % 360 + ' 75% ' + (v > 50 ? 42 : 55) + '% / ' + (0.18 + v / 100 * 0.55) + ')';
          return '<td style="background:' + bg + '">' + lab(m, m.v[i]) + '</td>';
        }).join('') + '</tr>';
      }).join('');
    }
    var cbs = [].slice.call(root.querySelectorAll('[data-cmp-c]'));
    function pick(i) { sel = i; cbs.forEach(function (b) { b.classList.toggle('on', +b.dataset.cmpC === i); }); draw(); }
    cbs.forEach(function (b) { b.addEventListener('click', function () { pick(+b.dataset.cmpC); }); });
    heat.addEventListener('click', function (e) { var tr = e.target.closest('tr'); if (tr && +tr.dataset.i) pick(+tr.dataset.i); });
    root.querySelectorAll('th[data-cmp-k]').forEach(function (th) {
      function go(e) { if (e.target.closest('a')) return; var k = th.dataset.cmpK === 'name' ? 'name' : +th.dataset.cmpK; sortDir = sortK === k ? -sortDir : 1; sortK = k;
        root.querySelectorAll('th[data-cmp-k]').forEach(function (x) { x.classList.toggle('on', x === th); }); draw(); }
      th.addEventListener('click', go); th.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(e); });
    });
    draw();
  })();
  window.__idxShow = function (t) { show(t, true); };

  function start() {
    Chart.defaults.font.family = "'Yekan Bakh', system-ui, sans-serif";
    Chart.defaults.font.size = 13;
    show((location.hash || '#overview').slice(1), false);
    // تغییر حالت روشن/تاریک: نمودارهای زبانه‌ی فعلی با رنگ‌های تازه دوباره ساخته می‌شوند
    new MutationObserver(function () { build(current()); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start); else start();
})();
