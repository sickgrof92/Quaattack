const { open } = require('./sim.js');
const fs = require('fs');
const target = L => 0.08 + 0.64 * Math.pow((L - 1) / 99, 1.1);
(async () => {
  const { b, p } = await open();
  const tune = JSON.parse(fs.readFileSync(process.argv[2] || 'tune.json'));
  const N = +(process.argv[3] || 400);
  await p.evaluate(t => { for (const k in t) window.__q.TUNE[k] = t[k]; }, tune);
  const res = [];
  for (let L = 1; L <= 100; L++) res.push(await p.evaluate(([L, n]) => failRate(L, n), [L, N]));
  // targeted fixes: re-search any level that breaks the climb
  for (let pass = 0; pass < 3; pass++) {
    let fixed = 0;
    for (let L = 2; L <= 100; L++) {
      const bad = Math.abs(res[L - 1].fail - target(L)) > (+process.env.TOL || 0.035);
      if (!bad) continue;
      let lo = Math.log(tune[L] * 0.7), hi = Math.log(tune[L] * 1.3), best = null;
      for (let it = 0; it < 8; it++) {
        const mid = (lo + hi) / 2, t = Math.exp(mid);
        const r = await p.evaluate(([L, n, t]) => failRate(L, n, t), [L, N, t]);
        if (!best || Math.abs(r.fail - target(L)) < Math.abs(best.fail - target(L))) best = { ...r, t };
        if (r.fail > target(L)) hi = mid; else lo = mid;
      }
      tune[L] = +best.t.toFixed(3); res[L - 1] = best; fixed++;
      await p.evaluate(([L, t]) => { window.__q.TUNE[L] = t; }, [L, tune[L]]);
    }
    console.log('pass', pass, 'refit', fixed);
    if (!fixed) break;
  }
  fs.writeFileSync('tune-final.json', JSON.stringify(tune));
  fs.writeFileSync('failcurve.json', JSON.stringify(res.map((r, i) => ({ L: i + 1, fail: +r.fail.toFixed(3), target: +target(i + 1).toFixed(3), time: r.avgTime, style: null }))));
  let drops = 0; for (let i = 1; i < 100; i++) if (res[i].fail < res[i - 1].fail - 0.04) { drops++; console.log('drop at', i + 1, res[i - 1].fail, res[i].fail); }
  console.log('drops > 4 points:', drops);
  console.log(res.filter((r, i) => i % 10 === 0 || i === 99).map(r => `L${r.L} ${(r.fail * 100).toFixed(0)}% ${r.avgTime}s`).join(' | '));
  await b.close();
})();
