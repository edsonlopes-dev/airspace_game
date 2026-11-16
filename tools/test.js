/* Checks the rules against an independently typed copy of the course table / ICAO Annex 11 App. 4,
   then generates thousands of questions and verifies each has exactly one correct, correctly-keyed answer. */
'use strict';
const A = require('../src/data.js');
const EN = require('../src/i18n-en.js');
const PT = require('../src/i18n-pt.js');
let fails = 0, checks = 0;
function ok(cond, msg) { checks++; if (!cond) { fails++; if (fails < 40) console.log('FAIL: ' + msg); } }

/* ---- 1. independent table (typed from the course sheet, cross-checked with Annex 11 App. 4) ---- */
const T = {
  A: { fl: 'I', ctl: 'Y', sep: 'SEP', svc: 'ATC', clr: 'Y', rad: 'Y', spd: 'na', ssr: 'Y' },
  B: { fl: 'IV', ctl: 'Y', sep: 'SEP SEP SEP', svc: 'ATC ATC', clr: 'Y Y', rad: 'Y Y', spd: 'na na', ssr: 'Y' },
  C: { fl: 'IV', ctl: 'Y', sep: 'SEP SEP INFO', svc: 'ATC ATC', clr: 'Y Y', rad: 'Y Y', spd: 'na 250', ssr: 'Y' },
  D: { fl: 'IV', ctl: 'Y', sep: 'SEP INFO INFO', svc: 'ATC ATC', clr: 'Y Y', rad: 'Y Y', spd: '250 250', ssr: 'Y' },
  E: { fl: 'IV', ctl: 'Y', sep: 'SEP INFOP INFOP', svc: 'ATC INFOP', clr: 'Y N', rad: 'Y N', spd: '250 250', ssr: 'Y' },
  F: { fl: 'IV', ctl: 'N', sep: 'ADV NONE NONE', svc: 'ADV FIS', clr: 'N N', rad: 'Y N', spd: '250 250', ssr: 'Y' },
  G: { fl: 'IV', ctl: 'N', sep: 'NONE NONE NONE', svc: 'FIS FIS', clr: 'N N', rad: 'Y N', spd: '250 250', ssr: 'N' }
};
const yn = v => (v ? 'Y' : 'N');
for (const c of A.CLS) {
  const r = A.R[c], t = T[c];
  ok((r.vfr ? 'IV' : 'I') === t.fl, c + ' flight types');
  ok(yn(r.ctl) === t.ctl, c + ' controlled');
  ok(A.PAIRS.filter(p => r.sep[p]).map(p => r.sep[p]).join(' ') === t.sep, c + ' separation');
  const frs = A.FRS.filter(f => f in r.svc);
  ok(frs.map(f => r.svc[f]).join(' ') === t.svc, c + ' service');
  ok(frs.map(f => yn(r.clr[f])).join(' ') === t.clr, c + ' clearance');
  ok(frs.map(f => yn(r.rad[f])).join(' ') === t.rad, c + ' radio');
  ok(frs.map(f => (r.spd[f] ? '250' : 'na')).join(' ') === t.spd, c + ' speed');
  ok(yn(r.ssr) === t.ssr, c + ' ssr');
}

