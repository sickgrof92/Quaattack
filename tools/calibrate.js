const { open } = require('./sim.js');
const fs = require('fs');
const target = L => 0.08 + 0.64 * Math.pow((L - 1) / 99, 1.1);
(async () => {
  const { b, p } = await open();
  const tune = {}, N = 200;
  let prevT = 1;
  for (let L = 1; L <= 100; L++) {
    let lo = Math.log(0.2), hi = Math.log(2.0), best = null;
    for (let it = 0; it < 11; it++) {
      const mid = (lo + hi) / 2, t = Math.exp(mid);
      const r = await p.evaluate(([L, n, t]) => failRate(L, n, t), [L, N, t]);
      if (!best || Math.abs(r.fail - target(L)) < Math.abs(best.fail - target(L))) best = { ...r, t };
      if (r.fail > target(L)) hi = mid; else lo = mid;
    }
    tune[L] = +best.t.toFixed(3);
    await p.evaluate(([L, t]) => { window.__q.TUNE[L] = t; }, [L, tune[L]]);
    console.log(`L${L} target ${target(L).toFixed(2)} fail ${best.fail.toFixed(2)} tune ${tune[L]} time ${best.avgTime}s`);
  }
  fs.writeFileSync('tune.json', JSON.stringify(tune));
  await b.close();
})();
