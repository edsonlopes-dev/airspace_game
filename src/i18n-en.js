/* English strings. Values are strings or functions of the question variables. */
(function (root) {
'use strict';
var P = { II: 'IFR–IFR', IV: 'IFR–VFR', VV: 'VFR–VFR' };
function lc(s) { return /^.[a-zà-ÿ ]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s; }
function fr(t) { return t === 'I' ? 'IFR' : 'VFR'; }
function fl(n) { return 'FL' + ('00' + n).slice(-3); }
function list(a) { return a.length === 1 ? a[0] : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }
function cls(a) { return (a.length > 1 ? 'classes ' : 'class ') + list(a); }
var PW = { II: 'two IFR flights', IV: 'an IFR flight and a VFR flight', VV: 'two VFR flights' };
var PS = { II: 'IFR flights from other IFR flights', IV: 'IFR flights from VFR flights', VV: 'VFR flights from other VFR flights' };
var RELW = { SEP: 'ATC separation', INFO: 'traffic information only', ADV: 'an advisory service', NONE: 'nothing but see and avoid' };

var L = {
  P: P, fr: fr, fl: fl, list: list,
  /* ---- questions ---- */
  q_perm_who: 'Both flights want to operate in this airspace. Which of them is permitted here?',
  q_perm_solo: 'This VFR flight wants to fly through this airspace. Is VFR flight permitted here?',
  q_ctl: 'Is this controlled airspace?',
  q_sep_pair: function (v) { return 'These are ' + PW[v.p] + ' on converging tracks. What do air traffic services provide between them?'; },
  q_sep_yn: function (v) { return 'These are ' + PW[v.p] + '. Will ATC separate them from each other?'; },
  q_sep_set_SEP: function (v) { return 'In which classes does ATC separate ' + PS[v.p] + '?'; },
  q_sep_set_INFO: function (v) { return 'In which classes is there traffic information, but no separation, between ' + PW[v.p] + '?'; },
  q_sep_set_ADV: function () { return 'In which class do IFR flights get an advisory service instead of ATC separation from other IFR flights?'; },
  q_sep_set_NONE: function (v) { return 'In which classes is see and avoid the only protection between ' + PW[v.p] + ' (no separation, no ATC traffic information)?'; },
  q_svc: function (v) { return 'Which air traffic service does this ' + fr(v.t) + ' flight receive in this airspace?'; },
  q_clr: function (v) { return 'Does this ' + fr(v.t) + ' flight need an ATC clearance to fly in this airspace?'; },
  q_clr_who: 'Which of these flights needs an ATC clearance in this airspace?',
  q_rad: function (v) { return 'Must this ' + fr(v.t) + ' flight keep continuous two-way radio contact in this airspace?'; },
  q_rad_who: 'Which of these flights must keep continuous two-way radio contact here?',
  q_spd_who: 'Both flights are faster than 250 kt IAS below FL100. Which of them is breaking the speed limit?',
  q_entry: function (v) { return 'This ' + fr(v.t) + ' flight is about to enter this airspace. What does it need?'; },
  q_spd_bust: function (v) { return 'This ' + fr(v.t) + ' flight is doing ' + v.kt + ' kt IAS at ' + fl(v.fl) + '. Is it breaking the speed limit?'; },
  q_spd_max: function (v) { return 'What is the speed limit for this ' + fr(v.t) + ' flight at ' + fl(v.fl) + ' in this airspace?'; },
  q_ssr: 'According to the course table, is an SSR transponder required in this airspace?',
  q_change: function (v) { return 'This ' + fr(v.t) + ' flight leaves class ' + v.X + ' and enters class ' + v.Y + '. Which statement is true?'; },
  q_mystery: 'Which airspace class matches both facts?',
  q_boundary: function (v) { return 'This flight cruises at exactly ' + fl(v.fl) + ', the level where class ' + v.up + ' (above) meets class ' + v.lo + ' (below). Which rules apply to it?'; },
  /* ---- options ---- */
  yes: 'Yes', no: 'No',
  o_both: 'Both flights', o_onlyI: 'Only the IFR flight', o_onlyV: 'Only the VFR flight', o_neither: 'Neither flight',
  o_sep_SEP: 'ATC separation', o_sep_INFO: 'Traffic information from ATC, but no separation',
  o_sep_ADV: 'Advisory service: separation as far as practical', o_sep_NONE: 'No separation: pilots see and avoid',
  o_set: function (v) { return v.set.length === 1 ? 'Only ' + v.set[0] : list(v.set); },
  o_svc_ATC: 'Air traffic control service', o_svc_ADV: 'Air traffic advisory service plus flight information service',
  o_svc_INFOP: 'Traffic information as far as practical, no ATC service', o_svc_FIS: 'Flight information service only',
  o_svc_NONE: 'No air traffic service at all',
  o_ent_both: 'ATC clearance and two-way radio contact', o_ent_rad: 'Two-way radio contact, but no clearance',
  o_ent_clr: 'ATC clearance, but no radio contact', o_ent_none: 'Neither clearance nor radio contact',
  o_spd_none: 'No speed limit', o_spd_250: '250 kt IAS', o_spd_200: '200 kt IAS', o_spd_180: '180 kt IAS',
  o_cls: function (v) { return 'Class ' + v.c; }, o_bnd_cls: function (v) { return 'Class ' + v.c + ' rules'; },
  o_bnd_both: 'The rules of both classes at once', o_bnd_pilot: 'Whichever class the pilot prefers',
  c_clr_lose: 'It no longer needs an ATC clearance', c_clr_gain: 'It now needs an ATC clearance',
  c_rad_lose: 'Two-way radio contact is no longer required', c_rad_gain: 'Two-way radio contact becomes mandatory',
  c_spd_gain: 'The 250 kt limit below FL100 now applies to it', c_spd_lose: 'The 250 kt limit below FL100 no longer applies to it',
  c_atc_lose: 'It no longer receives ATC service', c_atc_gain: 'It now receives ATC service',
  c_adv_lose: 'It no longer receives the advisory service', c_adv_gain: 'It now receives an air traffic advisory service',
  c_sepI_lose: 'ATC no longer separates it from IFR flights', c_sepI_gain: 'ATC now separates it from IFR flights',
  c_sepV_lose: 'ATC no longer separates it from VFR flights', c_sepV_gain: 'ATC now separates it from VFR flights',
  c_vfr_in: 'VFR flights may now share the airspace with it', c_vfr_out: 'VFR flights are no longer permitted around it',
  /* ---- clues ---- */
  u_ifr_only: 'Only IFR flights are permitted.', u_vv_sep: 'ATC separates VFR flights from other VFR flights.',
  u_iv_sep: 'ATC separates IFR flights from VFR flights.',
  u_iv_nosep: 'It is controlled airspace, but ATC does not separate IFR from VFR.',
  u_vv_info: 'Between two VFR flights there is traffic information, but no separation.',
  u_ii_sep: 'ATC separates IFR flights from other IFR flights.', u_v_clr: 'VFR flights need an ATC clearance.',
  u_v_noclr: 'VFR flights are permitted and need no ATC clearance.', u_i_clr: 'IFR flights need an ATC clearance.',
  u_no_clr: 'No flight needs an ATC clearance.', u_spd_vonly: 'The 250 kt limit applies to VFR flights but not to IFR flights.',
  u_spd_all: 'The 250 kt limit below FL100 applies to every flight.', u_spd_none: 'No 250 kt speed limit applies to any flight.',
  u_adv: 'IFR flights receive an air traffic advisory service, not ATC.',
  u_fis_all: 'Every flight, IFR included, receives flight information service only.',
  u_v_norad: 'VFR flights are permitted and need no radio contact.', u_v_rad: 'VFR flights must keep two-way radio contact.',
  u_ctl: 'It is controlled airspace.', u_unctl: 'It is uncontrolled airspace.',
  u_infop: 'Traffic information about VFR flights is given only as far as practical.',
  /* ---- rules ---- */
  rule: function (topic, c) {
    var all = 'Class ' + c + ': ';
    switch (topic) {
      case 'perm': return c === 'A' ? 'Class A: IFR flights only. VFR is not permitted.' : all + 'both IFR and VFR flights are permitted.';
      case 'ctl': return c < 'F' ? all + 'controlled airspace. Classes A to E are controlled.' : all + 'uncontrolled airspace. Classes F and G are uncontrolled.';
      case 'sep': return {
        A: 'Class A: every flight is IFR and ATC separates all of them from each other.',
        B: 'Class B: ATC separates all flights from each other, even VFR from VFR.',
        C: 'Class C: IFR is separated from IFR and from VFR. Two VFR flights only get traffic information about each other, with avoidance advice on request.',
        D: 'Class D: only IFR is separated from IFR. IFR–VFR and VFR–VFR get traffic information, with avoidance advice on request.',
        E: 'Class E: only IFR is separated from IFR. Traffic information about VFR is given as far as practical, because VFR may not be in radio contact at all.',
        F: 'Class F: no ATC separation. Participating IFR flights get an advisory service that separates IFR from IFR as far as practical. Nothing between IFR–VFR or VFR–VFR.',
        G: 'Class G: no separation of any kind. Pilots see and avoid, with flight information service on request.' }[c];
      case 'svc': return {
        A: 'Class A: all flights receive air traffic control service.',
        B: 'Class B: all flights, IFR and VFR, receive air traffic control service.',
        C: 'Class C: all flights receive ATC service. For VFR that means separation from IFR plus traffic information about other VFR.',
        D: 'Class D: all flights receive ATC service. IFR is separated from IFR; everyone else gets traffic information.',
        E: 'Class E: IFR receives ATC service. VFR receives only traffic information as far as practical.',
        F: 'Class F: IFR receives an air traffic advisory service plus flight information service. VFR receives flight information service only.',
        G: 'Class G: every flight receives flight information service only, on request.' }[c];
      case 'clr': return c < 'E' ? all + 'every flight is subject to an ATC clearance.'
        : c === 'E' ? 'Class E: IFR needs an ATC clearance. VFR does not.' : all + 'no ATC clearance is required. It is uncontrolled airspace.';
      case 'rad': return c < 'E' ? all + 'continuous two-way radio contact is required for all flights.'
        : all + 'IFR must keep continuous two-way radio contact. VFR is not required to.';
      case 'spd': return c < 'C' ? all + 'no speed limit applies to any flight.'
        : c === 'C' ? 'Class C: 250 kt IAS below FL100 (10 000 ft AMSL) applies to VFR only. IFR has no limit.'
        : all + '250 kt IAS below FL100 (10 000 ft AMSL) applies to all flights.';
      case 'ssr': return c === 'G' ? 'Course table: no SSR transponder requirement in class G.' : 'Course table: SSR transponder required in class ' + c + '.';
    }
    return '';
  },
  x_sep_set: function (v) { return P[v.p] + ': ' + RELW[v.r] + ' in ' + cls(v.set) + '.'; },
  x_spd_above: function (v) { return 'At ' + fl(v.fl) + ' the flight is not below FL100, so the 250 kt limit cannot apply.'; },
  x_spd_slow: function (v) { return v.kt + ' kt does not exceed 250 kt, so no limit is broken in any class.'; },
  x_change: function (v, t) { return 'For this ' + fr(v.t) + ' flight, ' + v.X + ' → ' + v.Y + ' means: ' + v.all.map(function (k) { return lc(t(k)); }).join('; ') + '.'; },
  x_mystery: function (v) { return 'Only class ' + v.c + ' fits both facts.'; },
  x_boundary: function (v) { return 'At a common level a flight follows the less restrictive class and gets its services. Class ' + v.less + ' is less restrictive than class ' + v.other + ' (ICAO Annex 11, 2.6).'; },
  /* ---- memory tips ---- */
  tip_AB: 'A to B: the only change is that VFR is let in.',
  tip_ctl: 'A to E are controlled. F and G are not.',
  tip_sep: 'Separation shrinks one step per class: B everyone, C all but VFR–VFR, D and E only IFR–IFR, F advisory, G nothing.',
  tip_svc: 'ATC service ends with controlled airspace: F gives IFR an advisory service, G gives FIS only.',
  tip_clr: 'Clearance: everyone in A to D, only IFR in E, nobody in F and G.',
  tip_rad: 'IFR needs radio in every class. VFR needs it only where it needs a clearance: B, C and D.',
  tip_spd: 'The 250 kt limit covers flights that ATC does not separate from everyone: VFR in C, and all flights from D down.',
  tip_ssr: 'This row comes from your course table. ICAO sets no transponder rule per class; national rules do.',
  tip_step_AB: 'A → B: VFR is admitted.',
  tip_step_BC: 'B → C: VFR–VFR drops from separation to traffic information, and VFR gets the 250 kt limit.',
  tip_step_CD: 'C → D: IFR–VFR drops from separation to traffic information, and IFR gets the 250 kt limit too.',
  tip_step_DE: 'D → E: VFR no longer needs a clearance or radio, so traffic information becomes as far as practical.',
  tip_step_EF: 'E → F: ATC ends. IFR gets an advisory service and nobody needs a clearance.',
  tip_step_FG: 'F → G: the advisory service goes. FIS only.',
  tip_order: 'Restrictiveness runs from A (most) to G (least).',
  /* ---- scene tags ---- */
  tag_allowed: 'PERMITTED', tag_notallowed: 'NOT PERMITTED', tag_svc_ATC: 'ATC SERVICE', tag_svc_INFOP: 'TRAFFIC INFO*',
  tag_svc_ADV: 'ADVISORY + FIS', tag_svc_FIS: 'FIS ONLY', tag_clr_y: 'CLEARANCE', tag_clr_n: 'NO CLEARANCE',
  tag_rad_y: 'RADIO', tag_rad_n: 'NO RADIO', tag_spd_bust: 'OVER THE LIMIT', tag_spd_free: 'WITHIN LIMITS',
  tag_spd_250: 'MAX 250 KT', tag_spd_nolim: 'NO SPEED LIMIT', tag_ssr_y: 'SSR REQUIRED', tag_ssr_n: 'NO SSR',
  /* ---- interface ---- */
  app_name: 'Airspace A–G', pitch: 'Know every cell of the A to G table.', tagline: 'IFR and VFR traffic scenarios for the seven ATS airspace classes.',
  home_train: 'Training', home_train_d: '10 scenarios drawn from your weakest cells. The rule is explained after every answer.',
  home_check: 'Checkride', home_check_d: '20 timed scenarios across every class and topic. 18 to pass, 20 for a flawless run.',
  home_table: 'Study table', home_table_d: 'The full A to G table, and how well you know each cell.',
  mastery: 'Mastery', cells: 'cells', ranks: ['Student pilot', 'Private pilot', 'Commercial pilot', 'Airline captain', 'Airspace ace'],
  best_streak: 'Best streak', best_check: 'Best checkride', none_yet: 'not flown yet',
  tp_perm: 'Flight types', tp_ctl: 'Controlled', tp_sep: 'Separation', tp_svc: 'Service', tp_clr: 'ATC clearance',
  tp_rad: 'Radio', tp_spd: 'Speed limit', tp_ssr: 'SSR', tp_bonus: 'Bonus',
  ssr_toggle: 'Include the SSR row from my course table',
  pts: 'pts', question: 'Question', score: 'Score', streak: 'Streak', next: 'Next', finish: 'See results', quit: 'Quit',
  correct: 'Correct', wrong: 'Not quite', timeup: 'Time is up', memo: 'Remember',
  airspace_class: 'Airspace class', controlled: 'Controlled', uncontrolled: 'Uncontrolled', above: 'above', below: 'below',
  res_train: 'Training complete', res_pass: 'Checkride passed', res_flawless: 'Flawless checkride', res_fail: 'Checkride not passed',
  res_acc: 'Correct', res_score: 'Score', res_gain: 'Mastered', res_review: 'Review your misses',
  res_none: 'No misses. Every answer was right.', your_answer: 'You answered', right_answer: 'Correct answer',
  no_answer: 'no answer', again: 'Fly again', home: 'Home',
  tbl_ref: 'Rules', tbl_my: 'My mastery', tbl_tap: 'Tap a cell to read its rule.',
  lg_SEP: 'ATC separation', lg_INFO: 'traffic information', lg_INFOP: 'traffic information as far as practical',
  lg_ADV: 'advisory service', lg_NONE: 'no separation', lg_ATC: 'air traffic control service', lg_FIS: 'flight information service',
  lg_250: '250 kt IAS below FL100', lg_na: 'no limit',
  m0: 'Not tested', m1: 'Learning', m2: 'Mastered', mx: 'Missed',
  about: 'Sources and notes',
  src: [
    'The rules follow ICAO Annex 11 (15th edition, 2018), Appendix 4. EU SERA Appendix 4 and your course table give the same values.',
    'SSR is not an ICAO requirement per class. That row follows your course table: required in A to F, not in G. National rules decide it. In Portugal, AIP GEN 1.5 requires a transponder in classes C and D, and for IFR in class G.',
    'Radio in F and G: ICAO requires continuous two-way radio for IFR. EU SERA only requires IFR to be able to establish contact there, unless inside a radio mandatory zone.',
    'Speed limit: 250 kt IAS below 10 000 ft AMSL. Where the transition altitude is lower than that, FL100 is used instead, as in this game.',
    'States can deviate from ICAO. Check the AIP of the country you fly in.'
  ],
  reset: 'Reset progress', reset_q: 'Erase all progress on this device?', reset_yes: 'Erase', cancel: 'Cancel', close: 'Close',
  sound: 'Sound', lang: 'Português', time: 'Time', legend: 'Legend'
};
root.ASG_I18N = root.ASG_I18N || {}; root.ASG_I18N.en = L;
if (typeof module !== 'undefined' && module.exports) module.exports = L;
})(typeof window !== 'undefined' ? window : globalThis);
