/* The radar scope: aircraft, class badge, and the reveal after each answer. */
var ASG_Scene = (function () {
'use strict';
var el = null, tr = null, spec = null, raf = 0, t0 = 0, dur = 12000, revealed = false, revealAt = 0;
var acs = [], flip = false, W = 1, Hh = 1, still = false;

/* top-down silhouettes, nose up, 48x48 */
var PLANES = {
  jet: '<path d="M24 3c2 0 3 4 3 8v8l17 10v3l-17-4.5V38l6 5v2l-9-2-9 2v-2l6-5V27.500L4 32v-3l17-10v-8c0-4 1-8 3-8z"/><rect x="11.500" y="22" width="3.200" height="6.500" rx="1.500"/><rect x="33.300" y="22" width="3.200" height="6.500" rx="1.500"/>',
  biz: '<path d="M24 3c1.600 0 2.400 4 2.400 8v10L41 31v2.500L26.400 29l-.2 7 4.800 4.500v2L24 41l-7 1.500v-2l4.800-4.500-.2-7L7 33.500V31l14.600-10V11c0-4 .8-8 2.400-8z"/><rect x="17.600" y="29.500" width="2.800" height="6.500" rx="1.300"/><rect x="27.600" y="29.500" width="2.800" height="6.500" rx="1.300"/>',
  tprop: '<path d="M24 4c1.800 0 2.600 4 2.600 7v7L45 19v4l-18.400 1.500L26 37l6 2v3l-8-.5-8 .5v-3l6-2-.6-12.500L3 23v-4l18.400-1v-7c0-3 .8-7 2.600-7z"/><rect x="11.500" y="13.500" width="3.400" height="9.500" rx="1.600"/><rect x="33.100" y="13.500" width="3.400" height="9.500" rx="1.600"/><rect x="8.500" y="12.600" width="9.400" height="1.200"/><rect x="30.100" y="12.600" width="9.400" height="1.200"/>',
  light: '<path d="M24 6c1.500 0 2 3 2 5v5l19 .5c1 1.500 1 3 0 4.500L26 22l-.8 15 5.800 1v3l-7 1-7-1v-3l5.800-1L22 22 3 21c-1-1.500-1-3 0-4.500L22 16v-5c0-2 .5-5 2-5z"/><rect x="17.500" y="4.200" width="13" height="1.400" rx=".7"/>',
  heli: '<path d="M24 10c4 0 5.500 4 5.500 8 0 5-2.500 8-4.300 9l-.4 13H28v2h-8v-2h3.200l-.4-13c-1.800-1-4.300-4-4.300-9 0-4 1.500-8 5.500-8z"/><circle cx="24" cy="18" r="15.500" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="2 3" opacity=".7"/><rect x="8" y="17.300" width="32" height="1.400" rx=".7"/><rect x="23.300" y="2" width="1.400" height="32" rx=".7"/>'
};
function planeSvg(m) {
  return '<svg class="plane-svg" viewBox="0 0 48 48" aria-hidden="true"><line class="trail" x1="24" y1="48" x2="24" y2="104"/>' +
         '<g fill="currentColor">' + PLANES[m] + '</g></svg>';
}
var BG = '<svg class="bg" aria-hidden="true"><defs><pattern id="asgGrid" width="32" height="32" patternUnits="userSpaceOnUse">' +
  '<path d="M32 0H0V32" fill="none" class="gridline"/></pattern></defs><rect width="100%" height="100%" fill="url(#asgGrid)"/>' +
  '<circle class="ring" cx="50%" cy="50%" r="60" fill="none"/><circle class="ring" cx="50%" cy="50%" r="125" fill="none"/>' +
  '<circle class="ring" cx="50%" cy="50%" r="200" fill="none"/><line id="asgLine" class="linkline" x1="0" y1="0" x2="0" y2="0"/></svg>';

function layout(sp) {
  if (sp.kind === 'pair') {
    if (sp.geo === 'headon') return [{ s: [12, 48], h: [29, 48], d: 90 }, { s: [88, 48], h: [71, 48], d: 270 }];
    if (sp.geo === 'crossing') return [{ s: [10, 60], h: [28, 50], d: 62 }, { s: [90, 60], h: [72, 50], d: 298 }];
    return [{ s: [5, 48], h: [26, 48], d: 90 }, { s: [56, 48], h: [70, 48], d: 90 }];
  }
  if (sp.kind === 'cross' || sp.kind === 'enter') return [{ s: [8, 52], h: [31, 52], d: 90, x: [69, 52] }];
  return [{ s: [10, 50], h: [42, 50], d: 90 }];
}
function fl(n) { return 'FL' + ('00' + n).slice(-3); }
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
var LINK = { SEP: ['SEP', 'ok'], INFO: ['INFO', 'info'], INFOP: ['INFO*', 'info'], ADV: ['ADV', 'warn'], NONE: ['—', 'bad'] };

function badge(side, letter, id) {
  return '<div class="badge ' + side + '" id="' + id + '"><div class="lbl" data-l="airspace_class"></div>' +
         '<div class="ltr">' + esc(letter) + '</div><div class="sub"></div></div>';
}
function build() {
  var sp = spec, L = layout(sp), h = BG;
  if (!still) h += '<div class="sweep"></div>';
  if (sp.kind === 'cross') h += '<div class="zone right"></div><div class="bound"></div>' + badge('left', sp.cls, 'asgB1') + badge('right', sp.cls2, 'asgB2');
  else if (sp.kind === 'enter') h += '<div class="zone left out"></div><div class="bound"></div>' + badge('right', sp.cls, 'asgB2');
  else if (sp.kind === 'stack') h += '<div class="badge right stack" id="asgB2"><div class="lbl" data-l="airspace_class"></div>' +
      '<div class="row"><span class="ltr">' + sp.cls + '</span><span class="lv" data-l="above"></span></div>' +
      '<div class="lvl">' + fl(sp.fl) + '</div>' +
      '<div class="row"><span class="ltr">' + sp.cls2 + '</span><span class="lv" data-l="below"></span></div><div class="sub"></div></div>';
  else h += badge('right', sp.cls, 'asgB2');
  sp.ac.forEach(function (a, i) {
    h += '<div class="ac ' + (a.fr === 'I' ? 'ifr' : 'vfr') + (sp.ac.length === 1 ? ' focus' : '') + '" id="asgAc' + i + '">' +
         '<div class="plane">' + planeSvg(a.model) + '</div><div class="fr">' + (a.fr === 'I' ? 'IFR' : 'VFR') + '</div>' +
         '<div class="dat">' + a.kt + ' kt<br>' + fl(a.fl) + '</div><div class="tags"></div></div>';
  });
  if (sp.kind === 'pair' && sp.reveal && sp.reveal.link) h += '<div class="link" id="asgLink"><span class="tagchip q">?</span></div>';
  el.innerHTML = h;
  acs = sp.ac.map(function (a, i) {
    var g = L[i], m = function (p) { return flip ? [100 - p[0], p[1]] : p; };
    var node = el.querySelector('#asgAc' + i), d = flip ? (360 - g.d) % 360 : g.d;
    node.querySelector('.plane').style.transform = 'rotate(' + d + 'deg)';
    return { node: node, s: m(g.s), h: m(g.h), x: g.x ? m(g.x) : null, ph: i * 2.1 };
  });
  relabel();
}
function relabel() {
  if (!el || !spec) return;
  [].forEach.call(el.querySelectorAll('[data-l]'), function (n) { n.textContent = tr(n.getAttribute('data-l')); });
  if (!revealed) return;
  var rv = spec.reveal || {};
  acs.forEach(function (a, i) {
    var tg = (rv.tags || [])[i]; if (!tg) return;
    a.node.querySelector('.tags').innerHTML = [].concat(tg).map(function (x) {
      return '<span class="tagchip t-' + x.tone + '">' + esc(tr(x.k)) + '</span>';
    }).join('');
  });
  var lk = el.querySelector('#asgLink');
  if (lk && rv.link) lk.innerHTML = '<span class="tagchip t-' + LINK[rv.link][1] + '">' + LINK[rv.link][0] + '</span>';
  var b2 = el.querySelector('#asgB2'), b1 = el.querySelector('#asgB1');
  function sub(node, c) {
    if (!node || !ASG.R[c]) return;
    var s = node.querySelector('.sub'); s.textContent = tr(ASG.R[c].ctl ? 'controlled' : 'uncontrolled');
    s.className = 'sub ' + (ASG.R[c].ctl ? 'c' : 'u');
  }
  if (spec.kind === 'stack') {
    [].forEach.call(b2.querySelectorAll('.row'), function (r) { r.classList.toggle('win', r.querySelector('.ltr').textContent === rv.clsSet[0]); });
  } else if (spec.cls === '?' && rv.clsSet) {
    b2.querySelector('.ltr').textContent = rv.clsSet.length > 3 ? rv.clsSet[0] + '–' + rv.clsSet[rv.clsSet.length - 1] : rv.clsSet.join(' ');
    b2.classList.toggle('multi', rv.clsSet.length > 1);
    if (rv.clsSet.length === 1) sub(b2, rv.clsSet[0]);
  } else { sub(b2, spec.kind === 'cross' ? spec.cls2 : spec.cls); sub(b1, spec.cls); }
}
function ease(x) { return 1 - (1 - x) * (1 - x); }
function frame(now) {
  raf = 0; if (!el || !spec || !el.isConnected) return;
  var t = now - t0, k = ease(Math.min(1, t / dur));
  acs.forEach(function (a) {
    var x = a.s[0] + (a.h[0] - a.s[0]) * k, y = a.s[1] + (a.h[1] - a.s[1]) * k;
    if (revealed && a.x) { var r = ease(Math.min(1, (now - revealAt) / 1400)); x += (a.x[0] - x) * r; y += (a.x[1] - y) * r; }
    if (!still) y += Math.sin(now / 900 + a.ph) * 0.5;
    a.px = x; a.py = y;
    a.node.style.transform = 'translate(' + (x * W / 100).toFixed(1) + 'px,' + (y * Hh / 100).toFixed(1) + 'px)';
    a.node.style.opacity = Math.min(1, t / 400);
  });
  var line = el.querySelector('#asgLine'), lk = el.querySelector('#asgLink');
  if (lk && acs.length === 2) {
    line.setAttribute('x1', acs[0].px + '%'); line.setAttribute('y1', acs[0].py + '%');
    line.setAttribute('x2', acs[1].px + '%'); line.setAttribute('y2', acs[1].py + '%');
    lk.style.transform = 'translate(' + ((acs[0].px + acs[1].px) / 2 * W / 100).toFixed(1) + 'px,' + ((acs[0].py + acs[1].py) / 2 * Hh / 100).toFixed(1) + 'px)';
  }
  if (!still || t < dur + 200 || (revealed && now - revealAt < 1600)) raf = requestAnimationFrame(frame);
}
function kick() { if (!raf) raf = requestAnimationFrame(frame); }
function measure() { if (el) { W = el.clientWidth || 1; Hh = el.clientHeight || 1; kick(); } }

return {
  init: function (node, trFn) {
    el = node; tr = trFn;
    still = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    measure();
  },
  set: function (sp, o) {
    spec = sp; revealed = false; dur = still ? 1 : ((o && o.dur) || 12000); el.classList.remove('revealed');
    flip = (sp.kind === 'pair' || sp.kind === 'solo' || sp.kind === 'stack') && Math.random() < 0.5;
    build(); measure(); t0 = performance.now(); kick();
  },
  reveal: function () { if (!spec || revealed) return; revealed = true; revealAt = performance.now(); el.classList.add('revealed'); relabel(); kick(); },
  clear: function () { if (el) el.classList.remove('revealed'); },
  relabel: relabel, measure: measure,
  stop: function () { if (raf) cancelAnimationFrame(raf); raf = 0; spec = null; el = null; }
};
})();
