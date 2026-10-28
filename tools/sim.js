// Headless difficulty sim: runs the real game logic with a modeled 8-year-old tapping.
const { chromium } = require('playwright');
const fs = require('fs');
const BOT = `
window.gauss = (m, s) => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return m + s * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
window.simLevel = function (L) {
  const q = window.__q; q.newGame(L);
  const G = q.G, dt = 1 / 30;
  const sk = (L - 1) / 99; // practice: a kid who reached level L has played a lot more
  const react = 0.33 - 0.07 * sk, recover = 0.17 - 0.05 * sk, aim = 9 - 2 * sk;
  let t = 0, next = 0.5, pending = null;
  while (G.running && t < 900) {
    q.update(dt); t += dt;
    if (!G.running) break;
    if (pending && t >= pending.at) { window.taps = (window.taps||0) + 1; q.bonkAt(pending.x, pending.y); pending = null; next = t + Math.max(0.06, gauss(recover, 0.05)); }
    else if (!pending && t >= next) {
      const vis = G.ducks.filter(d => d.state === 'walk' && d.x > 8 && d.x < q.W - 8 && d.y > q.FT + 8 && d.y < q.FB - 8);
      const pos = G.possums.filter(o => o.state === 'run' && o.x > 0 && o.x < q.W);
      let tgt = null;
      for (const o of pos) if (o.__seen === undefined) o.__seen = Math.random() < (window.POSSUM_MISTAKE ?? 0.12) ? t + 0.5 + Math.random() * 2 : -1;
      const oops = pos.find(o => o.__seen > 0 && t >= o.__seen);
      if (oops) { tgt = oops; oops.__seen = -1; }                       // mistakes the opossum for a duck (once per crossing, sometimes)
      else if (vis.length) {
        if (Math.random() < 0.7) tgt = vis.reduce((a, b) => Math.hypot(a.x - q.PX, a.y - q.PY) < Math.hypot(b.x - q.PX, b.y - q.PY) ? a : b);
        else tgt = vis[Math.floor(Math.random() * vis.length)];          // gets distracted by another duck
      }
      if (!tgt) next = t + 0.1;
      else pending = { at: t + Math.max(0.15, gauss(react, 0.07)), x: tgt.x + gauss(0, aim), y: tgt.y + gauss(0, aim) };
    }
  }
  return { win: G.hearts > 0 && !G.running, t: Math.round(t), hearts: G.hearts, wave: G.wave };
};
window.failRate = function (L, n, tune) {
  if (tune !== undefined) window.__q.TUNE[L] = tune;
  let fails = 0, time = 0;
  for (let i = 0; i < n; i++) { const r = simLevel(L); if (!r.win) fails++; time += r.t; }
  return { L, fail: fails / n, avgTime: Math.round(time / n) };
};`;
async function open() {
  let body = fs.readFileSync('/mnt/project-files/quaattack/quaattack.html', 'utf8');
  body = body.replace('window.addEventListener("resize", resize);', 'window.__q = { get G(){return G;}, newGame, update, bonkAt, TUNE, levelPlan, SAVE, get W(){return W;}, get FT(){return FT;}, get FB(){return FB;}, get PX(){return PX;}, get PY(){return PY;} };\nwindow.addEventListener("resize", resize);');
  fs.writeFileSync('simpage.html', `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>${body}</body></html>`);
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 390, height: 740 } })).newPage();
  p.on('pageerror', e => console.error('PAGEERR', e.message));
  await p.goto('file://' + process.cwd() + '/simpage.html');
  await p.evaluate(BOT);
  return { b, p };
}
module.exports = { open };
if (require.main === module) (async () => {
  const { b, p } = await open();
  const levels = process.argv[2] ? process.argv[2].split(',').map(Number) : [1, 2, 3, 5, 10];
  const n = +(process.argv[3] || 10);
  for (const L of levels) { const t0 = Date.now(); const r = await p.evaluate(([L, n]) => failRate(L, n), [L, n]); console.log(JSON.stringify(r), 'real', ((Date.now() - t0) / 1000).toFixed(1) + 's'); }
  await b.close();
})();
