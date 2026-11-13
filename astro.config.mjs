// @ts-check
import { defineConfig } from 'astro/config';

// GitHub Pages serves the site under /arch-portfolio/. For a custom domain or Cloudflare Pages, drop `base`.
export default defineConfig({
  site: 'https://nathanrodrigues2111.github.io',
  base: '/arch-portfolio',
  devToolbar: { enabled: false },
});
