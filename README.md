# Enterprise Account Dossier & Claude Expansion Blueprint — Cognition AI (Devin)

A live, single-page "proof-of-work" account dossier: verified account intelligence, an interactive
Claude token-economics model (prompt caching, extended thinking, batch), three technical wedges, a
front-half MEDDPICC matrix, and a "how this was built" method section. Public sources only.

**No build step. No dependencies.** Plain HTML + CSS + JS. Deploys to Vercel as a static site.

## Files

| File | Purpose |
|---|---|
| `index.html` | The page. Loads the four scripts below. |
| `styles.css` | Design tokens + all styling (dark developer-infra aesthetic). |
| `pricing.config.js` | Every price on the page, with source URL + verification date. **Edit this to refresh prices.** |
| `data.js` | Everything specific to this account: facts, signals, presets, MEDDPICC, sources, author. **Swap this to make a dossier for another account.** |
| `calc.js` | Pure-function calculator (no DOM). `node calc.test.js` runs 11 golden tests. |
| `app.js` | UI wiring: sliders, presets, tabs, URL state, copy/print actions. |
| `build.js` | Optional: `node build.js` inlines everything into `dist/index.html` (single file). |
| `og.png` | Social preview image used by the Open Graph tags. |

## Author block (`data.js`)

```js
const author = {
  name: 'Johnny Scott',
  title: 'Outbound Systems Architect',
  linkedin: 'https://www.linkedin.com/in/johnny-b-scott/',
  email: 'jorgenllc@gmail.com',                          // mailto fallback for "Book 15 min"
  booking: 'https://scheduler.zoom.us/...',              // "Book 15 min" opens this Zoom Scheduler link
};
```

## After the first deploy — confirm the preview-image URL

`index.html` sets `og:image` to `https://cognition-devin-dossier.vercel.app/og.png`. If Vercel gives the
project a different URL, change that one line to match, otherwise LinkedIn won't show the preview card.

## Deploy on Vercel (click-by-click)

1. Go to https://vercel.com and sign in with GitHub.
2. Click **Add New…** (top right) → **Project**.
3. In the list of your GitHub repositories, find this one and click **Import**.
4. Leave every setting as it is — Framework Preset should say **Other**. There is no build command.
5. Click **Deploy**. About 30 seconds later you get a live URL like `https://<repo>.vercel.app`.
6. Optional: **Settings → Domains** to attach your own domain.

Every time a change is pushed to the `main` branch, Vercel redeploys automatically.

## Shareable scenarios

Moving any slider updates the URL hash (`#R=…&C=…&h=…`). Copy the link and the recipient sees the
same scenario. `?for=Acme` shows a "Prepared for Acme" line under the stamp (v1.1 will add analytics).

## Verify the math

```
node calc.test.js
```

## Disclaimer

Speculative account plan written as a portfolio piece. Not affiliated with, endorsed by, or produced
for Anthropic or Cognition AI. Public sources only; all calculations are illustrative estimates.
