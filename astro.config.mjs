import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  site: 'https://h1sort.com',
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap()],

  build: {
    inlineStylesheets: 'auto',
  },

  adapter: cloudflare()
});