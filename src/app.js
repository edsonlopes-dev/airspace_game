/* Game flow: progress store, question queue, screens. */
(function () {
'use strict';
var D = ASG, R = D.R, KEY = 'asg.v1', Scene = ASG_Scene;
var S = { lang: 'en', sound: true, ssr: true, sk: {}, bestStreak: 0, bestCheck: null };
var view = 'home', G = null, tblMode = 'ref', sel = null, heroTimer = 0, tick = 0;
var $ = function (q) { return document.querySelector(q); };

function load() {
  try { var o = JSON.parse(localStorage.getItem(KEY) || 'null'); if (o) for (var k in o) S[k] = o[k]; } catch (e) {}
  if (!S.sk || typeof S.sk !== 'object') S.sk = {};
  if (!ASG_I18N[S.lang]) S.lang = 'en';
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
function L() { return ASG_I18N[S.lang]; }
function tr(k, v) { var x = L()[k]; return typeof x === 'function' ? x(v || {}, tr) : (x == null ? '' : x); }
function tipText(k) { if (!k) return ''; var l = L(); return l[k] || l[k.replace(/_[A-G]{1,2}$/, '')] || ''; }
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

/* ---------- mastery ---------- */
function skills() { return D.skillList().filter(function (s) { return S.ssr || s.indexOf('ssr.') !== 0; }); }
function lvl(s) { return S.sk[s] ? S.sk[s].l : 0; }
function mark(s, ok) {
  var e = S.sk[s] || (S.sk[s] = { l: 0, x: 0, n: 0 }); e.n++;
  if (ok) { e.l = Math.min(2, e.l + 1); e.x = 0; } else { e.l = 0; e.x = 1; }
}
function progress() {
  var a = skills(), sum = 0, full = 0;
  a.forEach(function (s) { sum += lvl(s); if (lvl(s) === 2) full++; });
  var pct = Math.floor(100 * sum / (2 * a.length));
  return { pct: pct, full: full, total: a.length, rank: pct >= 100 ? 4 : pct >= 70 ? 3 : pct >= 45 ? 2 : pct >= 20 ? 1 : 0 };
}

/* ---------- queues ---------- */
function buildTraining(n) {
  var a = skills(), out = [], recent = [];
  for (var i = 0; i < n; i++) {
    var w = a.map(function (s) { var e = S.sk[s]; return recent.indexOf(s) >= 0 ? 0 : !e || !e.n ? 4 : e.x ? 6 : e.l === 1 ? 3 : 0.35; });
    var r = Math.random() * w.reduce(function (x, y) { return x + y; }, 0), pick = a[0];
    for (var j = 0; j < a.length; j++) { r -= w[j]; if (r <= 0) { pick = a[j]; break; } }
    out.push(pick); recent.push(pick); if (recent.length > 8) recent.shift();
  }
  if (Math.random() < 0.4) out[3 + Math.floor(Math.random() * (n - 4))] = 'bonus';
  return out;
}
function buildCheck() {
  var plan = { sep: 4, svc: 3, clr: 3, rad: 3, spd: 3, perm: 1, ctl: 1 };
  if (S.ssr) plan.ssr = 1; else plan.sep = 5;
  var a = skills(), out = [], used = {}, h = D.H(Math.random);
  Object.keys(plan).forEach(function (tp) {
    var pool = h.shuffle(a.filter(function (s) { return s.indexOf(tp + '.') === 0; }));
    for (var i = 0; i < plan[tp]; i++) {
      pool.sort(function (x, y) { return (used[x.split('.')[1]] || 0) - (used[y.split('.')[1]] || 0); });
      var s = pool.shift(), c = s.split('.')[1]; out.push(s); used[c] = (used[c] || 0) + 1;
    }
  });
  out.push('bonus');
  return h.shuffle(out);
}
function makeQ(skill) {
  var h = D.H(Math.random), q;
  if (skill === 'bonus') { q = D.G.boundary(h); q.gen = 'boundary'; return q; }
  return D.forSkill(h, skill) || D.forSkill(h, 'sep.B.IV');
}

/* ---------- sound ---------- */
var actx = null;
function beep(kind) {
  if (!S.sound) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    var t = actx.currentTime, notes = kind === 'ok' ? [[660, 0], [880, 0.09]] : kind === 'end' ? [[523, 0], [659, 0.11], [784, 0.22]] : [[233, 0], [185, 0.13]];
    notes.forEach(function (n) {
      var o = actx.createOscillator(), g = actx.createGain();
      o.type = kind === 'bad' ? 'triangle' : 'sine'; o.frequency.value = n[0];
      g.gain.setValueAtTime(0.0001, t + n[1]); g.gain.exponentialRampToValueAtTime(0.11, t + n[1] + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + n[1] + 0.24);
      o.connect(g); g.connect(actx.destination); o.start(t + n[1]); o.stop(t + n[1] + 0.26);
    });
  } catch (e) {}
}

/* ---------- play ---------- */
function start(mode) {
  var queue = mode === 'check' ? buildCheck() : buildTraining(10);
  G = { mode: mode, queue: queue, i: 0, q: null, picked: null, score: 0, streak: 0, right: 0, log: [], full0: progress().full, limit: 30000, left: 1 };
  view = 'play'; render(); nextQ();
}
function nextQ() {
  for (var k = 0; k < 4; k++) {
    G.q = makeQ(G.queue[G.i]);
    var prev = G.log.length ? G.log[G.log.length - 1].q : null;
    if (!prev || prev.gen !== G.q.gen || prev.cls !== G.q.cls) break;
  }
  G.picked = null; G.gain = 0;
  Scene.set(G.q.scene, { dur: G.mode === 'check' ? G.limit : 9000 });
  renderPanel();
  if (G.mode === 'check') { G.deadline = performance.now() + G.limit; runTimer(); }
}
function runTimer() {
  cancelAnimationFrame(tick);
  (function step() {
    if (view !== 'play' || !G || G.picked !== null) return;
    var left = Math.max(0, (G.deadline - performance.now()) / G.limit), bar = $('#timer');
    G.left = left; if (bar) bar.style.transform = 'scaleX(' + left.toFixed(4) + ')';
    if (left <= 0) return answer(-1);
    tick = requestAnimationFrame(step);
  })();
}
function answer(i) {
  if (!G || G.picked !== null) return;
  var q = G.q, ok = i >= 0 && !!q.opts[i].ok;
  G.picked = i;
  q.skills.forEach(function (s) { if (S.ssr || s.indexOf('ssr.') !== 0) mark(s, ok); });
  if (ok) {
    G.right++; G.streak++;
    G.gain = 100 + Math.min(50, 10 * (G.streak - 1)) + (G.mode === 'check' ? Math.round(50 * G.left) : 0);
    G.score += G.gain; if (G.streak > S.bestStreak) S.bestStreak = G.streak;
  } else G.streak = 0;
  G.log.push({ q: q, picked: i, ok: ok });
  save(); beep(ok ? 'ok' : 'bad');
  if (!ok && navigator.vibrate) { try { navigator.vibrate(60); } catch (e) {} }
  Scene.reveal(); renderPanel();
}
function advance() {
  if (!G || G.picked === null) return;
  if (G.i + 1 >= G.queue.length) return finish();
  G.i++; nextQ();
}
function finish() {
  var n = G.queue.length;
  if (G.mode === 'check' && (!S.bestCheck || G.right > S.bestCheck.right || (G.right === S.bestCheck.right && G.score > S.bestCheck.score)))
    S.bestCheck = { right: G.right, n: n, score: G.score };
  save(); beep('end'); view = 'result'; render();
}

/* ---------- rendering ---------- */
function expHtml(q) {
  return q.exp.map(function (e) { return '<p>' + esc(e.k ? tr(e.k, e.v) : L().rule(e.topic, e.cls)) + '</p>'; }).join('');
}
function renderPanel() {
  var p = $('#panel'); if (!p || !G || !G.q) return;
  var q = G.q, done = G.picked !== null, n = G.queue.length, two = q.opts.length === 2, h = '';
  h += '<div class="qhead"><span>' + esc(tr('question')) + ' <b>' + (G.i + 1) + '</b>/' + n + '</span><span>' + G.score + ' ' + esc(tr('pts')) +
       (G.streak > 1 ? ' · ×' + G.streak : '') + '</span><button class="ghost" data-act="home">' + esc(tr('quit')) + '</button></div>';
  if (G.mode === 'check') h += '<div class="timer"><i id="timer" style="transform:scaleX(' + (done ? G.left : 1) + ')"></i></div>';
  h += '<div class="grow scroll" id="qbody"><div class="qtext">' + esc(tr(q.q.k, q.q.v)) + '</div>';
  if (q.q.v && q.q.v.clues) h += '<ul class="clues">' + q.q.v.clues.map(function (k) { return '<li>' + esc(tr(k)) + '</li>'; }).join('') + '</ul>';
  h += '<div class="opts' + (two ? ' two' : '') + '">';
  q.opts.forEach(function (o, i) {
    var c = 'opt';
    if (done) { c += o.ok ? ' right' : i === G.picked ? ' pick' : ' dim'; if (!two && !o.ok && i !== G.picked) return; }
    h += '<button class="' + c + '" data-opt="' + i + '"' + (done ? ' disabled' : '') + '>' + esc(tr(o.k, o.v)) + '</button>';
  });
  h += '</div>';
  if (done) {
    var good = G.log[G.log.length - 1].ok;
    h += '<div class="fb ' + (good ? 'good' : 'poor') + '"><h3>' + esc(good ? tr('correct') + '  +' + G.gain : G.picked < 0 ? tr('timeup') : tr('wrong')) + '</h3>' + expHtml(q) + '</div>';
    var tp = tipText(q.tip); if (tp) h += '<div class="memo"><span>' + esc(tr('memo')) + '</span>' + esc(tp) + '</div>';
  }
  h += '</div>';
  if (done) h += '<button class="btn" data-act="next" id="btnNext">' + esc(tr(G.i + 1 >= n ? 'finish' : 'next')) + '</button>';
  p.innerHTML = h;
  if (done) { var b = $('#qbody'); b.scrollTop = 0; }
}
var DEMO = { kind: 'pair', cls: 'C', geo: 'headon', ac: [{ fr: 'I', model: 'jet', kt: 280, fl: 80 }, { fr: 'V', model: 'light', kt: 120, fl: 75 }], reveal: { link: 'SEP' } };
function renderHome() {
  var p = progress(), bc = S.bestCheck;
  return '<div class="home scroll grow"><div class="scene hero" id="scene"></div>' +
    '<div class="lede"><h1>' + esc(tr('pitch')) + '</h1><p>' + esc(tr('tagline')) + '</p></div>' +
    '<div class="stat"><div class="top"><span class="rank">' + esc(L().ranks[p.rank]) + '</span><span class="pct">' + esc(tr('mastery')) + ' ' + p.pct + '%</span></div>' +
    '<div class="meter"><i style="width:' + p.pct + '%"></i></div>' +
    '<div class="facts"><span>' + p.full + '/' + p.total + ' ' + esc(tr('cells')) + '</span><span>' + esc(tr('best_streak')) + ' ' + S.bestStreak + '</span>' +
    '<span>' + esc(tr('best_check')) + ' ' + (bc ? bc.right + '/' + bc.n : esc(tr('none_yet'))) + '</span></div></div>' +
    '<div class="modes"><button class="mode main" data-act="train"><b>' + esc(tr('home_train')) + '</b><span>' + esc(tr('home_train_d')) + '</span></button>' +
    '<button class="mode" data-act="check"><b>' + esc(tr('home_check')) + '</b><span>' + esc(tr('home_check_d')) + '</span></button>' +
    '<button class="mode" data-act="table"><b>' + esc(tr('home_table')) + '</b><span>' + esc(tr('home_table_d')) + '</span></button></div>' +
    '<label class="check" for="optSsr"><input type="checkbox" id="optSsr"' + (S.ssr ? ' checked' : '') + '>' + esc(tr('ssr_toggle')) + '</label>' +
    '<div class="foot"><button class="linkbtn" data-act="about">' + esc(tr('about')) + '</button><button class="linkbtn" data-act="reset">' + esc(tr('reset')) + '</button></div></div>';
}
function renderResult() {
  var n = G.queue.length, p = progress(), miss = G.log.filter(function (x) { return !x.ok; });
  var title = G.mode !== 'check' ? 'res_train' : G.right === n ? 'res_flawless' : G.right >= Math.ceil(n * 0.9) ? 'res_pass' : 'res_fail';
  var h = '<div class="result scroll grow"><h1>' + esc(tr(title)) + '</h1><div class="tiles">' +
    '<div class="tile"><b>' + G.right + '/' + n + '</b><span>' + esc(tr('res_acc')) + '</span></div>' +
    '<div class="tile"><b>' + G.score + '</b><span>' + esc(tr('res_score')) + '</span></div>' +
    '<div class="tile"><b>' + p.full + '/' + p.total + '</b><span>' + esc(tr('res_gain')) + '</span></div></div>' +
    '<div class="actions"><button class="btn" data-act="' + (G.mode === 'check' ? 'check' : 'train') + '">' + esc(tr('again')) + '</button>' +
    '<button class="btn alt" data-act="home">' + esc(tr('home')) + '</button></div><h2>' + esc(tr('res_review')) + '</h2>';
  if (!miss.length) h += '<p>' + esc(tr('res_none')) + '</p>';
  miss.forEach(function (x) {
    var q = x.q, right = q.opts.filter(function (o) { return o.ok; })[0];
    h += '<div class="miss"><span class="k">' + esc(tr('tp_' + q.topic)) + (R[q.scene.cls] ? ' · ' + esc(tr('o_cls', { c: q.scene.cls })) : '') + '</span>' +
      '<span class="qq">' + esc(tr(q.q.k, q.q.v)) + (q.q.v && q.q.v.clues ? ' ' + esc(q.q.v.clues.map(function (k) { return tr(k); }).join(' ')) : '') + '</span>' +
      '<span class="no">' + esc(tr('your_answer')) + ': ' + esc(x.picked < 0 ? tr('no_answer') : tr(q.opts[x.picked].k, q.opts[x.picked].v)) + '</span>' +
      '<span class="ya">' + esc(tr('right_answer')) + ': ' + esc(tr(right.k, right.v)) + '</span><div class="why">' + expHtml(q) + '</div></div>';
  });
  return h + '</div>';
}
var SEPV = { SEP: ['SEP', 'ok'], INFO: ['INFO', 'info'], INFOP: ['INFO*', 'info'], ADV: ['ADV', 'warn'], NONE: ['—', 'bad'] };
var SVCV = { ATC: ['ATC', 'ok'], INFOP: ['INFO*', 'info'], ADV: ['ADV', 'warn'], FIS: ['FIS', 'warn'] };
function rows() {
  var yn = function (v) { return v ? [tr('yes'), 'ok'] : [tr('no'), 'bad']; };
  var per = function (tp, f) { return D.FRS.map(function (t) { return { lab: L().fr(t), tp: tp, key: function (c) { return t in R[c][tp] ? tp + '.' + c + '.' + t : null; }, val: function (c) { return f(R[c][tp][t]); } }; }); };
  var out = [
    { sec: 'tp_perm', rows: [{ lab: '', tp: 'perm', key: function (c) { return 'perm.' + c; }, val: function (c) { return R[c].vfr ? ['IFR VFR', 'ok'] : ['IFR', 'warn']; } }] },
    { sec: 'tp_ctl', rows: [{ lab: '', tp: 'ctl', key: function (c) { return 'ctl.' + c; }, val: function (c) { return yn(R[c].ctl); } }] },
    { sec: 'tp_sep', rows: D.PAIRS.map(function (p) { return { lab: L().P[p], tp: 'sep', key: function (c) { return R[c].sep[p] ? 'sep.' + c + '.' + p : null; }, val: function (c) { return SEPV[R[c].sep[p]]; } }; }) },
    { sec: 'tp_svc', rows: per('svc', function (v) { return SVCV[v]; }) },
    { sec: 'tp_clr', rows: per('clr', yn) }, { sec: 'tp_rad', rows: per('rad', yn) },
    { sec: 'tp_spd', rows: per('spd', function (v) { return v ? ['250', 'info'] : ['n/a', '']; }) }
  ];
  if (S.ssr) out.push({ sec: 'tp_ssr', rows: [{ lab: '', tp: 'ssr', key: function (c) { return 'ssr.' + c; }, val: function (c) { return yn(R[c].ssr); } }] });
  return out;
}
function renderTable() {
  var my = tblMode === 'my', h = '<div class="study scroll grow"><div class="seg"><button data-tbl="ref" aria-pressed="' + !my + '">' + esc(tr('tbl_ref')) +
    '</button><button data-tbl="my" aria-pressed="' + my + '">' + esc(tr('tbl_my')) + '</button></div><div class="tw"><table class="mx"><thead><tr><th class="rl"></th>' +
    D.CLS.map(function (c) { return '<th' + (R[c].ctl ? '' : ' class="un"') + '>' + c + '</th>'; }).join('') + '</tr></thead><tbody>';
  var note = '';
  rows().forEach(function (sec) {
    h += '<tr class="sec"><th colspan="8">' + esc(tr(sec.sec)) + '</th></tr>';
    sec.rows.forEach(function (r) {
      h += '<tr><th class="rl">' + esc(r.lab) + '</th>';
      D.CLS.forEach(function (c) {
        var k = r.key(c); if (!k) { h += '<td></td>'; return; }
        var v = r.val(c), e = S.sk[k], st = !e || !e.n ? 0 : e.x ? 'x' : e.l;
        var cl = my ? (st === 0 ? '' : ' k' + st) : (v[1] ? ' v-' + v[1] : '');
        if (sel === k) note = '<span class="k">' + esc(tr(sec.sec)) + ' · ' + esc(tr('o_cls', { c: c })) + (r.lab ? ' · ' + esc(r.lab) : '') + ' · ' + esc(tr('m' + st)) + '</span>' + esc(L().rule(r.tp, c));
        h += '<td><button class="cell' + cl + (sel === k ? ' sel' : '') + '" data-cell="' + k + '">' + esc(v[0]).replace(' ', '<br>') + '</button></td>';
      });
      h += '</tr>';
    });
  });
  h += '</tbody></table></div><div class="note">' + (note || esc(tr('tbl_tap'))) + '</div><div class="legend">';
  if (my) h += [['', 'm0'], ['k1', 'm1'], ['k2', 'm2'], ['kx', 'mx']].map(function (x) { return '<span><i class="cell ' + x[0] + '">■</i>' + esc(tr(x[1])) + '</span>'; }).join('');
  else h += [['SEP', 'ok', 'lg_SEP'], ['INFO', 'info', 'lg_INFO'], ['INFO*', 'info', 'lg_INFOP'], ['ADV', 'warn', 'lg_ADV'], ['—', 'bad', 'lg_NONE'], ['ATC', 'ok', 'lg_ATC'], ['FIS', 'warn', 'lg_FIS'], ['250', 'info', 'lg_250'], ['n/a', '', 'lg_na']]
    .map(function (x) { return '<span><i class="cell' + (x[1] ? ' v-' + x[1] : '') + '">' + x[0] + '</i>' + esc(tr(x[2])) + '</span>'; }).join('');
  return h + '</div><div class="actions"><button class="btn" data-act="train">' + esc(tr('home_train')) + '</button><button class="btn alt" data-act="home">' + esc(tr('home')) + '</button></div></div>';
}
function render() {
  clearTimeout(heroTimer); cancelAnimationFrame(tick);
  document.documentElement.lang = S.lang;
  $('#brandName').textContent = tr('app_name'); $('#btnLang').textContent = S.lang === 'en' ? 'PT' : 'EN';
  $('#btnLang').setAttribute('aria-label', tr('lang'));
  var bs = $('#btnSound'); bs.textContent = tr('sound'); bs.setAttribute('aria-pressed', String(!!S.sound));
  var v = $('#view');
  if (view === 'play') {
    if (!$('#panel')) { v.innerHTML = '<div class="scene" id="scene"></div><div class="panel" id="panel"></div>'; Scene.init($('#scene'), tr); }
    else { renderPanel(); Scene.relabel(); if (G && G.picked === null && G.mode === 'check') runTimer(); }
    return;
  }
  Scene.stop();
  v.innerHTML = view === 'result' ? renderResult() : view === 'table' ? renderTable() : renderHome();
  if (view === 'home') {
    Scene.init($('#scene'), tr); Scene.set(DEMO, { dur: 2600 });
    heroTimer = setTimeout(function () { if (view === 'home') Scene.reveal(); }, 2400);
  }
}
function modal(html) { var m = $('#modal'); m.innerHTML = html ? '<div class="sheet" role="dialog" aria-modal="true">' + html + '</div>' : ''; m.hidden = !html; }

/* ---------- events ---------- */
document.addEventListener('click', function (ev) {
  var t = ev.target.closest ? ev.target.closest('[data-opt],[data-act],[data-tbl],[data-cell]') : null;
  if (!t) { if (ev.target.id === 'modal') modal(''); return; }
  if (t.hasAttribute('data-opt')) return answer(+t.getAttribute('data-opt'));
  if (t.hasAttribute('data-tbl')) { tblMode = t.getAttribute('data-tbl'); return render(); }
  if (t.hasAttribute('data-cell')) { sel = t.getAttribute('data-cell'); var sc = $('.study').scrollTop; render(); $('.study').scrollTop = sc; return; }
  var a = t.getAttribute('data-act');
  if (a === 'train' || a === 'check') { modal(''); start(a); }
  else if (a === 'next') advance();
  else if (a === 'home') { G = view === 'result' ? G : null; view = 'home'; render(); }
  else if (a === 'table') { view = 'table'; render(); }
  else if (a === 'lang') { S.lang = S.lang === 'en' ? 'pt' : 'en'; save(); render(); }
  else if (a === 'sound') { S.sound = !S.sound; save(); render(); if (S.sound) beep('ok'); }
  else if (a === 'about') modal('<h2>' + esc(tr('about')) + '</h2><ul>' + L().src.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul><button class="btn" data-act="close">' + esc(tr('close')) + '</button>');
  else if (a === 'reset') modal('<h2>' + esc(tr('reset_q')) + '</h2><div class="actions"><button class="btn" data-act="doreset">' + esc(tr('reset_yes')) + '</button><button class="btn alt" data-act="close">' + esc(tr('cancel')) + '</button></div>');
  else if (a === 'doreset') { S.sk = {}; S.bestStreak = 0; S.bestCheck = null; save(); modal(''); render(); }
  else if (a === 'close') modal('');
});
document.addEventListener('change', function (ev) { if (ev.target.id === 'optSsr') { S.ssr = ev.target.checked; save(); render(); } });
document.addEventListener('keydown', function (ev) {
  if (view !== 'play' || !G || ev.metaKey || ev.ctrlKey || ev.altKey) return;
  if (G.picked === null) { var n = '1234'.indexOf(ev.key); if (n >= 0 && n < G.q.opts.length) answer(n); }
  else if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); advance(); }
});
window.addEventListener('resize', function () { Scene.measure(); });

/*DEBUG_HOOK*/
load(); render();
})();
