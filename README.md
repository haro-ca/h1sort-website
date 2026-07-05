# h1sort.com

Personal website for **Carlos Alberto Haro López** — AI Engineer & Technical Product Manager.

An editorial, animation-rich site built with [Astro](https://astro.build/) and deployed to Cloudflare Pages.

- **Live:** https://h1sort.com · https://h1sort.pages.dev
- **Theme:** "Editorial Acid" — cream paper, charcoal ink, neon acid-green accent. Fraunces (display) · IBM Plex Mono (labels) · Work Sans (body).

---

## Tech stack

| Concern | Choice |
|---|---|
| Framework | Astro 5 (static output) |
| Styling | Plain CSS + a design-system stylesheet (`src/styles/global.css`) with `:root` design tokens |
| Fonts | Self-hosted woff2 (`public/fonts/` + `src/styles/fonts.css`) — Fraunces, IBM Plex Mono, Work Sans. Re-mirror with `node scripts/mirror-fonts.mjs` if families/weights change |
| SEO | Per-page meta + Open Graph via the `Base` layout; `@astrojs/sitemap` |
| Hosting | Cloudflare Workers — git-connected Worker `h1sort-website` (static assets from `dist/` + `/api/*` handled by `worker/index.ts`) |
| Assistant | "Ask Assistant" widget → Worker route `/api/chat` (`worker/index.ts`) → Claude Haiku (`claude-haiku-4-5`), streaming SSE. Grounded in `src/data/cv.md` via generated `worker/site-context.ts` |
| Runtime | Node 24, npm |

No client framework — interactivity (the sorting-canvas hero, the CV slide deck) is vanilla TypeScript in Astro `<script>` blocks.

---

## Local development

```bash
npm install        # install dependencies
npm run dev        # dev server at http://localhost:4321
npm run build      # static build -> dist/
npm run preview    # preview the production build
```

A successful `npm run build` generates **7 pages + a sitemap**.

---

## Project structure

```
h1sort-website/
├── astro.config.mjs        # site url, static output, sitemap
├── wrangler.jsonc           # Worker config: assets from dist/, /api/* worker-first
├── tsconfig.json
├── worker/
│   └── index.ts             # /api/chat — streams Claude Haiku (site assistant)
├── scripts/
│   └── cv-pdf.mjs           # renders src/data/cv.md -> public/cv.pdf (prebuild hook)
├── assets/
│   └── og-card.html         # source for public/og.png (screenshot at 1200×630 with headless Chrome)
├── public/
│   ├── favicon.svg          # acid sorting-bars mark
│   └── og.png               # social share card (1200×630)
└── src/
    ├── data/
    │   └── cv.md             # CV single source — the PDF is generated, never hand-edited
    ├── layouts/
    │   └── Base.astro        # <html> shell: fonts, SEO/OG, grain overlay, reveal observer
    ├── components/
    │   ├── CvDeck.astro      # the 7-slide animated CV
    │   └── ComingSoon.astro  # reusable on-theme placeholder
    ├── pages/
    │   ├── index.astro       # landing (animated hero + sorting viz + section index)
    │   ├── cv.astro          # renders <CvDeck />
    │   ├── writing.astro     # hub: splits into Blog + Research
    │   ├── blog.astro        # placeholder (markdown blog coming)
    │   ├── research.astro    # placeholder (matmul + systems)
    │   ├── teaching.astro    # Real-Time Data Processing course
    │   └── contact.astro     # email · LinkedIn · GitHub · X · CV PDF · location
    └── styles/
        └── global.css        # design tokens + shared utilities
```

---

## Information architecture

```
/                 Landing
├── /cv           Curriculum — animated slide deck
├── /writing      Writing hub
│   ├── /blog     Notes & essays  (markdown — planned)
│   └── /research Projects & write-ups (matmul, systems)
├── /teaching     Courses & workshops (Real-Time Data Processing)
└── /contact      Email · LinkedIn · GitHub · X · CV PDF · location
```

The landing's section index links to **Curriculum · Writing · Teaching · Contact**. Blog and Research live *under* Writing (each links back to `/writing`).

---

## Design system

All theming flows from `:root` tokens in `src/styles/global.css`. Re-skin the whole site by editing them.

```css
--bg: #f1ece1;        /* cream paper       */
--ink: #16140f;       /* charcoal          */
--acid: #c8ff3e;      /* neon accent       */
--acid-deep: #a8e01f; /* accent, links     */
--font-serif / --font-mono / --font-body
```

Shared building blocks: `.grain` (paper texture), `.acid-label`, `.marker` (painted highlight), `.reveal` + `.is-visible` (scroll-in animation, staggered via `.d1`–`.d8`), `.rule-top` / `.rule-bottom` (editorial framing), `.btn`, `.link`, `.mono-label`. All motion respects `prefers-reduced-motion`.

---

## Content management

Most content is defined as typed arrays in each page's frontmatter — edit the data, not the markup.

- **CV** — `src/components/CvDeck.astro`: `disciplines`, `santanderCards`, `fredFacts`, `accenture`, `stack`, `contact`.
- **Teaching** — `src/pages/teaching.astro`: `pipeline`, `stack`, `stats`, `repo`.
- **Contact** — `src/pages/contact.astro`: `channels`.
- **Landing nav** — `src/pages/index.astro`: `nav`.
- **CV PDF** — `src/data/cv.md`, rendered to `public/cv.pdf` by `scripts/cv-pdf.mjs` on every build (`prebuild` hook; needs Chrome locally or `CHROME_PATH`). Edit the markdown — the PDF is never touched by hand. The PDF is committed: Cloudflare Pages CI has no Chrome, so the prebuild skips there and the committed file ships. Regenerate + commit it whenever `cv.md` changes.

Blog (Markdown content collections + RSS) and the Research write-ups are planned next.

---

## Deployment

Deployed to a **git-connected Cloudflare Worker** (`h1sort-website`, Workers Builds): pushing to `main` triggers CI (`npm run build`, then `wrangler deploy` per `wrangler.jsonc`). Static assets are served from `dist/`; only `/api/*` invokes the worker script.

CI has no Chrome, so it can't regenerate the CV PDF — the committed `public/cv.pdf` ships as-is. After editing `src/data/cv.md`, run `npm run build` locally and commit the regenerated PDF with your change.

The site assistant needs the `ANTHROPIC_API_KEY` secret on the Worker (`npx wrangler versions secret put ANTHROPIC_API_KEY --name h1sort-website`); locally it reads `.dev.vars` (gitignored). Test the full site + assistant locally with `npm run build && npx wrangler dev` — the Astro dev server (`npm run dev`) does NOT serve `/api/chat`.

Manual deploy (fallback, bypasses CI): `npm run build && npx wrangler deploy`

Custom domains `h1sort.com` and `www.h1sort.com` are attached to the Worker (Settings → Domains & Routes in the dashboard; DNS + SSL auto-provisioned since the zone lives in the same account).

---

## License

© Carlos Alberto Haro López. All rights reserved.
Contact: [carlos@h1sort.com](mailto:carlos@h1sort.com) · [github.com/haro-ca](https://github.com/haro-ca)
