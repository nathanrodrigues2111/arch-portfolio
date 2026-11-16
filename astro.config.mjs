// @ts-check
import cloudflare from '@astrojs/cloudflare';
import { cacheCloudflare } from '@astrojs/cloudflare/cache';
import react from '@astrojs/react';
import { d1, r2 } from '@emdash-cms/cloudflare';
import { defineConfig } from 'astro/config';
import emdash from 'emdash/astro';

// Photos are only resized when the public site URL is known at build time.
if (process.argv.includes('build') && !process.env.EMDASH_SITE_URL) {
  console.warn('\n[arch-portfolio] EMDASH_SITE_URL is not set: photos will be served full size. Build with EMDASH_SITE_URL=https://your-site npm run deploy\n');
}

// Runs on Cloudflare Workers. Content lives in D1, photos in R2, editor at /_emdash/admin.
export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  // Pages are cached at Cloudflare's edge; EmDash purges them when content is published.
  cache: { provider: cacheCloudflare() },
  // Resized photos: cached at the edge so visitors never wait on a resize. New photos get new URLs;
  // "Replace photo" purges this cache (src/middleware.ts), so every publish shows up straight away.
  routeRules: { '/_image': { maxAge: 86400, swr: 604800 } },
  integrations: [
    react(),
    emdash({
      database: d1({ binding: 'DB', session: 'auto', coalesce: true }),
      storage: r2({ binding: 'MEDIA' }),
      admin: {
        siteName: 'Portfolio editor',
        footerLabel: false,
        // Only Projects, About me and Media stay in the sidebar.
        hiddenNavItems: ['calendar', 'comments', 'menus', 'redirects', 'widgets', 'sections', 'bylines', 'import'],
      },
    }),
  ],
  devToolbar: { enabled: false },
});
