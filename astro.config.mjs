// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Stel SITE_URL in op het echte domein vóór publicatie (bijv. https://www.uwdomein.sr).
const site = process.env.SITE_URL || 'https://www.example.com';

export default defineConfig({
  site,
  trailingSlash: 'always',
  build: { format: 'directory' },
  // Geen inline scripts, zodat een strikte Content-Security-Policy (zonder 'unsafe-inline') mogelijk is.
  vite: { build: { assetsInlineLimit: 0 } },
  integrations: [
    sitemap({
      filter: (page) => !/\/(404|offerte-verzonden|offerte-mislukt)\//.test(page),
    }),
  ],
});
