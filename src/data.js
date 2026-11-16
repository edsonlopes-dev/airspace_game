/* Airspace rules (ICAO Annex 11, 15th ed., Appendix 4) + question generators.
   Pure logic, no DOM: also loaded by the Node test script. */
(function (root) {
'use strict';
var CLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
/* sep: SEP separation | INFO traffic information | INFOP info "as far as practical" | ADV advisory | NONE
   svc: ATC | INFOP | ADV (advisory + FIS) | FIS.  spd: 1 = 250 kt IAS below FL100 applies.
   ssr: NOT an ICAO row - comes from the player's course table. */
var R = {
  A: { ctl: 1, vfr: 0, sep: { II: 'SEP' }, svc: { I: 'ATC' }, clr: { I: 1 }, rad: { I: 1 }, spd: { I: 0 }, ssr: 1 },
  B: { ctl: 1, vfr: 1, sep: { II: 'SEP', IV: 'SEP', VV: 'SEP' }, svc: { I: 'ATC', V: 'ATC' }, clr: { I: 1, V: 1 }, rad: { I: 1, V: 1 }, spd: { I: 0, V: 0 }, ssr: 1 },
  C: { ctl: 1, vfr: 1, sep: { II: 'SEP', IV: 'SEP', VV: 'INFO' }, svc: { I: 'ATC', V: 'ATC' }, clr: { I: 1, V: 1 }, rad: { I: 1, V: 1 }, spd: { I: 0, V: 1 }, ssr: 1 },
  D: { ctl: 1, vfr: 1, sep: { II: 'SEP', IV: 'INFO', VV: 'INFO' }, svc: { I: 'ATC', V: 'ATC' }, clr: { I: 1, V: 1 }, rad: { I: 1, V: 1 }, spd: { I: 1, V: 1 }, ssr: 1 },
  E: { ctl: 1, vfr: 1, sep: { II: 'SEP', IV: 'INFOP', VV: 'INFOP' }, svc: { I: 'ATC', V: 'INFOP' }, clr: { I: 1, V: 0 }, rad: { I: 1, V: 0 }, spd: { I: 1, V: 1 }, ssr: 1 },
  F: { ctl: 0, vfr: 1, sep: { II: 'ADV', IV: 'NONE', VV: 'NONE' }, svc: { I: 'ADV', V: 'FIS' }, clr: { I: 0, V: 0 }, rad: { I: 1, V: 0 }, spd: { I: 1, V: 1 }, ssr: 1 },
  G: { ctl: 0, vfr: 1, sep: { II: 'NONE', IV: 'NONE', VV: 'NONE' }, svc: { I: 'FIS', V: 'FIS' }, clr: { I: 0, V: 0 }, rad: { I: 1, V: 0 }, spd: { I: 1, V: 1 }, ssr: 0 }
};
var PAIRS = ['II', 'IV', 'VV'], FRS = ['I', 'V'];
var TOPICS = ['perm', 'ctl', 'sep', 'svc', 'clr', 'rad', 'spd', 'ssr'];
function rel(x) { return x === 'INFOP' ? 'INFO' : x; }

function skillList() {
  var s = [];
  CLS.forEach(function (c) {
    s.push('perm.' + c, 'ctl.' + c);
    PAIRS.forEach(function (p) { if (R[c].sep[p]) s.push('sep.' + c + '.' + p); });
    ['svc', 'clr', 'rad', 'spd'].forEach(function (k) {
      FRS.forEach(function (t) { if (t in R[c][k]) s.push(k + '.' + c + '.' + t); });
    });
    s.push('ssr.' + c);
  });
  return s;
}

/* ---------- random helpers (seedable for tests) ---------- */
function mulberry(seed) {
  var a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function H(rnd) {
  var h = {
    r: rnd,
    int: function (a, b) { return a + Math.floor(rnd() * (b - a + 1)); },
    pick: function (arr) { return arr[Math.floor(rnd() * arr.length)]; },
    chance: function (p) { return rnd() < p; },
    shuffle: function (arr) {
      var a = arr.slice();
      for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var x = a[i]; a[i] = a[j]; a[j] = x; }
      return a;
    }
  };
  return h;
}

/* ---------- aircraft ---------- */
var SPEED = { light: [90, 140], heli: [70, 120], tprop: [190, 250], biz: [210, 250], jet: [220, 250] };
var FAST = { biz: [270, 330], jet: [270, 340] };
function mkAc(h, fr, o) {
  o = o || {};
  var model;
  if (o.fast) model = fr === 'I' ? h.pick(['jet', 'jet', 'biz']) : 'biz';
  else model = fr === 'I' ? h.pick(['jet', 'jet', 'biz', 'tprop', 'light']) : h.pick(['light', 'light', 'heli', 'tprop']);
  var rg = o.fast ? FAST[model] : SPEED[model];
  var kt = Math.round(h.int(rg[0], rg[1]) / 10) * 10;
  if (!o.fast && kt > 250) kt = 250;
  var fl;
  if (o.above) fl = (fr === 'I' ? 110 : 115) + 10 * h.int(0, 7);
  else fl = (fr === 'I' ? 40 : 45) + 10 * h.int(0, 5);
  if (model === 'heli' || model === 'light') { if (fl > 95) fl = fr === 'I' ? 90 : 95; }
  return { fr: fr, model: model, kt: kt, fl: fl };
}
function pairAc(h, p, o) {
  var t = p === 'II' ? ['I', 'I'] : p === 'VV' ? ['V', 'V'] : (h.chance(0.5) ? ['I', 'V'] : ['V', 'I']);
  return [mkAc(h, t[0], o), mkAc(h, t[1], o)];
}
var GEO = ['headon', 'crossing', 'overtake'];
function yn(ok) { return [{ k: 'yes', ok: !!ok }, { k: 'no', ok: !ok }]; }
function who(i, v) {
  return [{ k: 'o_both', ok: !!(i && v) }, { k: 'o_onlyI', ok: !!(i && !v) },
          { k: 'o_onlyV', ok: !!(!i && v) }, { k: 'o_neither', ok: !i && !v }];
}
function frOf(h, c, t) {
  if (t === 'I' || (t === 'V' && R[c].vfr)) return t;
  return R[c].vfr ? h.pick(FRS) : 'I';
}
function tone(ok) { return ok ? 'ok' : 'bad'; }

/* ---------- generators: (h, class, sub) -> question | null ---------- */
var G = {};

G.permWho = function (h, c) {
  var ac = pairAc(h, 'IV'), v = R[c].vfr;
  return { topic: 'perm', cls: c, scene: { kind: 'pair', cls: c, geo: h.pick(GEO), ac: ac,
      reveal: { tags: ac.map(function (a) { return a.fr === 'V' && !v ? { k: 'tag_notallowed', tone: 'bad' } : { k: 'tag_allowed', tone: 'ok' }; }) } },
    q: { k: 'q_perm_who' }, opts: who(1, v), exp: [{ topic: 'perm', cls: c }], tip: c === 'A' || c === 'B' ? 'tip_AB' : null,
    skills: ['perm.' + c] };
};
G.permSolo = function (h, c) {
  var v = R[c].vfr;
  return { topic: 'perm', cls: c, scene: { kind: 'solo', cls: c, ac: [mkAc(h, 'V')],
      reveal: { tags: [{ k: v ? 'tag_allowed' : 'tag_notallowed', tone: tone(v) }] } },
    q: { k: 'q_perm_solo' }, opts: yn(v), exp: [{ topic: 'perm', cls: c }], tip: c === 'A' ? 'tip_AB' : null,
    skills: ['perm.' + c] };
};
G.ctlYN = function (h, c) {
  var solo = h.chance(0.5) || !R[c].vfr;
  return { topic: 'ctl', cls: c,
    scene: solo ? { kind: 'solo', cls: c, ac: [mkAc(h, frOf(h, c))], reveal: {} }
                : { kind: 'pair', cls: c, geo: h.pick(GEO), ac: pairAc(h, h.pick(PAIRS)), reveal: {} },
    q: { k: 'q_ctl' }, opts: yn(R[c].ctl), exp: [{ topic: 'ctl', cls: c }], tip: 'tip_ctl', skills: ['ctl.' + c] };
};

function sepPairOf(h, c, p) {
  if (p && R[c].sep[p]) return p;
  return h.pick(PAIRS.filter(function (x) { return R[c].sep[x]; }));
}
G.sepPair = function (h, c, p) {
  p = sepPairOf(h, c, p); var raw = R[c].sep[p], r = rel(raw);
  return { topic: 'sep', cls: c, scene: { kind: 'pair', cls: c, geo: h.pick(GEO), ac: pairAc(h, p), reveal: { link: raw } },
    q: { k: 'q_sep_pair', v: { p: p } },
    opts: ['SEP', 'INFO', 'ADV', 'NONE'].map(function (x) { return { k: 'o_sep_' + x, ok: x === r }; }),
    exp: [{ topic: 'sep', cls: c }], tip: 'tip_sep_' + c, skills: ['sep.' + c + '.' + p] };
};
G.sepYN = function (h, c, p) {
  p = sepPairOf(h, c, p); var raw = R[c].sep[p];
  return { topic: 'sep', cls: c, scene: { kind: 'pair', cls: c, geo: h.pick(GEO), ac: pairAc(h, p), reveal: { link: raw } },
    q: { k: 'q_sep_yn', v: { p: p } }, opts: yn(rel(raw) === 'SEP'),
    exp: [{ topic: 'sep', cls: c }], tip: 'tip_sep_' + c, skills: ['sep.' + c + '.' + p] };
};
G.sepSet = function (h, c, p) {
  p = sepPairOf(h, c, p); var r = rel(R[c].sep[p]);
  var avail = CLS.filter(function (x) { return R[x].sep[p]; });
  var set = avail.filter(function (x) { return rel(R[x].sep[p]) === r; });
  var key = function (s) { return s.join(''); };
  var cands = [], seen = {}; seen[key(set)] = 1;
  function add(s) { if (s.length && !seen[key(s)]) { seen[key(s)] = 1; cands.push(s); } }
  var lo = avail.indexOf(set[0]), hi = avail.indexOf(set[set.length - 1]);
  add(avail.slice(lo + 1, hi + 1)); add(avail.slice(lo, hi)); add(avail.slice(lo, hi + 2));
  add(avail.slice(Math.max(0, lo - 1), hi + 1)); add(avail.slice(lo + 1, hi + 2)); add(avail.slice(Math.max(0, lo - 1), hi));
  var guard = 0;
  while (cands.length < 3 && guard++ < 50) { var a = h.int(0, avail.length - 1), b = h.int(a, avail.length - 1); add(avail.slice(a, b + 1)); }
  var opts = [{ k: 'o_set', v: { set: set }, ok: true }].concat(
    h.shuffle(cands).slice(0, 3).map(function (s) { return { k: 'o_set', v: { set: s }, ok: false }; }));
  opts.sort(function (x, y) { return key(x.v.set) < key(y.v.set) ? -1 : 1; });
  return { topic: 'sep', cls: c, noShuffle: true,
    scene: { kind: 'pair', cls: '?', geo: h.pick(GEO), ac: pairAc(h, p), reveal: { link: r, clsSet: set } },
    q: { k: 'q_sep_set_' + r, v: { p: p } }, opts: opts,
    exp: [{ k: 'x_sep_set', v: { p: p, r: r, set: set } }], tip: null,
    skills: set.slice(0, 4).map(function (x) { return 'sep.' + x + '.' + p; }) };
};

var SVC_D = { ATC_I: ['ADV', 'FIS', 'NONE'], ATC_V: ['ADV', 'FIS', 'INFOP'], INFOP: ['ATC', 'ADV', 'NONE'],
              FIS: ['ATC', 'ADV', 'NONE'], ADV: ['ATC', 'FIS', 'NONE'] };
G.svcSolo = function (h, c, t) {
  t = frOf(h, c, t); var s = R[c].svc[t];
  var d = SVC_D[s === 'ATC' ? 'ATC_' + t : s];
  return { topic: 'svc', cls: c, scene: { kind: 'solo', cls: c, ac: [mkAc(h, t)], reveal: { tags: [{ k: 'tag_svc_' + s, tone: s === 'ATC' ? 'ok' : s === 'INFOP' ? 'info' : 'warn' }] } },
    q: { k: 'q_svc', v: { t: t } },
    opts: ['ATC', 'ADV', 'INFOP', 'FIS', 'NONE'].filter(function (x) { return x === s || d.indexOf(x) >= 0; }).map(function (x) { return { k: 'o_svc_' + x, ok: x === s }; }),
    exp: [{ topic: 'svc', cls: c }], tip: 'tip_svc_' + c, skills: ['svc.' + c + '.' + t] };
};

function soloYN(topic, qk, tagY, tagN) {
  return function (h, c, t) {
    t = frOf(h, c, t); var v = R[c][topic][t];
    return { topic: topic, cls: c, scene: { kind: 'solo', cls: c, ac: [mkAc(h, t)], reveal: { tags: [{ k: v ? tagY : tagN, tone: v ? 'ok' : 'bad' }] } },
      q: { k: qk, v: { t: t } }, opts: yn(v), exp: [{ topic: topic, cls: c }], tip: 'tip_' + topic + '_' + c,
      skills: [topic + '.' + c + '.' + t] };
  };
}
function whoQ(topic, qk, tagY, tagN) {
  return function (h, c) {
    if (!R[c].vfr) return null;
    var ac = pairAc(h, 'IV', topic === 'spd' ? { fast: true } : null), k = R[c][topic];
    return { topic: topic, cls: c, scene: { kind: 'pair', cls: c, geo: h.pick(GEO), ac: ac,
        reveal: { tags: ac.map(function (a) { return { k: k[a.fr] ? tagY : tagN, tone: (topic === 'spd' ? !k[a.fr] : k[a.fr]) ? 'ok' : 'bad' }; }) } },
      q: { k: qk }, opts: who(k.I, k.V), exp: [{ topic: topic, cls: c }], tip: 'tip_' + topic + '_' + c,
      skills: [topic + '.' + c + '.I', topic + '.' + c + '.V'] };
  };
}
G.clrSolo = soloYN('clr', 'q_clr', 'tag_clr_y', 'tag_clr_n');
G.clrWho = whoQ('clr', 'q_clr_who', 'tag_clr_y', 'tag_clr_n');
G.radSolo = soloYN('rad', 'q_rad', 'tag_rad_y', 'tag_rad_n');
G.radWho = whoQ('rad', 'q_rad_who', 'tag_rad_y', 'tag_rad_n');
G.spdWho = whoQ('spd', 'q_spd_who', 'tag_spd_bust', 'tag_spd_free');
G.entry = function (h, c, t) {
  t = frOf(h, c, t); var cl = R[c].clr[t], ra = R[c].rad[t];
  return { topic: 'clr', cls: c, scene: { kind: 'enter', cls: c, ac: [mkAc(h, t)],
      reveal: { tags: [[{ k: cl ? 'tag_clr_y' : 'tag_clr_n', tone: tone(cl) }, { k: ra ? 'tag_rad_y' : 'tag_rad_n', tone: tone(ra) }]] } },
    q: { k: 'q_entry', v: { t: t } },
    opts: [{ k: 'o_ent_both', ok: !!(cl && ra) }, { k: 'o_ent_rad', ok: !!(!cl && ra) },
           { k: 'o_ent_clr', ok: !!(cl && !ra) }, { k: 'o_ent_none', ok: !cl && !ra }],
    exp: [{ topic: 'clr', cls: c }, { topic: 'rad', cls: c }], tip: 'tip_clr_' + c,
    skills: ['clr.' + c + '.' + t, 'rad.' + c + '.' + t] };
};

G.spdBust = function (h, c, t) {
  t = frOf(h, c, t);
  var mode = h.r(); var fast = mode < 0.9, above = mode >= 0.75 && mode < 0.9;
  var a = mkAc(h, t, { fast: fast, above: above });
  if (a.fl >= 100 && !above) a.fl = t === 'I' ? 90 : 95;
  var lim = R[c].spd[t], bust = !!(fast && !above && lim);
  var x = [{ topic: 'spd', cls: c }];
  if (above) x.push({ k: 'x_spd_above', v: { fl: a.fl } }); else if (!fast) x.push({ k: 'x_spd_slow', v: { kt: a.kt } });
  return { topic: 'spd', cls: c, scene: { kind: 'solo', cls: c, ac: [a], reveal: { tags: [{ k: bust ? 'tag_spd_bust' : 'tag_spd_free', tone: tone(!bust) }] } },
    q: { k: 'q_spd_bust', v: { t: t, kt: a.kt, fl: a.fl } }, opts: yn(bust), exp: x, tip: 'tip_spd',
    skills: fast && !above ? ['spd.' + c + '.' + t] : [] };
};
G.spdMax = function (h, c, t) {
  t = frOf(h, c, t); var lim = R[c].spd[t], a = mkAc(h, t);
  return { topic: 'spd', cls: c, scene: { kind: 'solo', cls: c, ac: [a], reveal: { tags: [{ k: lim ? 'tag_spd_250' : 'tag_spd_nolim', tone: lim ? 'info' : 'ok' }] } },
    q: { k: 'q_spd_max', v: { t: t, fl: a.fl } },
    opts: [{ k: 'o_spd_none', ok: !lim }, { k: 'o_spd_250', ok: !!lim }, { k: 'o_spd_200', ok: false }, { k: 'o_spd_180', ok: false }],
    exp: [{ topic: 'spd', cls: c }], tip: 'tip_spd', skills: ['spd.' + c + '.' + t] };
};
G.ssrYN = function (h, c) {
  var v = R[c].ssr;
  return { topic: 'ssr', cls: c, scene: { kind: 'solo', cls: c, ac: [mkAc(h, frOf(h, c))], reveal: { tags: [{ k: v ? 'tag_ssr_y' : 'tag_ssr_n', tone: tone(v) }] } },
    q: { k: 'q_ssr' }, opts: yn(v), exp: [{ topic: 'ssr', cls: c }], tip: 'tip_ssr', skills: ['ssr.' + c] };
};

/* "What changes" when a flight goes from class X into class Y. Exactly one true statement. */
function changeStatements(X, Y, t) {
  var a = R[X], b = R[Y], out = [];
  function st(k, truth, skills) { out.push({ k: k, ok: !!truth, skills: skills }); }
  function two(topic) { return [topic + '.' + X + '.' + t, topic + '.' + Y + '.' + t]; }
  st('c_clr_lose', a.clr[t] && !b.clr[t], two('clr')); st('c_clr_gain', !a.clr[t] && b.clr[t], two('clr'));
  st('c_rad_lose', a.rad[t] && !b.rad[t], two('rad')); st('c_rad_gain', !a.rad[t] && b.rad[t], two('rad'));
  st('c_spd_gain', !a.spd[t] && b.spd[t], two('spd')); st('c_spd_lose', a.spd[t] && !b.spd[t], two('spd'));
  st('c_atc_lose', a.svc[t] === 'ATC' && b.svc[t] !== 'ATC', two('svc')); st('c_atc_gain', a.svc[t] !== 'ATC' && b.svc[t] === 'ATC', two('svc'));
  st('c_adv_lose', a.svc[t] === 'ADV' && b.svc[t] !== 'ADV', two('svc')); st('c_adv_gain', a.svc[t] !== 'ADV' && b.svc[t] === 'ADV', two('svc'));
  var pi = t === 'I' ? 'II' : 'IV', pv = t === 'I' ? 'IV' : 'VV';
  function sp(p) { return ['sep.' + X + '.' + p, 'sep.' + Y + '.' + p]; }
  st('c_sepI_lose', a.sep[pi] === 'SEP' && b.sep[pi] !== 'SEP', sp(pi)); st('c_sepI_gain', a.sep[pi] !== 'SEP' && b.sep[pi] === 'SEP', sp(pi));
  if (a.sep[pv] && b.sep[pv]) {
    st('c_sepV_lose', a.sep[pv] === 'SEP' && b.sep[pv] !== 'SEP', sp(pv)); st('c_sepV_gain', a.sep[pv] !== 'SEP' && b.sep[pv] === 'SEP', sp(pv));
  }
  if (t === 'I' && a.vfr !== b.vfr) {
    st('c_vfr_in', !a.vfr && b.vfr, ['perm.' + X, 'perm.' + Y]); st('c_vfr_out', a.vfr && !b.vfr, ['perm.' + X, 'perm.' + Y]);
  }
  return out;
}
G.change = function (h, c) {
  for (var tries = 0; tries < 40; tries++) {
    var i = CLS.indexOf(c), d = h.chance(0.8) ? 1 : 2, j = i + (h.chance(0.5) ? d : -d);
    if (j < 0 || j > 6) continue;
    var rev = h.chance(0.5), X = rev ? CLS[j] : c, Y = rev ? c : CLS[j];
    var t = R[X].vfr && R[Y].vfr ? h.pick(FRS) : 'I';
    var all = changeStatements(X, Y, t);
    var yes = all.filter(function (s) { return s.ok; }), no = all.filter(function (s) { return !s.ok; });
    if (!yes.length || no.length < 3) continue;
    var right = h.pick(yes);
    return { topic: right.skills[0].split('.')[0], cls: Y, shuffle: true,
      scene: { kind: 'cross', cls: X, cls2: Y, ac: [mkAc(h, t)], reveal: {} },
      q: { k: 'q_change', v: { t: t, X: X, Y: Y } },
      opts: [{ k: right.k, ok: true }].concat(h.shuffle(no).slice(0, 3).map(function (s) { return { k: s.k, ok: false }; })),
      exp: [{ k: 'x_change', v: { X: X, Y: Y, t: t, all: yes.map(function (s) { return s.k; }) } }],
      tip: 'tip_step_' + [X, Y].sort().join(''), skills: right.skills };
  }
  return null;
};

/* "Which class is this?" from two clues that together fit exactly one class. */
var CLUES = [
  { k: 'u_ifr_only', f: function (r) { return !r.vfr; }, s: ['perm'] },
  { k: 'u_vv_sep', f: function (r) { return r.sep.VV === 'SEP'; }, s: ['sep.VV'] },
  { k: 'u_iv_sep', f: function (r) { return r.sep.IV === 'SEP'; }, s: ['sep.IV'] },
  { k: 'u_iv_nosep', f: function (r) { return r.vfr && r.ctl && r.sep.IV !== 'SEP'; }, s: ['sep.IV'] },
  { k: 'u_vv_info', f: function (r) { return rel(r.sep.VV) === 'INFO'; }, s: ['sep.VV'] },
  { k: 'u_ii_sep', f: function (r) { return r.sep.II === 'SEP'; }, s: ['sep.II'] },
  { k: 'u_v_clr', f: function (r) { return r.clr.V === 1; }, s: ['clr.V'] },
  { k: 'u_v_noclr', f: function (r) { return r.clr.V === 0; }, s: ['clr.V'] },
  { k: 'u_i_clr', f: function (r) { return r.clr.I === 1; }, s: ['clr.I'] },
  { k: 'u_no_clr', f: function (r) { return r.clr.I === 0; }, s: ['clr.I'] },
  { k: 'u_spd_vonly', f: function (r) { return r.spd.V === 1 && r.spd.I === 0; }, s: ['spd.I', 'spd.V'] },
  { k: 'u_spd_all', f: function (r) { return r.spd.I === 1; }, s: ['spd.I'] },
  { k: 'u_spd_none', f: function (r) { return r.spd.I === 0 && !r.spd.V; }, s: ['spd.I', 'spd.V'] },
  { k: 'u_adv', f: function (r) { return r.svc.I === 'ADV'; }, s: ['svc.I'] },
  { k: 'u_fis_all', f: function (r) { return r.svc.I === 'FIS'; }, s: ['svc.I'] },
  { k: 'u_v_norad', f: function (r) { return r.rad.V === 0; }, s: ['rad.V'] },
  { k: 'u_v_rad', f: function (r) { return r.rad.V === 1; }, s: ['rad.V'] },
  { k: 'u_ctl', f: function (r) { return r.ctl === 1; }, s: ['ctl'] },
  { k: 'u_unctl', f: function (r) { return r.ctl === 0; }, s: ['ctl'] },
  { k: 'u_infop', f: function (r) { return r.sep.IV === 'INFOP'; }, s: ['sep.IV'] }
];
var ALL = skillList();
function fits(clues) { return CLS.filter(function (x) { return clues.every(function (u) { return u.f(R[x]); }); }); }
G.mystery = function (h, c) {
  var mine = CLUES.filter(function (u) { return u.f(R[c]); }), combos = [];
  for (var i = 0; i < mine.length; i++) for (var j = i + 1; j < mine.length; j++) {
    var f = fits([mine[i], mine[j]]);
    if (f.length === 1) combos.push({ u: [mine[i], mine[j]], w: (fits([mine[i]]).length > 1 ? 2 : 0) + (fits([mine[j]]).length > 1 ? 2 : 0) + 1 });
  }
  if (!combos.length) return null;
  var tot = combos.reduce(function (s, x) { return s + x.w; }, 0), roll = h.r() * tot, pickd = combos[0];
  for (var q = 0; q < combos.length; q++) { roll -= combos[q].w; if (roll <= 0) { pickd = combos[q]; break; } }
  var ci = CLS.indexOf(c), others = CLS.filter(function (x) { return x !== c; });
  others.sort(function (x, y) { return Math.abs(CLS.indexOf(x) - ci) - Math.abs(CLS.indexOf(y) - ci); });
  var near = others.slice(0, 2), far = h.pick(others.slice(2));
  var letters = [c].concat(near, [far]).sort();
  var skills = [];
  pickd.u.forEach(function (u) { u.s.forEach(function (s) {
    var parts = s.split('.'), key = parts.length > 1 ? parts[0] + '.' + c + '.' + parts[1] : parts[0] + '.' + c;
    if (skills.indexOf(key) < 0 && ALL.indexOf(key) >= 0) skills.push(key);
  }); });
  var t = h.pick(R[c].vfr ? ['IV', 'II', 'VV'] : ['II']);
  return { topic: skills[0].split('.')[0], cls: c, noShuffle: true,
    scene: { kind: 'pair', cls: '?', geo: h.pick(GEO), ac: pairAc(h, t), reveal: { clsSet: [c] } },
    q: { k: 'q_mystery', v: { clues: pickd.u.map(function (u) { return u.k; }) } },
    opts: letters.map(function (x) { return { k: 'o_cls', v: { c: x }, ok: x === c }; }),
    exp: [{ k: 'x_mystery', v: { c: c } }, { topic: skills[0].split('.')[0], cls: c }], tip: null, skills: skills };
};

/* Bonus: flight exactly at the level where two classes meet vertically (Annex 11 2.6 note / AMC1 SERA.6001). */
G.boundary = function (h) {
  var up = h.pick(CLS), lo = h.pick(CLS.filter(function (x) { return x !== up; }));
  var less = up > lo ? up : lo, fl = h.pick([55, 65, 95, 115, 195, 245]);
  var t = R[up].vfr && R[lo].vfr ? h.pick(FRS) : 'I', a = mkAc(h, t); a.fl = fl;
  var opts = [up, lo].sort().map(function (x) { return { k: 'o_bnd_cls', v: { c: x }, ok: x === less }; });
  opts.push({ k: 'o_bnd_both', ok: false }, { k: 'o_bnd_pilot', ok: false });
  return { topic: 'bonus', cls: less, noShuffle: true,
    scene: { kind: 'stack', cls: up, cls2: lo, fl: fl, ac: [a], reveal: { clsSet: [less] } },
    q: { k: 'q_boundary', v: { up: up, lo: lo, fl: fl } }, opts: opts,
    exp: [{ k: 'x_boundary', v: { less: less, other: less === up ? lo : up } }], tip: 'tip_order', skills: [] };
};

/* which generators can exercise a skill of each topic: [name, weight] */
var BY_TOPIC = {
  perm: [['permWho', 3], ['permSolo', 2], ['mystery', 1]],
  ctl: [['ctlYN', 4], ['mystery', 1]],
  sep: [['sepPair', 5], ['sepYN', 2], ['sepSet', 2], ['change', 1], ['mystery', 2]],
  svc: [['svcSolo', 5], ['change', 1]],
  clr: [['clrSolo', 3], ['clrWho', 3], ['entry', 3], ['change', 2]],
  rad: [['radSolo', 3], ['radWho', 3], ['entry', 2], ['change', 1]],
  spd: [['spdBust', 4], ['spdWho', 3], ['spdMax', 2], ['change', 1], ['mystery', 1]],
  ssr: [['ssrYN', 1]]
};
function forSkill(h, skill) {
  var p = skill.split('.'), list = BY_TOPIC[p[0]];
  for (var tries = 0; tries < 12; tries++) {
    var tot = 0, i; for (i = 0; i < list.length; i++) tot += list[i][1];
    var roll = h.r() * tot, name = list[0][0];
    for (i = 0; i < list.length; i++) { roll -= list[i][1]; if (roll <= 0) { name = list[i][0]; break; } }
    var q = G[name](h, p[1], p[2]);
    if (q) { q.gen = name; if (q.shuffle) q.opts = h.shuffle(q.opts); return q; }
  }
  return null;
}

var API = { CLS: CLS, R: R, PAIRS: PAIRS, FRS: FRS, TOPICS: TOPICS, rel: rel, skillList: skillList, mulberry: mulberry, H: H,
            G: G, forSkill: forSkill, changeStatements: changeStatements, CLUES: CLUES, fits: fits };
if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.ASG = API;
})(typeof window !== 'undefined' ? window : globalThis);
