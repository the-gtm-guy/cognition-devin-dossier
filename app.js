/* UI wiring for the dossier. Depends on window.Calc (calc.js) and window.DOSSIER (data.js). */
(function () {
  'use strict';
  const D = window.DOSSIER;
  const C = window.Calc;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ───────────── State ───────────── */
  const DEFAULTS = Object.assign({ L: D.econ.loopsPerAcuDefault }, D.presets.expected.optimised, { preset: 'expected' });
  const LIMITS = { R: [1e5, 1e7], C: [10e3, 150e3], O: [200, 8000], E: [0, 16000], h: [0, 0.95], T: [2, 200], batchShare: [0, 1], L: [5, 120] };
  let state = readHash() || Object.assign({}, DEFAULTS);
  let raf = 0;

  function readHash() {
    const h = location.hash.replace(/^#/, '');
    if (!h) return null;
    const q = new URLSearchParams(h);
    const s = Object.assign({}, DEFAULTS, { preset: 'custom' });
    let any = false;
    for (const k of Object.keys(LIMITS)) {
      if (q.has(k)) { const v = Number(q.get(k)); if (Number.isFinite(v)) { s[k] = C.clamp(v, LIMITS[k][0], LIMITS[k][1]); any = true; } }
    }
    if (q.get('ttl') === '1h' || q.get('ttl') === '5m') { s.ttl = q.get('ttl'); any = true; }
    if (q.has('preset') && D.presets[q.get('preset')]) s.preset = q.get('preset');
    return any ? s : null;
  }
  function writeHash() {
    const q = new URLSearchParams();
    for (const k of Object.keys(LIMITS)) q.set(k, String(+Number(state[k]).toPrecision(4)));
    q.set('ttl', state.ttl); q.set('preset', state.preset);
    try { history.replaceState(null, '', '#' + q.toString()); } catch (e) { /* sandboxed iframes may refuse */ }
  }

  /* ───────────── Controls ───────────── */
  const ctl = { R: $('#sl-R'), C: $('#sl-C'), O: $('#sl-O'), E: $('#sl-E'), h: $('#sl-h'), T: $('#sl-T'), batchShare: $('#sl-b'), L: $('#sl-L') };
  function syncControls() {
    ctl.R.value = C.toSlider(state.R, 1e5, 1e7) * 1000;
    ctl.C.value = state.C; ctl.O.value = state.O; ctl.E.value = state.E; ctl.L.value = state.L;
    ctl.h.value = Math.round(state.h * 100); ctl.T.value = state.T; ctl.batchShare.value = Math.round(state.batchShare * 100);
    for (const k in ctl) paintTrack(ctl[k]);
    $$('.presets button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.preset === state.preset)));
    $$('#ttl button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.ttl === state.ttl)));
    $('#v-R').textContent = fmtLoops(state.R);
    $('#v-C').textContent = C.fmtTok(state.C) + ' tok';
    $('#v-O').textContent = C.fmtTok(state.O) + ' tok';
    $('#v-E').textContent = state.E ? C.fmtTok(state.E) + ' tok' : 'off';
    $('#v-h').textContent = Math.round(state.h * 100) + '%';
    $('#v-T').textContent = state.T + ' turns';
    $('#v-b').textContent = Math.round(state.batchShare * 100) + '%';
    $('#v-L').textContent = state.L + ' loops/ACU';
    ctl.R.setAttribute('aria-valuetext', fmtLoops(state.R) + ' loops per month');
    ctl.C.setAttribute('aria-valuetext', C.fmtTok(state.C) + ' tokens per loop');
    const blurb = D.presets[state.preset]; $('#preset-blurb').textContent = blurb ? blurb.blurb : 'Custom scenario — URL updated, share it as-is.';
  }
  function paintTrack(el) { const min = +el.min, max = +el.max, v = +el.value; el.style.setProperty('--pct', ((v - min) / (max - min) * 100) + '%'); }
  function fmtLoops(R) { return R >= 1e6 ? (R / 1e6).toFixed(R % 1e6 ? 2 : 0).replace(/\.?0+$/, '') + 'M' : Math.round(R / 1e3) + 'K'; }

  function onInput(k, el) {
    state.preset = 'custom';
    if (k === 'R') state.R = C.niceRound(C.fromSlider(+el.value / 1000, 1e5, 1e7));
    else if (k === 'h' || k === 'batchShare') state[k] = +el.value / 100;
    else state[k] = +el.value;
    paintTrack(el);
    syncControls(); schedule();
  }
  for (const k in ctl) ctl[k].addEventListener('input', () => onInput(k, ctl[k]));
  $$('.presets button').forEach(b => b.addEventListener('click', () => {
    state = Object.assign({ L: state.L }, D.presets[b.dataset.preset].optimised, { preset: b.dataset.preset });
    syncControls(); schedule();
  }));
  $$('#ttl button').forEach(b => b.addEventListener('click', () => { state.ttl = b.dataset.ttl; state.preset = 'custom'; syncControls(); schedule(); }));
  function schedule() { if (!raf) raf = requestAnimationFrame(() => { raf = 0; render(); }); }

  /* ───────────── Render ───────────── */
  function currentScenario() {
    const p = D.presets[state.preset] || D.presets.expected;
    return Object.assign({}, state, p.current, { R: state.R, C: state.C, O: state.O });
  }
  function render() {
    const price = D.pricing.claude[D.pricing.defaultClaude];
    const haiku = D.pricing.claude['haiku-5-5'];
    const cur = currentScenario(); const opt = state;
    D.econ.loopsPerAcu = state.L;
    const r = C.compare(cur, opt, price, { revenuePerLoop: D.econ.revenuePerLoop });

    setKpi('#k-savings', r.savings, 'usd', r.savings >= 0 ? 'good' : 'warn', r.savings >= 0 ? 'per month vs. today’s cache discipline, before any commit discount' : 'optimised config costs MORE — check the thinking budget');
    setKpi('#k-pct', r.savingsPct * 100, 'pct', r.savingsPct >= 0 ? 'good' : 'warn', 'of current monthly Claude spend');
    if (r.gmRecoveryPp === null) { $('#k-gm .v').textContent = '—'; $('#k-gm .s').textContent = 'needs revenue per loop'; }
    else if (r.gmCurrent < 0) { const v = $('#k-gm .v'); v.className = 'v warn'; v.textContent = 'cost > revenue'; $('#k-gm .s').textContent = `inference exceeds implied ACU revenue at ${state.L} loops/ACU — adjust in Advanced`; }
    else setKpi('#k-gm', r.gmRecoveryPp, 'pp', r.gmRecoveryPp >= 0 ? 'good' : 'warn', `${pct(r.gmCurrent)} → ${pct(r.gmOptimised)} gross margin on inference`);
    setKpi('#k-cpk', r.costPer1kLoopsOptimised, 'usd2', '', `was ${C.fmtUSD(r.costPer1kLoopsCurrent, true)} per 1K loops`);

    const be = C.breakevenHitRatio(opt, price, r.current.total);
    $('#be').textContent = be.h === null ? be.note : be.h === 0 ? be.note : `${Math.round(be.h * 100)}% cacheable share`;
    $('#payback').textContent = String(C.cachePaybackTurn(price, state.ttl));
    $('#rev').textContent = C.fmtUSD(r.revenue, true);

    drawBar('#bar-cur', r.current, cur); drawBar('#bar-opt', r.optimised, opt);
    $('#bar-cur-amt').textContent = C.fmtUSD(r.current.total, true);
    $('#bar-opt-amt').textContent = C.fmtUSD(r.optimised.total, true);

    const sens = C.sensitivity(opt, price, { h: [0.5, 0.95], E: [0, 8000], T: [5, 100], C: [30e3, 120e3], O: [500, 4000] });
    const maxSwing = Math.max(1, ...sens.map(s => Math.max(Math.abs(s.low), Math.abs(s.high))));
    $('#tornado').innerHTML = sens.map(s => {
      const lbl = { h: 'Cache hit share', E: 'Thinking budget', T: 'Turns / session', C: 'Context / loop', O: 'Output / loop' }[s.key];
      const lo = Math.min(s.low, s.high), hi = Math.max(s.low, s.high);
      const negW = Math.min(50, Math.abs(Math.min(0, lo)) / maxSwing * 50);
      const posW = Math.min(50, Math.max(0, hi) / maxSwing * 50);
      return `<div class="trow"><div class="lbl">${lbl} <span class="rng">${rangeLbl(s.key)} · ±${C.fmtUSD(s.swing / 2, true)}</span></div><div class="track" title="${C.fmtUSD(lo, true)} to ${C.fmtUSD(hi, true)}"><span class="neg" style="width:${negW}%"></span><span class="pos" style="width:${posW}%"></span></div></div>`;
    }).join('');

    // Build vs buy
    const perLoopClaude = r.optimised.total / opt.R;
    const hy = D.econ.hybrid;
    const mainHybrid = C.claudeCost(Object.assign({}, opt, { C: opt.C * (1 - hy.contextReduction) }), price).total / opt.R;
    const retrieval = (hy.retrievalTokensIn * (1 - opt.h) * haiku.input + hy.retrievalTokensIn * opt.h * haiku.cacheRead + hy.retrievalTokensOut * haiku.output) / 1e6;
    const perLoopHybrid = mainHybrid + retrieval;
    $('#bvb-claude').textContent = '$' + perLoopClaude.toFixed(3);
    $('#bvb-hybrid').textContent = '$' + perLoopHybrid.toFixed(3);
    $('#bvb-inhouse').textContent = '$' + D.econ.inhouse.servingCostPerLoop.toFixed(3);
    $('#bvb-gap').textContent = C.fmtUSD((perLoopClaude - D.econ.inhouse.servingCostPerLoop) * opt.R, true);
    $('#bvb-hybrid-save').textContent = C.fmtUSD((perLoopClaude - perLoopHybrid) * opt.R, true);

    $('#live').textContent = `Optimised ${C.fmtUSD(r.optimised.total)} vs current ${C.fmtUSD(r.current.total)} per month; savings ${C.fmtUSD(r.savings)}.`;
    writeHash();
  }
  function setKpi(sel, v, kind, cls, sub) {
    const el = $(sel); const vEl = $('.v', el);
    vEl.className = 'v ' + (cls || '');
    vEl.textContent = kind === 'usd' ? C.fmtUSD(v, true) : kind === 'usd2' ? '$' + v.toFixed(2) : kind === 'pct' ? (v >= 0 ? '' : '−') + Math.abs(v).toFixed(1) + '%' : (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(1) + ' pp';
    $('.s', el).textContent = sub;
  }
  const pct = (x) => x === null ? '—' : Math.round(x * 100) + '%';
  function rangeLbl(k) { return { h: '50–95%', E: '0–8K', T: '5–100', C: '30–120K', O: '0.5–4K' }[k]; }
  function drawBar(sel, cost, s) {
    const total = cost.total || 1;
    const think = s.E > 0 ? cost.output * (s.E / (s.O + s.E)) : 0;
    const out = cost.output - think;
    const parts = [['fresh', 'Uncached input', cost.fresh], ['cw', 'Cache writes', cost.cacheWrite], ['cr', 'Cache reads', cost.cacheRead], ['out', 'Output', out], ['think', 'Thinking', think]];
    $(sel).innerHTML = parts.map(([c, n, v]) => `<span class="${c}" style="width:${(v / total * 100).toFixed(2)}%" title="${n}: ${C.fmtUSD(v, true)}"></span>`).join('');
  }

  /* ───────────── Static content from data.js ───────────── */
  function renderStatic() {
    const A = D.account;
    $('#signals').innerHTML = D.signals.map(s => `<a class="badge ${s.status}" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" title="Source · ${esc(s.date)}"><span class="dot"></span>${esc(s.label)}</a>`).join('');
    $('#meta-strip').innerHTML = [['HQ', A.hq], ['Cloud', 'AWS'], ['Model', 'Claude'], ['Stage', A.stage]].map(([k, v]) => `<span class="chip"><span class="k">${k}</span>${esc(v)}</span>`).join('');
    $('#facts').innerHTML = [
      ['Headquarters', A.hq, 'founded ' + A.founded], ['Latest round', A.stage, A.valuation], ['Headcount', A.headcount, A.headcountNote], ['Revenue', A.arr, A.arrNote],
      ['Production cloud', A.cloud, 'security docs + AWS SCA'], ['Agent model', 'Claude', 'Sonnet 3.6 at GA → Sonnet 4.5 rebuild'],
    ].map(([k, v, s]) => `<div><div class="k">${k}</div><div class="v">${esc(v)}<small>${esc(s)}</small></div></div>`).join('');
    $('#swe-rows').innerHTML = D.pricing.swebench.rows.map(r => `<tr><td>${esc(r.model)}${/Claude/.test(r.model) ? ' <span class="badge coral" style="margin-left:6px">Claude</span>' : ''}</td><td class="num">${r.pct.toFixed(1)}%</td><td class="dim">${r.date}</td></tr>`).join('');
    $('#pillars').innerHTML = D.meddpicc.map(p => `
      <article class="pillar ${p.front ? 'front' : ''}">
        <div class="top"><span class="letter">${p.key.replace(/\d/, '')}</span><h3>${esc(p.label)}</h3><span class="badge ${p.status}"><span class="dot"></span>${{ ok: 'Validated', hyp: 'Hypothesised', unk: 'Unknown' }[p.status]}</span>${p.front ? '<span class="badge coral">front-half</span>' : ''}</div>
        <p class="h">${esc(p.hypothesis)}</p>
        <div class="ev">${p.evidence.map(e => `<div>→ <a href="${esc(e.u)}" target="_blank" rel="noopener noreferrer">${esc(e.t)}</a> <span class="dim">(${esc(e.d)})</span></div>`).join('')}</div>
        <details class="qs"><summary>Discovery questions for the CTO / Head of AI →</summary><ol>${p.questions.map(q => `<li>${esc(q)}</li>`).join('')}</ol></details>
      </article>`).join('');
    $('#sources').innerHTML = D.sources.map(([t, u, d]) => `<li><a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(t)}</a> <span class="dim">· ${esc(d)}</span></li>`).join('');
    const val = D.meddpicc.filter(p => p.status === 'ok').length, hyp = D.meddpicc.filter(p => p.status === 'hyp').length;
    $('#ledger-sum').innerHTML = [['Sources cited', D.sources.length], ['Claims validated', val + ' / 8 pillars'], ['Hypotheses to test', hyp], ['Prices verified', D.pricing.verifiedAt]].map(([k, v]) => `<div><b>${esc(v)}</b>${k}</div>`).join('');
    $$('[data-verified]').forEach(el => el.textContent = A.verifiedAt);
    const book = $('#b-book');
    if (D.author.booking) book.href = D.author.booking;
    else if (D.author.email) book.href = 'mailto:' + D.author.email + '?subject=' + encodeURIComponent('Cognition dossier — 15 min');
    else book.href = D.author.linkedin;
    $$('[data-author]').forEach(el => el.textContent = D.author.name);
  }

  /* ───────────── Tabs / accordion ───────────── */
  const tabs = $$('.tabs button'); const panels = $$('.panel'); const accs = $$('.acc-head');
  function selectTab(id) { tabs.forEach(t => t.setAttribute('aria-selected', String(t.dataset.panel === id))); panels.forEach(p => p.classList.toggle('active', p.id === id)); }
  tabs.forEach(t => t.addEventListener('click', () => selectTab(t.dataset.panel)));
  tabs.forEach((t, i) => t.addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]; n.focus(); n.click(); } }));
  accs.forEach(a => a.addEventListener('click', () => { const p = $('#' + a.dataset.panel); const open = !p.classList.contains('open'); p.classList.toggle('open', open); a.setAttribute('aria-expanded', String(open)); }));
  selectTab(panels[0].id);
  accs[0] && accs[0].click();

  /* ───────────── Action bar ───────────── */
  async function copy(text, btn) {
    try { await navigator.clipboard.writeText(text); } catch (e) {
      const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e2) {} ta.remove();
    }
    const old = btn.innerHTML; btn.dataset.done = 'true'; btn.innerHTML = '<span class="ic">✓</span> Copied';
    setTimeout(() => { btn.dataset.done = 'false'; btn.innerHTML = old; }, 1600);
  }
  $('#b-link').addEventListener('click', e => copy(location.href, e.currentTarget));
  $('#b-snippet').addEventListener('click', e => {
    const price = D.pricing.claude[D.pricing.defaultClaude];
    const r = C.compare(currentScenario(), state, price, { revenuePerLoop: D.econ.revenuePerLoop });
    copy(D.snippet(r, state, location.href), e.currentTarget);
  });
  $('#b-print').addEventListener('click', () => window.print());

  /* ───────────── Personalisation hook (?for=Company) ───────────── */
  const forParam = new URLSearchParams(location.search).get('for');
  if (forParam && /^[\w .&-]{1,40}$/.test(forParam)) { const el = $('#greeting'); el.hidden = false; $('b', el).textContent = forParam; }

  renderStatic(); syncControls(); render();
})();