/* oracle lookups straight from T */
const O = {
  sep: (c, p) => { const a = T[c].sep.split(' '); return c === 'A' ? (p === 'II' ? a[0] : undefined) : a[A.PAIRS.indexOf(p)]; },
  at: (row, c, f) => { const a = T[c][row].split(' '); return f === 'I' ? a[0] : a[1]; },
  rel: x => (x === 'INFOP' ? 'INFO' : x)
};
const CLUE = {
  u_ifr_only: c => T[c].fl === 'I', u_vv_sep: c => O.sep(c, 'VV') === 'SEP', u_iv_sep: c => O.sep(c, 'IV') === 'SEP',
  u_iv_nosep: c => T[c].ctl === 'Y' && T[c].fl === 'IV' && O.sep(c, 'IV') !== 'SEP',
  u_vv_info: c => O.rel(O.sep(c, 'VV')) === 'INFO', u_ii_sep: c => O.sep(c, 'II') === 'SEP',
  u_v_clr: c => O.at('clr', c, 'V') === 'Y', u_v_noclr: c => O.at('clr', c, 'V') === 'N',
  u_i_clr: c => O.at('clr', c, 'I') === 'Y', u_no_clr: c => !T[c].clr.includes('Y'),
  u_spd_vonly: c => T[c].spd === 'na 250', u_spd_all: c => !T[c].spd.includes('na'), u_spd_none: c => !T[c].spd.includes('250'),
  u_adv: c => O.at('svc', c, 'I') === 'ADV', u_fis_all: c => T[c].svc === 'FIS FIS',
  u_v_norad: c => O.at('rad', c, 'V') === 'N', u_v_rad: c => O.at('rad', c, 'V') === 'Y',
  u_ctl: c => T[c].ctl === 'Y', u_unctl: c => T[c].ctl === 'N', u_infop: c => O.sep(c, 'IV') === 'INFOP'
};
function changeTruth(k, X, Y, f) {
  const g = (row, c) => O.at(row, c, f);
  const pi = f === 'I' ? 'II' : 'IV', pv = f === 'I' ? 'IV' : 'VV';
  const m = {
    c_clr_lose: () => g('clr', X) === 'Y' && g('clr', Y) === 'N', c_clr_gain: () => g('clr', X) === 'N' && g('clr', Y) === 'Y',
    c_rad_lose: () => g('rad', X) === 'Y' && g('rad', Y) === 'N', c_rad_gain: () => g('rad', X) === 'N' && g('rad', Y) === 'Y',
    c_spd_gain: () => g('spd', X) === 'na' && g('spd', Y) === '250', c_spd_lose: () => g('spd', X) === '250' && g('spd', Y) === 'na',
    c_atc_lose: () => g('svc', X) === 'ATC' && g('svc', Y) !== 'ATC', c_atc_gain: () => g('svc', X) !== 'ATC' && g('svc', Y) === 'ATC',
    c_adv_lose: () => g('svc', X) === 'ADV' && g('svc', Y) !== 'ADV', c_adv_gain: () => g('svc', X) !== 'ADV' && g('svc', Y) === 'ADV',
    c_sepI_lose: () => O.sep(X, pi) === 'SEP' && O.sep(Y, pi) !== 'SEP', c_sepI_gain: () => O.sep(X, pi) !== 'SEP' && O.sep(Y, pi) === 'SEP',
    c_sepV_lose: () => O.sep(X, pv) === 'SEP' && O.sep(Y, pv) !== 'SEP', c_sepV_gain: () => O.sep(X, pv) !== 'SEP' && O.sep(Y, pv) === 'SEP',
    c_vfr_in: () => T[X].fl === 'I' && T[Y].fl === 'IV', c_vfr_out: () => T[X].fl === 'IV' && T[Y].fl === 'I'
  };
  return m[k]();
}
/* expected correct option key per generator, derived from T only */
function expected(q) {
  const c = q.cls, v = q.q.v || {}, ac = q.scene.ac;
  const whoK = (i, vv) => (i && vv ? 'o_both' : i ? 'o_onlyI' : vv ? 'o_onlyV' : 'o_neither');
  const f = v.t;
  switch (q.gen) {
    case 'permWho': return T[c].fl === 'IV' ? 'o_both' : 'o_onlyI';
    case 'permSolo': return T[c].fl === 'IV' ? 'yes' : 'no';
    case 'ctlYN': return T[c].ctl === 'Y' ? 'yes' : 'no';
    case 'sepPair': return 'o_sep_' + O.rel(O.sep(c, v.p));
    case 'sepYN': return O.sep(c, v.p) === 'SEP' ? 'yes' : 'no';
    case 'svcSolo': return 'o_svc_' + O.at('svc', c, f);
    case 'clrSolo': return O.at('clr', c, f) === 'Y' ? 'yes' : 'no';
    case 'radSolo': return O.at('rad', c, f) === 'Y' ? 'yes' : 'no';
    case 'clrWho': return whoK(O.at('clr', c, 'I') === 'Y', O.at('clr', c, 'V') === 'Y');
    case 'radWho': return whoK(O.at('rad', c, 'I') === 'Y', O.at('rad', c, 'V') === 'Y');
    case 'spdWho': return whoK(O.at('spd', c, 'I') === '250', O.at('spd', c, 'V') === '250');
    case 'entry': { const cl = O.at('clr', c, f) === 'Y', ra = O.at('rad', c, f) === 'Y';
      return cl && ra ? 'o_ent_both' : ra ? 'o_ent_rad' : cl ? 'o_ent_clr' : 'o_ent_none'; }
    case 'spdBust': return ac[0].kt > 250 && ac[0].fl < 100 && O.at('spd', c, f) === '250' ? 'yes' : 'no';
    case 'spdMax': return O.at('spd', c, f) === '250' ? 'o_spd_250' : 'o_spd_none';
    case 'ssrYN': return T[c].ssr === 'Y' ? 'yes' : 'no';
  }
  return null;
}

