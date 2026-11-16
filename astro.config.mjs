// @ts-check
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import { d1, r2 } from '@emdash-cms/cloudflare';
import { defineConfig } from 'astro/config';
import emdash from 'emdash/astro';

// Runs on Cloudflare Workers. Content lives in D1, photos in R2, editor at /_emdash/admin.
export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
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
