# AGENTS.md

Context and conventions for AI coding assistants working in this repo. Read this before making changes.

## What this is

The personal website for **Carlos Alberto Haro** at **h1sort.com** — an Astro 5 static site with an editorial "Acid" aesthetic, deployed to a git-connected Cloudflare Worker. Interactivity is vanilla TypeScript in Astro `<script>` blocks (no React/Vue/etc.).

## Commands

```bash
npm run dev      # dev server (http://localhost:4321)
npm run build    # prebuild: src/data/cv.md -> public/cv.pdf, then static build -> dist/  (MUST pass; 8 pages + sitemap)
npm run preview  # preview the production build
```

Always run `npm run build` after changes to verify the site still generates.

## Golden rules

- **Stay on-theme.** Use the design tokens and utilities in `src/styles/global.css`. Do not introduce new colors, fonts, or a CSS framework. Re-skinning happens through `:root` variables only.
- **Fonts are self-hosted** (`public/fonts/` + `src/styles/fonts.css`, imported by `global.css`) — no Google Fonts links in layouts. To change families/weights, edit the URL inside `scripts/mirror-fonts.mjs` and re-run it.
- **No client frameworks.** Keep interactivity in vanilla TS `<script>` blocks inside `.astro` files.
- **Respect motion prefs.** Any animation must degrade under `prefers-reduced-motion` (global CSS already dampens transitions/animations; canvas/JS effects must check `matchMedia('(prefers-reduced-motion: reduce)')`).
- **Content lives in frontmatter data arrays**, not inline in markup. Edit the data.
- **No em dashes in copy**, anywhere: pages, `cv.md`, meta descriptions, the assistant's system prompt. Use commas, colons, periods, or the site's `·` separator; en dashes only for numeric ranges.
- **Never reintroduce the phone number.** It was intentionally removed for privacy. Contact = email + LinkedIn (`linkedin.com/in/h1sort`) + GitHub (`github.com/haro-ca`) + X (`x.com/h1sort`) + CV PDF + location only.
- **The CV PDF is generated, never hand-edited.** `src/data/cv.md` is the single source; `scripts/cv-pdf.mjs` renders it to `public/cv.pdf` via the `prebuild` npm hook — needs Chrome locally, or set `CHROME_PATH`. The PDF is **committed** because CI (Workers Builds) has no Chrome and reuses it (prebuild skips with a warning there). After editing `src/data/cv.md`, always run a local build and commit the regenerated `public/cv.pdf` alongside it, plus the `src/data/cv.pdf.hash` sidecar: the script fingerprints its inputs (cv.md + itself) and skips regeneration when they are unchanged, so unrelated builds don't rewrite the PDF's bytes (Chrome stamps a timestamp/ID into every render) and bloat git history.
- **`WEBSITE_BRIEF.md` and `h1sort.png` are gitignored / local-only.** They are the source brief & a CV screenshot — never publish or commit them.
- **Don't commit secrets.** No API tokens, no account/zone IDs in code or docs.

## Architecture

