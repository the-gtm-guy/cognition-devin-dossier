// Golden tests for calc.js — run with: node calc.test.js
const assert = require('assert');
const Calc = require('./calc.js');

// Illustrative Sonnet-class price row ($/MTok). Real values are loaded from pricing.config at runtime.
const P = { input: 3, output: 15, cacheWrite5m: 3.75, cacheWrite1h: 6, cacheRead: 0.3, batchDiscount: 0.5 };

let passed = 0;
function test(name, fn) { fn(); passed++; console.log('ok -', name); }
const close = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) <= tol, `${a} !== ${b}`);

test('hand-computed scenario', () => {
  // R=1M, C=60k, O=1.5k, E=0, h=0.8, T=25, 5m TTL, no batch
  const s = { R: 1e6, C: 60e3, O: 1500, E: 0, h: 0.8, T: 25, ttl: '5m', batchShare: 0 };
  const r = Calc.claudeCost(s, P);
  // sessions = 40,000; cache-write tokens = 40k * 48k = 1.92e9 -> 1920 M * 3.75 = 7200
  close(r.cacheWrite, 7200);
  // cache-read tokens = 960,000 * 48k = 4.608e13 -> 46,080 M * 0.3 = 13,824
  close(r.cacheRead, 13824);
  // fresh = 1M * 12k = 1.2e10 -> 12,000 M * 3 = 36,000
  close(r.fresh, 36000);
  // output = 1M * 1.5k = 1.5e9 -> 1500 M * 15 = 22,500
  close(r.output, 22500);
  close(r.total, 7200 + 13824 + 36000 + 22500);
});

test('h=0 equals uncached pricing', () => {
  const s = { R: 1e6, C: 60e3, O: 1500, E: 0, h: 0, T: 25, ttl: '5m', batchShare: 0 };
  const r = Calc.claudeCost(s, P);
  close(r.cacheWrite, 0); close(r.cacheRead, 0);
  close(r.fresh, 60e3 * 1e6 / 1e6 * 3);
});

test('worst-case volume stays finite', () => {
  const s = { R: 1e7, C: 150e3, O: 8000, E: 16000, h: 0.95, T: 200, ttl: '1h', batchShare: 1 };
  const r = Calc.claudeCost(s, P);
  assert.ok(Number.isFinite(r.total) && r.total > 0);
});

test('thinking tokens billed as output', () => {
  const a = Calc.claudeCost({ R: 1e6, C: 10e3, O: 1000, E: 0, h: 0, T: 10, ttl: '5m', batchShare: 0 }, P).total;
  const b = Calc.claudeCost({ R: 1e6, C: 10e3, O: 1000, E: 2000, h: 0, T: 10, ttl: '5m', batchShare: 0 }, P).total;
  close(b - a, 2000 * 1e6 / 1e6 * 15);
});

test('batch discount applies to eligible share only', () => {
  const base = { R: 1e6, C: 10e3, O: 1000, E: 0, h: 0, T: 10, ttl: '5m' };
  const none = Calc.claudeCost(Object.assign({ batchShare: 0 }, base), P).total;
  const half = Calc.claudeCost(Object.assign({ batchShare: 0.5 }, base), P).total;
  close(half, none * (1 - 0.25));
});

test('cache payback turn', () => {
  assert.strictEqual(Calc.cachePaybackTurn(P, '5m'), 2);   // (3.75-0.3)/(3-0.3)=1.28 -> 2
  assert.strictEqual(Calc.cachePaybackTurn(P, '1h'), 3);   // (6-0.3)/2.7=2.11 -> 3
});

test('breakeven clamps', () => {
  const s = { R: 1e6, C: 60e3, O: 1500, E: 0, h: 0.8, T: 25, ttl: '5m', batchShare: 0 };
  const uncached = Calc.claudeCost(Object.assign({}, s, { h: 0 }), P).total;
  const be = Calc.breakevenHitRatio(s, P, uncached * 0.8);  // want 20% cheaper than uncached
  assert.ok(be.h > 0 && be.h < 1);
  const none = Calc.breakevenHitRatio(s, P, uncached * 0.01);
  assert.strictEqual(none.h, null);
  const any = Calc.breakevenHitRatio(s, P, uncached * 1.5);
  assert.strictEqual(any.h, 0);
});

test('margin and compare', () => {
  const cur = { R: 1e6, C: 60e3, O: 1500, E: 2000, h: 0.3, T: 25, ttl: '5m', batchShare: 0 };
  const opt = Object.assign({}, cur, { h: 0.85 });
  const c = Calc.compare(cur, opt, P, { revenuePerLoop: 0.5 });
  assert.ok(c.savings > 0);
  close(c.revenue, 5e5);
  assert.ok(c.gmRecoveryPp > 0);
  assert.strictEqual(Calc.margin(0, 100), null);
});

test('log slider round trip', () => {
  for (const v of [1e5, 3.3e5, 1e6, 4.2e6, 1e7]) close(Calc.fromSlider(Calc.toSlider(v, 1e5, 1e7), 1e5, 1e7), v, 1e-6 * v);
  assert.strictEqual(Calc.niceRound(1234567), 1200000);
});

test('sensitivity ordering', () => {
  const opt = { R: 1e6, C: 60e3, O: 1500, E: 2000, h: 0.85, T: 25, ttl: '5m', batchShare: 0 };
  const s = Calc.sensitivity(opt, P, { h: [0.5, 0.95], T: [5, 100], E: [0, 8000], C: [30e3, 120e3] });
  assert.strictEqual(s.length, 4);
  assert.ok(s[0].swing >= s[1].swing);
});

test('formatters', () => {
  assert.strictEqual(Calc.fmtUSD(1240000, true), '$1.24M');
  assert.strictEqual(Calc.fmtUSD(-500, true), '−$500');
  assert.strictEqual(Calc.fmtUSD(NaN), '—');
  assert.strictEqual(Calc.fmtTok(48e9), '48.0B');
});

console.log(`\n${passed} tests passed`);
