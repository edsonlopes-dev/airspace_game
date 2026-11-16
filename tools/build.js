/* Assembles src/* into one self-contained page: a standalone file and the fragment used for publishing.
   `node tools/build.js --debug` writes publish/_debug.html with a test hook (window.ASG_debug) instead. */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), rd = f => fs.readFileSync(path.join(root, 'src', f), 'utf8');
const DEBUG = process.argv.includes('--debug');
const HOOK = "window.ASG_debug = { force: function (gen, c, sub, ans) { var h = D.H(Math.random), q = D.G[gen](h, c, sub); q.gen = gen; G.q = q; G.picked = null; " +
  "Scene.set(q.scene, { dur: 300 }); renderPanel(); if (ans !== undefined) setTimeout(function () { answer(ans === 'ok' ? q.opts.findIndex(function (o) { return o.ok; }) : ans); }, 500); return q.gen; }, " +
  "state: function () { return G; }, go: function (m) { start(m); } };";
const js = ['data.js', 'i18n-en.js', 'i18n-pt.js', 'scene.js', 'app.js'].map(rd).join('\n').replace('/*DEBUG_HOOK*/', DEBUG ? HOOK : '');
if (/<\/script/i.test(js)) throw new Error('script terminator inside JS');
const JET = 'M24 3c2 0 3 4 3 8v8l17 10v3l-17-4.5V38l6 5v2l-9-2-9 2v-2l6-5V27.5L4 32v-3l17-10v-8c0-4 1-8 3-8z';
const head = '<title>Airspace A–G</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n' +
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@600;700&family=IBM+Plex+Mono:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap">\n' +
  '<style>\n' + rd('style.css') + '</style>\n';
const body = '<div id="app">\n<header class="bar">\n<button class="brand" data-act="home"><svg viewBox="0 0 48 48" aria-hidden="true"><path fill="currentColor" d="' + JET + '"/></svg><span id="brandName">Airspace A–G</span></button>\n' +
  '<div class="bar-r"><button class="ghost" id="btnLang" data-act="lang">PT</button><button class="ghost" id="btnSound" data-act="sound" aria-pressed="true">Sound</button></div>\n</header>\n' +
  '<main id="view"></main>\n</div>\n<div class="modal" id="modal" hidden></div>\n<script>\n' + js + '\n</script>\n';
const standalone = '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
  '<meta name="theme-color" content="#0b1a2e">\n<style>:root{padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px)}</style>\n' + head + '</head>\n<body>\n' + body + '</body>\n</html>\n';
fs.mkdirSync(path.join(root, 'publish'), { recursive: true });
if (DEBUG) fs.writeFileSync(path.join(root, 'publish', '_debug.html'), standalone);
else {
  fs.writeFileSync(path.join(root, 'publish', 'airspace-a-g.html'), head + body);
  fs.writeFileSync(path.join(root, 'airspace-game.html'), standalone);
}
fs.writeFileSync(path.join(root, 'publish', '_check.js'), js);
console.log(DEBUG ? 'built debug copy' : 'built', head.length + body.length, 'bytes');
