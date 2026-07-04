// One-off: mirror the Google Fonts CSS + woff2 files for self-hosting.
import { mkdir, writeFile } from 'node:fs/promises';

const URL_CSS = 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;0,9..144,700;0,9..144,900;1,9..144,300;1,9..144,400;1,9..144,700;1,9..144,900&family=IBM+Plex+Mono:wght@400;500;600&family=Work+Sans:wght@300;400;500;600&display=swap';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const OUT_DIR = '/Users/Haro/Code/h1sort-website/public/fonts';
const OUT_CSS = '/Users/Haro/Code/h1sort-website/src/styles/fonts.css';
const KEEP_SUBSETS = new Set(['latin', 'latin-ext']);

const css = await (await fetch(URL_CSS, { headers: { 'User-Agent': UA } })).text();
await mkdir(OUT_DIR, { recursive: true });

// Split on the /* subset */ comments Google emits before each @font-face
const parts = css.split(/\/\* ([a-z-]+) \*\/\n/).slice(1);
let out = `/* Self-hosted fonts (mirrored from Google Fonts, ${KEEP_SUBSETS.size} subsets kept: ${[...KEEP_SUBSETS].join(', ')}).\n   Regenerate with the script noted in AGENTS.md if families/weights change. */\n`;
let count = 0;
const seen = new Set();
for (let i = 0; i < parts.length; i += 2) {
  const subset = parts[i];
  let block = parts[i + 1];
  if (!KEEP_SUBSETS.has(subset)) continue;
  const family = block.match(/font-family: '([^']+)'/)[1].toLowerCase().replace(/ /g, '-');
  const style = block.match(/font-style: (\w+)/)[1];
  const weight = block.match(/font-weight: ([\d ]+)/)[1].trim().replace(/ /g, '-');
  const url = block.match(/url\((\S+?)\)/)[1];
  const name = `${family}-${style}-${weight}-${subset}.woff2`;
  if (!seen.has(name)) {
    seen.add(name);
    const buf = Buffer.from(await (await fetch(url, { headers: { 'User-Agent': UA } })).arrayBuffer());
    await writeFile(`${OUT_DIR}/${name}`, buf);
    count++;
  }
  out += `/* ${subset} */\n` + block.replace(url, `/fonts/${name}`);
}
await writeFile(OUT_CSS, out);
console.log(`wrote ${count} woff2 files + fonts.css (${out.length} bytes)`);
