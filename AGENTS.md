# AGENTS.md

Context and conventions for AI coding assistants working in this repo. Read this before making changes.

## What this is

The personal website for **Carlos Alberto Haro** at **h1sort.com** — an Astro 5 static site with an editorial "Acid" aesthetic, deployed to Cloudflare Pages. Interactivity is vanilla TypeScript in Astro `<script>` blocks (no React/Vue/etc.).

## Commands

```bash
npm run dev      # dev server (http://localhost:4321)
npm run build    # prebuild: src/data/cv.md -> public/cv.pdf, then static build -> dist/  (MUST pass; 7 pages + sitemap)
npm run preview  # preview the production build
```

Always run `npm run build` after changes to verify the site still generates.

## Golden rules

- **Stay on-theme.** Use the design tokens and utilities in `src/styles/global.css`. Do not introduce new colors, fonts, or a CSS framework. Re-skinning happens through `:root` variables only.
- **No client frameworks.** Keep interactivity in vanilla TS `<script>` blocks inside `.astro` files.
- **Respect motion prefs.** Any animation must degrade under `prefers-reduced-motion` (global CSS already dampens transitions/animations; canvas/JS effects must check `matchMedia('(prefers-reduced-motion: reduce)')`).
- **Content lives in frontmatter data arrays**, not inline in markup. Edit the data.
- **Never reintroduce the phone number.** It was intentionally removed for privacy. Contact = email + LinkedIn (`linkedin.com/in/h1sort`) + GitHub (`github.com/haro-ca`) + X (`x.com/h1sort`) + CV PDF + location only.
- **The CV PDF is generated, never hand-edited.** `src/data/cv.md` is the single source; `scripts/cv-pdf.mjs` renders it to `public/cv.pdf` (gitignored) via the `prebuild` npm hook — needs Chrome locally, or set `CHROME_PATH`. Edit the markdown, run the build.
- **`WEBSITE_BRIEF.md` and `h1sort.png` are gitignored / local-only.** They are the source brief & a CV screenshot — never publish or commit them.
- **Don't commit secrets.** No API tokens, no account/zone IDs in code or docs.

## Architecture

- `src/layouts/Base.astro` — the only HTML shell. Injects fonts, SEO/OG meta (props: `title`, `description`, `path`), the `.grain` overlay, and a global `IntersectionObserver` that adds `.is-visible` to any `.reveal` element. Every page wraps its content in `<Base>`.
- `src/pages/*.astro` — one file per route (see IA below).
- `src/components/CvDeck.astro` — the animated CV: a scroll-snap slide deck with nav dots, progress bar, and keyboard nav. It is a self-contained deck (its own `.deck` scroll container so snapping doesn't leak to other pages).
- `src/components/ComingSoon.astro` — reusable placeholder. Props: `section`, `title`, `blurb`, `tag?`, `back?`, `backLabel?`, `status?`.
- `src/styles/global.css` — design tokens (`:root`) + shared utilities.

## Information architecture

```
/  ├── /cv                 (renders <CvDeck/>)
   ├── /writing            hub → /blog + /research
   │     ├── /blog         placeholder (markdown blog planned)
   │     └── /research     placeholder (matmul + systems)
   ├── /teaching           Real-Time Data Processing course
   └── /contact
```

Landing nav = **Curriculum · Writing · Teaching · Contact**. Blog & Research sit under Writing and link back to `/writing`. The `real-time-data-processing-class` belongs to **Teaching**, not Research.

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
| CV slides | `src/components/CvDeck.astro` · `disciplines`, `santanderCards`, `fredFacts`, `accenture`, `stack`, `contact` |
| Teaching | `src/pages/teaching.astro` · `pipeline`, `stack`, `stats`, `repo` |
| Contact | `src/pages/contact.astro` · `channels` |
| CV PDF | `src/data/cv.md` — rendered to `public/cv.pdf` by `scripts/cv-pdf.mjs` (prebuild) |

## Deployment

Cloudflare Pages, project **`h1sort`**, production branch `main`.

```bash
npm run build
wrangler pages deploy dist --project-name h1sort --branch main
```

Gotchas:
- The installed **wrangler has no `pages domain` subcommand**. Manage custom domains via the Cloudflare dashboard (Workers & Pages → h1sort → Custom domains) or the Pages domains API: `POST /accounts/{account_id}/pages/projects/h1sort/domains` with `{"name":"<domain>"}`.
- `h1sort.com` + `www.h1sort.com` are already attached; DNS + SSL auto-provision because the zone is in the same Cloudflare account.
- The account/zone IDs are in the Cloudflare dashboard — do not hardcode them in the repo.

## Definition of done

- `npm run build` passes with no errors (7 pages + sitemap).
- Layout fits the viewport where intended and reflows cleanly at mobile widths.
- Animations are subtle and reduced-motion-safe.
- No secrets, no phone number, no brief/screenshot committed.
