/* Account content file — everything specific to THIS account lives here.
 * Swap this file (and pricing.config.js) to produce a dossier for a different account.
 */
window.DOSSIER = (function () {
  const P = window.PRICING;

  const account = {
    name: 'Cognition AI',
    product: 'Devin',
    ticker: 'COG',
    hq: 'San Francisco, CA',
    founded: '2023',
    stage: '$2B round · Sep 2026',
    valuation: '~$26B (Series D, May 2026)',
    headcount: '~600',
    headcountNote: 'LinkedIn, Aug 2026',
    arr: '$155M+ combined',
    arrNote: 'Devin $73M (Jun 2025) + Windsurf $82M at acquisition',
    cloud: 'AWS (production)',
    model: 'Claude Sonnet 4.5 → current Sonnet tier',
    verifiedAt: '2026-10-13',
  };

  const author = {
    name: 'Johnny Scott',
    title: 'Outbound Systems Architect',
    linkedin: 'https://www.linkedin.com/in/johnny-b-scott/',
    email: 'jorgenllc@gmail.com',            // mailto fallback if no booking link
    booking: 'https://scheduler.zoom.us/johnny-jorgensen-97b7lz/johnny-scott-outbound-systems-pipeline-discussion', // "Book 15 min" → Zoom Scheduler
  };

  const signals = [
    { label: 'Devin runs on Claude', status: 'ok', url: 'https://cognition.com/blog/devin-sonnet-4-5-lessons-and-challenges', date: '2025-09-29' },
    { label: 'AWS multi-year SCA', status: 'ok', url: 'https://press.aboutamazon.com/aws/2026/9/cognition-and-aws-sign-multi-year-collaboration-agreement', date: '2026-09-15' },
    { label: 'In-house SWE-1.5 / SWE-2', status: 'amber', url: 'https://cognition.com/blog/swe-1-5', date: '2025-10-29' },
    { label: 'Hiring: ML Infra', status: 'blue', url: 'https://jobs.ashbyhq.com/cognition', date: '2026-08' },
    { label: '$2B raise · Sep 2026', status: 'coral', url: 'https://en.wikipedia.org/wiki/Cognition_AI', date: '2026-09' },
  ];

  /* Calculator presets. "current" = assumed cache discipline today; "optimised" = the proposal.
   * Volumes are NOT Cognition disclosures — they are scenario anchors the reader can move. */
  const presets = {
    conservative: {
      label: 'Conservative',
      blurb: '500K agent loops/mo · 40K ctx · modest caching today',
      current:   { h: 0.45, T: 8,  E: 2000, ttl: '5m', batchShare: 0 },
      optimised: { R: 5e5, C: 40e3, O: 1200, E: 1500, h: 0.85, T: 25, ttl: '5m', batchShare: 0 },
    },
    expected: {
      label: 'Expected',
      blurb: '2M loops/mo · 60K ctx · partial caching today',
      current:   { h: 0.55, T: 10, E: 2500, ttl: '5m', batchShare: 0 },
      optimised: { R: 2e6, C: 60e3, O: 1500, E: 2000, h: 0.90, T: 40, ttl: '1h', batchShare: 0.1 },
    },
    aggressive: {
      label: 'Aggressive',
      blurb: '6M loops/mo · 90K ctx · long sessions',
      current:   { h: 0.60, T: 12, E: 3000, ttl: '5m', batchShare: 0 },
      optimised: { R: 6e6, C: 90e3, O: 1800, E: 2000, h: 0.92, T: 60, ttl: '1h', batchShare: 0.15 },
    },
  };

  const econ = {
    acuPrice: 2.25,            // $/ACU at Devin 2.0 launch (TechCrunch, 2025-04-03); Enterprise remains ACU-billed (Apr 2026 revamp)
    acuMinutes: 15,            // "1 ACU ≈ 15 minutes of active Devin work" (cognition.com/blog/devin-2)
    loopsPerAcuDefault: 15,    // ASSUMPTION: ~1 min of active work per model turn incl. tool execution → editable in Advanced
    get revenuePerLoop() { return this.acuPrice / (this.loopsPerAcu || this.loopsPerAcuDefault); },
    loopsPerAcu: 15,
    inhouse: {
      label: 'SWE-1.5 / SWE-2 on Cerebras',
      servingCostPerLoop: 0.03,  // ASSUMPTION: amortised GB200 training + Cerebras serving; no public figure exists
      note: 'No public serving-cost figure exists. $0.03/loop is a placeholder for discovery — the point is the shape of the comparison, not the number.',
    },
    hybrid: { retrievalTokensIn: 20e3, retrievalTokensOut: 800, contextReduction: 0.4 }, // Haiku-class retrieval sub-call shrinks main-agent context by 40%
  };

  const meddpicc = [
    { key: 'M', label: 'Metrics', front: true, status: 'hyp',
      hypothesis: 'Inference $/ACU is the margin lever. Devin bills enterprise in ACUs (~15 min active work); every cache miss and over-sized thinking budget lands directly on gross margin.',
      evidence: [{ t: 'ACU-based billing retained for Enterprise after Apr 2026 revamp', u: 'https://devin.ai/pricing', d: '2026-10-13' }, { t: 'Devin Review priced on "compute consumed"', u: 'https://augmenter.dev/articles/cognition-revamps-devin-pricing-with-new-tiers-compute-billing-1776262728623/', d: '2026-04-15' }, { t: 'Net burn < $20M lifetime despite heavy compute', u: 'https://cognition.com/blog/funding-growth-and-the-next-frontier-of-ai-coding-agents', d: '2025-09-08' }],
      questions: ['What is model inference as a share of ACU revenue today, and what target makes the Teams tier margin-accretive?', 'What cache-hit rate are you seeing on repo-map and tool-definition prefixes in production sessions?', 'How do you decide thinking budgets per task class — fixed, or adaptive to Junior Developer Eval difficulty?'] },
    { key: 'E', label: 'Economic Buyer', front: true, status: 'hyp',
      hypothesis: 'Model spend is a top-3 COGS line approved at CEO/CTO level with Finance (VP Finance) on the commit. No CFO title is public.',
      evidence: [{ t: 'Scott Wu CEO · Steven Hao CTO · Walden Yan CPO', u: 'https://en.wikipedia.org/wiki/Cognition_AI', d: '2026-09' }, { t: 'VP Finance and Head of Finance roles exist; no public CFO', u: 'https://www.linkedin.com/company/cognition-ai', d: '2026-08' }],
      questions: ['Who signs the annual model-provider commit — and is it structured as a cloud marketplace private offer or a direct contract?', 'Does the GB200 training cluster and the Claude commit sit in the same budget line, or compete for it?'] },
    { key: 'D', label: 'Decision Criteria', front: true, status: 'ok',
      hypothesis: 'Cognition has published its criteria: end-to-end eval lift (JDE), session speed, context behaviour at 200K, and tokens-per-second for sub-agents.',
      evidence: [{ t: '"2x faster, 12% better on our Junior Developer Evals" on Sonnet 4.5; 200K cap to avoid "context anxiety"', u: 'https://cognition.com/blog/devin-sonnet-4-5-lessons-and-challenges', d: '2025-09-29' }, { t: 'SWE-1.5 positioned on speed: 950 tok/s, "13x faster than Sonnet 4.5"', u: 'https://cognition.com/blog/swe-1-5', d: '2025-10-29' }],
      questions: ['Which matters more for the next model upgrade: JDE lift, latency per turn, or $/resolved task?', 'Would a 5% cache-read rate change how you architect the prompt stack, or is speed the binding constraint?'] },
    { key: 'D2', label: 'Decision Process', front: false, status: 'unk',
      hypothesis: 'Likely: Applied AI team runs evals → CTO signs off → Finance structures commit. Unknown cadence.',
      evidence: [{ t: 'Applied AI Engineer and Research Engineer, ML Infra roles own eval + serving infra', u: 'https://jobs.ashbyhq.com/cognition', d: '2026-08' }],
      questions: ['How did the Sonnet 4.5 rebuild get green-lit — a standing eval gate, or a one-off project?', 'What would a quarterly model-economics review with Anthropic need to include to be worth your time?'] },
    { key: 'P', label: 'Paper Process', front: false, status: 'hyp',
      hypothesis: 'AWS Marketplace is a familiar rail: Cognition sells Devin through it. Buying Claude via Bedrock / Marketplace private offer would reuse the same procurement and security path.',
      evidence: [{ t: '"Devin is available on AWS Marketplace"; multi-year SCA', u: 'https://press.aboutamazon.com/aws/2026/9/cognition-and-aws-sign-multi-year-collaboration-agreement', d: '2026-09-15' }, { t: 'SOC 2 Type II since Sep 2024; ZDR with model providers', u: 'https://docs.devin.ai/admin/security', d: '2026-01' }],
      questions: ['Is your Anthropic agreement direct, via Bedrock, or both — and does it count toward an AWS commit?', 'Does procurement require a fresh vendor security review for a direct API contract that a Marketplace private offer would skip?'] },
    { key: 'I', label: 'Identify Pain', front: true, status: 'hyp',
      hypothesis: 'Three in-house models exist because frontier latency and token burn hurt. The pain is cost-and-speed per loop, not capability.',
      evidence: [{ t: 'SWE-grep built to "preserve context budget" for the main agent', u: 'https://cognition.com/blog/swe-grep', d: '2025-10-16' }, { t: 'SWE-1.5 trained on "thousands of GB200 NVL72 chips"', u: 'https://cognition.com/blog/swe-1-5', d: '2025-10-29' }, { t: 'JD: "hundreds of thousands of concurrent coding agent rollouts"', u: 'https://jobs.ashbyhq.com/cognition/b6f96827-ce14-44f4-98fa-b1b8640858b6', d: '2026-08-06' }],
      questions: ['What share of a typical Devin session is retrieval vs. reasoning tokens — and which one did SWE-grep actually remove?', 'If Haiku-class retrieval cost $0.10/MTok with 5% cache reads, would you still train the next SWE-grep?'] },
    { key: 'C', label: 'Champion', front: true, status: 'unk',
      hypothesis: 'The author of the Sonnet 4.5 rebuild post, or the ML Infra lead who owns serving cost. Unknown until discovery.',
      evidence: [{ t: 'Sonnet 4.5 post authored by "The Cognition Team"; swyx co-authors model posts', u: 'https://cognition.com/blog/swe-1-5', d: '2025-10-29' }],
      questions: ['Who owns the number "cost per resolved task" internally?', 'Who would be embarrassed if a competitor shipped a cheaper, equally capable agent loop next quarter?'] },
    { key: 'C2', label: 'Competition', front: false, status: 'ok',
      hypothesis: 'The competitor is internal: SWE-1.5 / SWE-2 on Cerebras, plus multi-model routing (OpenAI org verified on the domain; Gemini and others on the pricing page).',
      evidence: [{ t: 'Pro plan lists OpenAI, Claude, Gemini, open-source models', u: 'https://devin.ai/pricing', d: '2026-10-13' }, { t: 'Two openai-domain-verification TXT records on cognition.ai', u: 'https://cloudflare-dns.com/dns-query?name=cognition.ai&type=TXT', d: '2026-10-13' }],
      questions: ['Where does the router send a task today, and on what signal?', 'What would make Claude the default for the long-horizon tasks even if SWE-2 wins on speed?'] },
  ];

  const sources = [
    ['Cognition — We rebuilt Devin for Claude Sonnet 4.5', 'https://cognition.com/blog/devin-sonnet-4-5-lessons-and-challenges', '2025-09-29'],
    ['Cognition — SWE-1.5', 'https://cognition.com/blog/swe-1-5', '2025-10-29'],
    ['Cognition — SWE-grep', 'https://cognition.com/blog/swe-grep', '2025-10-16'],
    ['Cognition — Funding, growth and the next frontier', 'https://cognition.com/blog/funding-growth-and-the-next-frontier-of-ai-coding-agents', '2025-09-08'],
    ['Cognition — Windsurf acquisition', 'https://cognition.com/blog/windsurf', '2025-07-14'],
    ['Cognition — Devin 2.0', 'https://cognition.com/blog/devin-2', '2025-04-03'],
    ['Devin pricing page', 'https://devin.ai/pricing', '2026-10-13'],
    ['Devin security docs', 'https://docs.devin.ai/admin/security', '2026-01'],
    ['AWS — Cognition and AWS sign multi-year collaboration agreement', 'https://press.aboutamazon.com/aws/2026/9/cognition-and-aws-sign-multi-year-collaboration-agreement', '2026-09-15'],
    ['Microsoft — Cognition on Azure (Visma)', 'https://www.microsoft.com/en/customers/story/24262-cognition-ai-azure', '2025-05-29'],
    ['TechCrunch — Series C at $10.2B', 'https://techcrunch.com/2025/09/08/cognition-ai-defies-turbulence-with-a-400m-raise-at-10-2b-valuation/', '2025-09-08'],
    ['TechCrunch — Windsurf / Anthropic access', 'https://techcrunch.com/2025/06/03/windsurf-says-anthropic-is-limiting-its-direct-access-to-claude-ai-models/', '2025-06-04'],
    ['Cognition careers (Ashby)', 'https://jobs.ashbyhq.com/cognition', '2026-08'],
    ['Anthropic — Pricing', P.claude['sonnet-5-5'].sourceUrl, P.verifiedAt],
    ['Anthropic — Prompt caching', P.caching.sourceUrl, P.verifiedAt],
    ['Anthropic — Batch processing', P.batch.sourceUrl, P.verifiedAt],
    ['OpenAI — API pricing', 'https://platform.openai.com/docs/pricing', P.verifiedAt],
    ['AWS — Bedrock pricing', P.bedrock.sourceUrl, P.verifiedAt],
    ['SWE-bench Verified leaderboard', P.swebench.sourceUrl, P.verifiedAt],
    ['Public DNS (DoH) + ARIN RDAP for cognition.ai / devin.ai', 'https://cloudflare-dns.com/dns-query?name=devin.ai&type=NS', '2026-10-13'],
  ];

  function snippet(r, s, url) {
    const C = window.Calc;
    return `Subject: Devin's cache-read line, ${C.fmtUSD(r.savings, true)}/mo\n\n` +
      `Hi — I read the Sonnet 4.5 rebuild post and the SWE-1.5 launch, and modelled Devin's agent-loop economics on the current Sonnet tier ($2/$10, 5% cache reads).\n\n` +
      `At ${(s.R / 1e6).toFixed(1)}M loops/mo and ${Math.round(s.C / 1e3)}K context, moving cacheable share from today's level to ${Math.round(s.h * 100)}% with ${s.ttl} TTL is worth roughly ${C.fmtUSD(r.savings, true)}/mo (${Math.round(r.savingsPct * 100)}% of spend) before any commit discount.\n\n` +
      `The interactive model, three wedges and a front-half MEDDPICC are here: ${url}\n\n` +
      `Worth 15 minutes to pressure-test the assumptions with whoever owns cost-per-resolved-task?`;
  }

  return { account, author, signals, presets, econ, meddpicc, sources, snippet, pricing: P };
})();
