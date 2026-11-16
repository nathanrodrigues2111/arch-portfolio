import { defineMiddleware } from 'astro:middleware';

// Resized photos are edge-cached under one tag (see routeRules in astro.config.mjs).
// "Replace photo" keeps the same file URL, so purge that tag whenever a replace succeeds.
const REPLACE = /^\/_emdash\/api\/media\/[^/]+\/replace\/?$/;
// Setup imports the starter content without a publish, so drop the empty home page cached before it.
const SETUP = /^\/_emdash\/api\/setup\/?$/;

export const onRequest = defineMiddleware(async (context, next) => {
  const res = await next();
  const tag = REPLACE.test(context.url.pathname) ? 'astro-path:/_image' : SETUP.test(context.url.pathname) ? 'astro-path:/' : '';
  if (context.request.method !== 'GET' && res.ok && tag) {
    try {
      const { cache } = await import('cloudflare:workers');
      await cache.purge({ tags: [tag] });
    } catch (error) {
      console.error('[cache] could not purge after replace or setup:', error);
    }
  }
  return res;
});