- `src/layouts/Base.astro` — the only HTML shell. Injects fonts, SEO/OG meta (props: `title`, `description`, `path`), the `.grain` overlay, and a global `IntersectionObserver` that adds `.is-visible` to any `.reveal` element. Every page wraps its content in `<Base>`.
- `src/pages/*.astro` — one file per route (see IA below).
- `src/components/CvDeck.astro` — the animated CV: a scroll-snap slide deck with nav dots, progress bar, and keyboard nav. It is a self-contained deck (its own `.deck` scroll container so snapping doesn't leak to other pages).
- `src/components/ComingSoon.astro` — reusable placeholder. Props: `section`, `title`, `blurb`, `tag?`, `back?`, `backLabel?`, `status?`.
- `src/styles/global.css` — design tokens (`:root`) + shared utilities.
- `src/components/AskWidget.astro` — "Ask Assistant" pill fixed top-center that opens a right lateral chat panel (rendered by Base on every page). Talks to `/api/chat`, handled by `worker/index.ts` — a Cloudflare Worker route that streams Claude Haiku (`claude-haiku-4-5`) answers. Grounding context is generated into `worker/site-context.ts` (gitignored) from `src/data/cv.md` by `scripts/build-chat-context.mjs` (prebuild). The `ANTHROPIC_API_KEY` secret lives on the Worker / `.dev.vars` locally — NEVER in client code or the repo. Test with `npm run build && npx wrangler dev` (the Astro dev server does **not** serve `/api/chat`).
- **Conversations are logged to D1** (database `h1sort-chat`, binding `DB` in `wrangler.jsonc`). The widget sends a per-tab `conversationId` (sessionStorage UUID); the worker tees the SSE stream and persists each user/assistant turn via `ctx.waitUntil`, fail-open (a D1 error never breaks the chat; no `conversationId` = no logging). Schema lives in `migrations/` — apply with `npx wrangler d1 migrations apply h1sort-chat --local` (dev) and `--remote` (prod). Inspect with `npx wrangler d1 execute h1sort-chat --remote --command "SELECT ..."`.

## Information architecture

```
/  ├── /talking            public talks, live sessions & threads
   ├── /writing            hub → /blog + /research
   │     ├── /blog         placeholder (markdown blog planned)
   │     └── /research     placeholder (matmul + systems)
   ├── /teaching           Real-Time Data Processing course
   ├── /cv                 (renders <CvDeck/>)
   └── /contact
```

Landing nav = **Talking · Writing · Teaching · CV · Contact** (01–05; inner-page headers carry the number). Blog & Research sit under Writing and link back to `/writing`. The `real-time-data-processing-class` belongs to **Teaching**, not Research. The landing footer is a social strip (GitHub · LinkedIn · X + email), not a signature.

## Design system cheatsheet

Tokens (in `global.css`): `--bg`, `--bg-warm`, `--ink`, `--ink-soft`, `--muted`, `--acid`, `--acid-deep`, `--rule`, `--card`, `--font-serif|mono|body`, sizing clamps, `--ease`.

Utilities: `.grain`, `.acid-label`, `.mono-label`, `.marker` (paints when its `.reveal` ancestor gains `.is-visible`), `.reveal` + `.d1`–`.d8` (staggered scroll-in), `.rule-top` / `.rule-bottom`, `.btn` / `.btn-ghost`, `.link`.

Page-scoped styles go in the page's own `<style>` block. Reuse tokens; don't hardcode hex values.

## How to add a section/page

1. Create `src/pages/<name>.astro`, wrap content in `<Base title=... description=... path="/<name>">`.
2. Reuse the editorial framing: `.rule-top` with the brand mark linking `/`, an `.acid-label`, a serif title, `.reveal` on entrance elements.
3. Put repeated content in a frontmatter data array and `.map()` it.
4. Add it to the landing `nav` array (or the `/writing` hub) if it's a top-level destination.
5. `npm run build` and confirm the new route appears.

## Content locations

| Content | File · array |
|---|---|
| Landing nav | `src/pages/index.astro` · `nav` |
| Talks | `src/pages/talking.astro` · `talks` |
| CV slides | `src/components/CvDeck.astro` · `disciplines`, `santanderCards`, `fredFacts`, `accenture`, `stack`, `contact` |
| Teaching | `src/pages/teaching.astro` · `pipeline`, `stack`, `stats`, `repo` |
| Contact | `src/pages/contact.astro` · `channels` |
| CV PDF | `src/data/cv.md` — rendered to `public/cv.pdf` by `scripts/cv-pdf.mjs` (prebuild) |

## Deployment

Git-connected **Cloudflare Worker** `h1sort-website` (Workers Builds), production branch `main` — pushing to `main` triggers CI (`npm run build`, then `wrangler deploy` per `wrangler.jsonc`). Static assets are served from `dist/`; only `/api/*` invokes `worker/index.ts` (`run_worker_first`). Manual fallback:

```bash
npm run build
npx wrangler deploy
```

Gotchas:
- **`main` is protected** (GitHub ruleset: no direct pushes, no force-pushes, no deletion). Work on a branch and merge via PR.
- **CI has no Chrome** — `scripts/cv-pdf.mjs` skips PDF generation there and the committed `public/cv.pdf` ships. Any change to `src/data/cv.md` must be accompanied by a locally regenerated, committed `public/cv.pdf` (a local `npm run build` does it).
- The assistant secret lives on the Worker: `npx wrangler versions secret put ANTHROPIC_API_KEY --name h1sort-website`. Locally, `.dev.vars` (gitignored).
- `h1sort.com` + `www.h1sort.com` are attached to the Worker (dashboard → h1sort-website → Settings → Domains & Routes); DNS + SSL auto-provision because the zone is in the same Cloudflare account.
- The account/zone IDs are in the Cloudflare dashboard — do not hardcode them in the repo.

## Definition of done

- `npm run build` passes with no errors (8 pages + sitemap).
- Layout fits the viewport where intended and reflows cleanly at mobile widths.
- Animations are subtle and reduced-motion-safe.
- No secrets, no phone number, no brief/screenshot committed.
