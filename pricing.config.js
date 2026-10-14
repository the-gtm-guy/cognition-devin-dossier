/* Pricing config — every number here was read from an official vendor page on the date shown.
 * $ per MILLION tokens. Refreshing prices = editing this one file.
 */
window.PRICING = {
  verifiedAt: '2026-10-13',
  defaultClaude: 'sonnet-5-5',
  claude: {
    'sonnet-5-5': { label: 'Claude Sonnet 5.5', id: 'claude-sonnet-5-5', input: 2.00, output: 10.00, cacheWrite5m: 2.50, cacheWrite1h: 4.00, cacheRead: 0.10, batchDiscount: 0.5, minCache: 512,
      sourceUrl: 'https://docs.anthropic.com/en/docs/about-claude/pricing' },
    'opus-5-5':   { label: 'Claude Opus 5.5',   id: 'claude-opus-5-5',   input: 4.00, output: 20.00, cacheWrite5m: 5.00, cacheWrite1h: 8.00, cacheRead: 0.20, batchDiscount: 0.5, minCache: 512,
      sourceUrl: 'https://docs.anthropic.com/en/docs/about-claude/pricing' },
    'haiku-5-5':  { label: 'Claude Haiku 5.5',  id: 'claude-haiku-5-5',  input: 0.10, output: 0.50, cacheWrite5m: 0.125, cacheWrite1h: 0.20, cacheRead: 0.01, batchDiscount: 0.5, minCache: 512,
      sourceUrl: 'https://docs.anthropic.com/en/docs/about-claude/pricing' },
    'sonnet-4-5': { label: 'Claude Sonnet 4.5', id: 'claude-sonnet-4-5', input: 3.00, output: 15.00, cacheWrite5m: 3.75, cacheWrite1h: 6.00, cacheRead: 0.30, batchDiscount: 0.5, minCache: 1024,
      sourceUrl: 'https://docs.anthropic.com/en/docs/about-claude/pricing' },
  },
  openai: {
    'gpt-6-1-sol': { label: 'gpt-6.1-sol', input: 2.00, cachedInput: 0.10, output: 10.00, sourceUrl: 'https://platform.openai.com/docs/pricing' },
    'gpt-5-5':     { label: 'gpt-5.5',     input: 5.00, cachedInput: 0.50, output: 30.00, sourceUrl: 'https://platform.openai.com/docs/pricing' },
    'gpt-4o':      { label: 'gpt-4o (legacy)', input: 2.50, cachedInput: 1.25, output: 10.00, sourceUrl: 'https://platform.openai.com/docs/pricing' },
  },
  bedrock: { parity: true, sonnet55CacheReadCutDate: '2026-10-07', ccuPrice: 0.01, sourceUrl: 'https://aws.amazon.com/bedrock/pricing/' },
  caching: { write5m: 1.25, write1h: 2.0, maxBreakpoints: 4, lookbackBlocks: 20, thinkingBilledAsOutput: true, sourceUrl: 'https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching' },
  batch: { discount: 0.5, typicalTurnaround: '< 1 hour', expiry: '24 hours', sourceUrl: 'https://docs.anthropic.com/en/docs/build-with-claude/batch-processing' },
  swebench: {
    sourceUrl: 'https://www.swebench.com/', fetched: '2026-10-13',
    rows: [
      { model: 'Claude 4.5 Opus (high)', pct: 76.8, date: '2026-02-17' },
      { model: 'Gemini 3 Flash (high)', pct: 75.8, date: '2026-02-17' },
      { model: 'Claude 4.6 Opus', pct: 75.6, date: '2026-02-17' },
      { model: 'Gemini 3 Pro Preview', pct: 74.2, date: '2025-11-18' },
      { model: 'GPT 5.2 (high)', pct: 72.8, date: '2026-02-17' },
      { model: 'Claude 4.5 Sonnet (high)', pct: 71.4, date: '2026-02-17' },
      { model: 'Claude 4.5 Sonnet', pct: 70.6, date: '2025-09-29' },
      { model: 'Claude 4.5 Haiku (high)', pct: 66.6, date: '2026-02-17' },
    ],
  },
};
