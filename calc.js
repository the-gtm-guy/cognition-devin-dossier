/* Token-economics calculator — pure functions, no DOM.
 * All prices are $ per MILLION tokens; all token volumes are summed in millions
 * before multiplying, so no intermediate exceeds ~1e8 (safe for float64).
 * Works in the browser (window.Calc) and in Node (module.exports) for tests.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Calc = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const M = 1e6;
  const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
  const fin = (x) => (Number.isFinite(x) ? x : 0);

  /** Price row shape: { input, output, cacheWrite5m, cacheWrite1h, cacheRead, batchDiscount } — all $/MTok except batchDiscount (0..1) */

  /**
   * Monthly cost of one Claude configuration.
   * @param {object} s scenario
   *   R  loops/month, C context tokens/loop, O output tokens/loop, E thinking tokens/loop,
   *   h  cacheable share of C (0..0.95), T turns per session (>=1; cache write once per session),
   *   ttl '5m' | '1h', batchShare b (0..1) of loops eligible for Batch API
   * @param {object} p price row
   */
  function claudeCost(s, p) {
    const R = clamp(fin(s.R), 0, 1e9);
    const C = clamp(fin(s.C), 0, 2e6);
    const O = clamp(fin(s.O), 0, 1e6);
    const E = clamp(fin(s.E), 0, 1e6);
    const h = clamp(fin(s.h), 0, 1);
    const T = clamp(fin(s.T), 1, 1e4);
    const b = clamp(fin(s.batchShare), 0, 1);
    const pw = s.ttl === '1h' ? p.cacheWrite1h : p.cacheWrite5m;

    const sessions = R / T;                              // one cache write per session
    const cacheWriteTok = (sessions * h * C) / M;        // millions
    const cacheReadTok = ((R - sessions) * h * C) / M;
    const freshTok = (R * (1 - h) * C) / M;
    const outTok = (R * (O + E)) / M;

    const cacheWrite = cacheWriteTok * pw;
    const cacheRead = cacheReadTok * p.cacheRead;
    const fresh = freshTok * p.input;
    const output = outTok * p.output;
    const gross = cacheWrite + cacheRead + fresh + output;
    const batchSaving = gross * (p.batchDiscount || 0) * b;
    const total = gross - batchSaving;
    return { cacheWrite, cacheRead, fresh, output, batchSaving, total,
             tokens: { cacheWriteTok, cacheReadTok, freshTok, outTok } };
  }

  /** Breakeven cacheable share h* where Claude(h) == target cost. Claude(h) is linear in h. */
  function breakevenHitRatio(s, p, targetCost) {
    const base = claudeCost(Object.assign({}, s, { h: 0 }), p).total;
    const full = claudeCost(Object.assign({}, s, { h: 1 }), p).total;
    const slope = full - base;                            // negative when caching helps
    if (Math.abs(slope) < 1e-9) return { h: null, note: 'Caching has no effect at these settings' };
    const h = (targetCost - base) / slope;
    if (slope < 0 && base <= targetCost) return { h: 0, note: 'Cheaper at any hit rate' };
    if (h < 0 || h > 1) return { h: null, note: 'No breakeven within 0–100% hit rate' };
    return { h, note: null };
  }

  /** Minimum turns per session for caching to beat uncached input at a given TTL. */
  function cachePaybackTurn(p, ttl) {
    const pw = ttl === '1h' ? p.cacheWrite1h : p.cacheWrite5m;
    // pw + (T-1)*cr < T*in  ->  T > (pw - cr) / (in - cr)
    const T = (pw - p.cacheRead) / (p.input - p.cacheRead);
    return Number.isFinite(T) && T > 0 ? Math.max(1, Math.ceil(T + 1e-9)) : null;
  }

  /** Gross-margin helpers. revenuePerLoop in $ (ACU price / loops per ACU). */
  function margin(revenueTotal, cost) {
    if (!(revenueTotal > 0)) return null;
    return (revenueTotal - cost) / revenueTotal;
  }

  /** Compare "current" vs "optimised" configurations and produce KPIs. */
  function compare(current, optimised, p, econ) {
    const cur = claudeCost(current, p);
    const opt = claudeCost(optimised, p);
    const revenue = fin(current.R) * fin(econ.revenuePerLoop);
    const gmCur = margin(revenue, cur.total);
    const gmOpt = margin(revenue, opt.total);
    return {
      current: cur,
      optimised: opt,
      savings: cur.total - opt.total,
      savingsPct: cur.total > 0 ? (cur.total - opt.total) / cur.total : 0,
      revenue,
      gmCurrent: gmCur,
      gmOptimised: gmOpt,
      gmRecoveryPp: gmCur !== null && gmOpt !== null ? (gmOpt - gmCur) * 100 : null,
      costPer1kLoopsCurrent: current.R > 0 ? (cur.total / current.R) * 1000 : 0,
      costPer1kLoopsOptimised: optimised.R > 0 ? (opt.total / optimised.R) * 1000 : 0,
    };
  }

  /** One-at-a-time sensitivity: swing each optimised parameter between lo/hi, report cost delta. */
  function sensitivity(optimised, p, ranges) {
    const baseTotal = claudeCost(optimised, p).total;
    return Object.keys(ranges).map((k) => {
      const [lo, hi] = ranges[k];
      const low = claudeCost(Object.assign({}, optimised, { [k]: lo }), p).total - baseTotal;
      const high = claudeCost(Object.assign({}, optimised, { [k]: hi }), p).total - baseTotal;
      return { key: k, low, high, swing: Math.abs(high - low) };
    }).sort((a, b) => b.swing - a.swing);
  }

  /** Log-scale slider mapping: slider s in [0,1] <-> value in [lo,hi]. */
  function fromSlider(s, lo, hi) { return Math.pow(10, Math.log10(lo) + clamp(s, 0, 1) * (Math.log10(hi) - Math.log10(lo))); }
  function toSlider(v, lo, hi) { return clamp((Math.log10(clamp(v, lo, hi)) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo)), 0, 1); }
  /** Round to a "clean" number: 1-2 significant digits scaled. */
  function niceRound(v) {
    if (v <= 0) return 0;
    const mag = Math.pow(10, Math.floor(Math.log10(v)) - 1);
    return Math.round(v / mag) * mag;
  }

  function fmtUSD(x, compact) {
    if (!Number.isFinite(x)) return '—';
    const sign = x < 0 ? '−' : '';
    const a = Math.abs(x);
    if (compact) {
      if (a >= 1e9) return sign + '$' + (a / 1e9).toFixed(2) + 'B';
      if (a >= 1e6) return sign + '$' + (a / 1e6).toFixed(2) + 'M';
      if (a >= 1e3) return sign + '$' + (a / 1e3).toFixed(1) + 'K';
      return sign + '$' + a.toFixed(a < 10 ? 2 : 0);
    }
    return sign + '$' + a.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }
  function fmtTok(x) {
    if (!Number.isFinite(x)) return '—';
    if (x >= 1e9) return (x / 1e9).toFixed(1) + 'B';
    if (x >= 1e6) return (x / 1e6).toFixed(1) + 'M';
    if (x >= 1e3) return Math.round(x / 1e3) + 'K';
    return String(Math.round(x));
  }

  return { claudeCost, breakevenHitRatio, cachePaybackTurn, margin, compare, sensitivity,
           fromSlider, toSlider, niceRound, fmtUSD, fmtTok, clamp };
});