/* ---- 2. generate and verify ---- */
const SK = A.skillList(), covered = {}, genCount = {};
function render(L, o) { const x = L[o.k]; return typeof x === 'function' ? x(o.v || {}, k => L[k]) : x; }
function verify(q, label) {
  genCount[q.gen] = (genCount[q.gen] || 0) + 1;
  const right = q.opts.filter(o => o.ok);
  ok(right.length === 1, label + ' has ' + right.length + ' correct options');
  ok(q.opts.length >= 2 && q.opts.length <= 4, label + ' option count');
  for (const L of [EN, PT]) {
    const texts = q.opts.map(o => render(L, o));
    ok(texts.every(s => typeof s === 'string' && s.length > 0), label + ' option text missing ' + JSON.stringify(q.opts.map(o => o.k)));
    ok(new Set(texts).size === texts.length, label + ' duplicate options: ' + texts.join(' | '));
    const qt = render(L, q.q); ok(typeof qt === 'string' && qt.length > 10 && !/undefined/.test(qt), label + ' question text: ' + qt);
    for (const e of q.exp) {
      const s = e.k ? render(L, e) : L.rule(e.topic, e.cls);
      ok(typeof s === 'string' && s.length > 10 && !/undefined/.test(s), label + ' explanation ' + JSON.stringify(e) + ' -> ' + s);
    }
    if (q.tip) { const tp = L[q.tip] || L[q.tip.replace(/_[A-G]{1,2}$/, '')]; ok(q.tip.startsWith('tip_step_') || !!tp, label + ' tip ' + q.tip); }
    const tags = (q.scene.reveal.tags || []).reduce((a, x) => a.concat(x), []);
    for (const tg of tags) ok(typeof L[tg.k] === 'string', label + ' tag ' + tg.k);
    if (v_clues(q)) for (const k of q.q.v.clues) ok(typeof L[k] === 'string', label + ' clue ' + k);
  }
  for (const s of q.skills) { ok(SK.includes(s), label + ' unknown skill ' + s); covered[s] = 1; }
  ok(q.scene.ac.every(a => a.kt >= 60 && a.kt <= 350 && a.fl >= 40 && a.fl <= 250), label + ' aircraft data');
  if (q.scene.ac.some(a => !A.R[q.scene.cls] ? false : a.fr === 'V' && !A.R[q.scene.cls].vfr) && q.topic !== 'perm') ok(false, label + ' VFR placed in class A');
  const exp = expected(q);
  if (exp) ok(right[0].k === exp, label + ' answer ' + right[0].k + ' expected ' + exp);
  if (q.gen === 'sepSet') {
    const p = q.q.v.p, r = q.q.k.replace('q_sep_set_', '');
    const want = A.CLS.filter(c => O.sep(c, p) !== undefined && O.rel(O.sep(c, p)) === r).join('');
    ok(right[0].v.set.join('') === want, label + ' set ' + right[0].v.set.join('') + ' expected ' + want);
  }
  if (q.gen === 'change') {
    const { X, Y, t } = q.q.v;
    for (const o of q.opts) ok(changeTruth(o.k, X, Y, t) === o.ok, label + ' ' + X + '>' + Y + ' ' + t + ' statement ' + o.k + ' marked ' + o.ok);
    ok(!(t === 'V' && (X === 'A' || Y === 'A')), label + ' VFR through class A');
  }
  if (q.gen === 'mystery') {
    const fit = A.CLS.filter(c => q.q.v.clues.every(k => CLUE[k](c)));
    ok(fit.length === 1 && fit[0] === right[0].v.c, label + ' clues ' + q.q.v.clues.join('+') + ' fit ' + fit.join('') + ' answer ' + right[0].v.c);
    ok(new Set(q.opts.map(o => o.v.c)).size === 4, label + ' class options');
  }
  if (q.gen === 'boundary') {
    const { up, lo } = q.q.v; ok(right[0].v.c === (up > lo ? up : lo), label + ' boundary');
  }
}
function v_clues(q) { return q.q.v && q.q.v.clues; }

let n = 0;
for (let seed = 1; seed <= 400; seed++) {
  const h = A.H(A.mulberry(seed * 7919));
  for (const s of SK) { const q = A.forSkill(h, s); ok(!!q, 'no question for ' + s); if (q) { verify(q, s + '#' + seed + ' ' + q.gen); n++; } }
  const b = A.G.boundary(h); b.gen = 'boundary'; verify(b, 'boundary#' + seed); n++;
}
/* every generator directly, every class */
for (let seed = 1; seed <= 200; seed++) {
  const h = A.H(A.mulberry(seed * 104729));
  for (const g of Object.keys(A.G)) for (const c of A.CLS) for (const sub of [undefined, 'I', 'V', 'II', 'IV', 'VV']) {
    const q = A.G[g](h, c, sub); if (q) { q.gen = g; verify(q, g + '/' + c + '/' + sub + '#' + seed); n++; }
  }
}
ok(SK.every(s => covered[s]), 'skills never exercised: ' + SK.filter(s => !covered[s]).join(', '));
/* both languages define the same keys */
for (const k of Object.keys(EN)) ok(k in PT, 'PT missing key ' + k);
for (const k of Object.keys(PT)) ok(k in EN, 'EN missing key ' + k);
for (const c of A.CLS) for (const tp of A.TOPICS) for (const L of [EN, PT]) ok(L.rule(tp, c).length > 15, 'rule text ' + tp + ' ' + c);

console.log('questions generated: ' + n + ', checks: ' + checks + ', failures: ' + fails);
console.log('per generator: ' + JSON.stringify(genCount));
process.exit(fails ? 1 : 0);
