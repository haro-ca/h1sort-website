// Renders src/data/cv.md -> public/cv.pdf using headless Chrome.
// Runs automatically via the `prebuild` npm hook; edit the markdown, never the PDF.
import { readFile, writeFile, mkdtemp, rm, stat } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { marked } from 'marked';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(root, 'src/data/cv.md');
const OUT = join(root, 'public/cv.pdf');
// Committed fingerprint of the inputs (cv.md + this script). Chrome stamps a
// timestamp + random ID into every PDF, so without this check each build
// rewrites cv.pdf with new bytes and bloats git history for no reason.
const HASH_FILE = join(root, 'src/data/cv.pdf.hash');

const self = fileURLToPath(import.meta.url);
const inputHash = createHash('sha256')
  .update(await readFile(SRC))
  .update(await readFile(self))
  .digest('hex');

if (existsSync(OUT) && existsSync(HASH_FILE)) {
  const prev = (await readFile(HASH_FILE, 'utf8')).trim();
  if (prev === inputHash) {
    console.log('cv-pdf: inputs unchanged — keeping existing public/cv.pdf.');
    process.exit(0);
  }
}

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
].filter(Boolean);

const chrome = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!chrome) {
  // CI (Cloudflare Pages) has no Chrome — fall back to the committed PDF.
  if (existsSync(OUT)) {
    console.warn('cv-pdf: no Chrome/Chromium found — keeping existing public/cv.pdf. Regenerate locally after editing src/data/cv.md.');
    process.exit(0);
  }
  console.error('cv-pdf: no Chrome/Chromium found and public/cv.pdf is missing. Set CHROME_PATH and retry.');
  process.exit(1);
}

const md = await readFile(SRC, 'utf8');
const body = marked.parse(md, { gfm: true });

// Editorial Acid tokens, mirrored from src/styles/global.css for print.
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600;0,9..144,900;1,9..144,300;1,9..144,400&family=IBM+Plex+Mono:wght@400;500;600&family=Work+Sans:wght@300;400;500;600&display=block" rel="stylesheet">
<style>
  :root {
    --bg: #f1ece1; --ink: #16140f; --muted: #6f6a5e;
    --acid: #c8ff3e; --acid-deep: #7ea617; --rule: rgba(22, 20, 15, 0.18);
  }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  @page { size: Letter; margin: 0; }
  html, body { margin: 0; padding: 0; }
  body {
    background: var(--bg); color: var(--ink);
    font-family: 'Work Sans', system-ui, sans-serif;
    font-size: 9.4pt; font-weight: 400; line-height: 1.45;
    padding: 0.55in 0.65in;
  }
  a { color: var(--ink); text-decoration: none; border-bottom: 1px solid var(--acid-deep); }
  h1 {
    font-family: 'Fraunces', Georgia, serif; font-weight: 900;
    font-size: 26pt; line-height: 0.95; letter-spacing: -0.02em;
    margin: 0 0 4pt; font-variation-settings: 'opsz' 144;
  }
  h2 {
    font-family: 'IBM Plex Mono', monospace; font-weight: 600;
    font-size: 8pt; letter-spacing: 0.18em; text-transform: uppercase;
    margin: 14pt 0 5pt; padding-top: 6pt; border-top: 1px solid var(--ink);
    break-after: avoid;
  }
  /* The h2 directly under the name is the role line, not a section label */
  h1 + h2 {
    font-family: 'Fraunces', Georgia, serif; font-style: italic; font-weight: 400;
    font-size: 12.5pt; letter-spacing: 0; text-transform: none;
    border-top: none; margin: 0 0 5pt; padding-top: 0; color: var(--ink);
  }
  /* Contact line right after the role */
  h1 + h2 + p { font-family: 'IBM Plex Mono', monospace; font-size: 7.6pt; color: var(--muted); margin: 0 0 8pt; }
  h1 + h2 + p a { border-bottom: none; color: var(--muted); }
  h3 {
    font-family: 'Fraunces', Georgia, serif; font-weight: 600;
    font-size: 12.5pt; letter-spacing: -0.01em; margin: 10pt 0 4pt;
    break-after: avoid;
  }
  h3 .when {
    font-family: 'IBM Plex Mono', monospace; font-weight: 500; font-size: 7.6pt;
    letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted);
    float: right; margin-top: 4pt;
  }
  p { margin: 3pt 0; }
  /* Project title lines: bold lead + italic role */
  h3 ~ p > strong:first-child { font-family: 'Fraunces', Georgia, serif; font-size: 10.5pt; }
  ul { margin: 2pt 0 6pt; padding-left: 12pt; }
  li { margin: 1.5pt 0; }
  li::marker { color: var(--acid-deep); }
  .page-break { break-after: page; }
  .page-break + * { margin-top: 40pt; }
  strong { font-weight: 600; }
  em { font-style: italic; color: var(--muted); }
  /* Acid marker on the summary bold phrase */
  h1 + h2 + p + p strong {
    background: linear-gradient(180deg, transparent 55%, var(--acid) 55%, var(--acid) 92%, transparent 92%);
  }
</style>
</head>
<body>${body}</body>
</html>`;

const tmp = await mkdtemp(join(tmpdir(), 'cv-pdf-'));
const page = join(tmp, 'cv.html');
await writeFile(page, html);

try {
  await promisify(execFile)(chrome, [
    '--headless=new',
    '--disable-gpu',
    '--no-pdf-header-footer',
    '--virtual-time-budget=15000',
    `--print-to-pdf=${OUT}`,
    `file://${page}`,
  ]);
  const { size } = await stat(OUT);
  if (size < 10_000) throw new Error(`output suspiciously small (${size} bytes)`);
  await writeFile(HASH_FILE, inputHash + '\n');
  console.log(`cv-pdf: wrote public/cv.pdf (${(size / 1024).toFixed(0)} KB)`);
} finally {
  await rm(tmp, { recursive: true, force: true });
}
