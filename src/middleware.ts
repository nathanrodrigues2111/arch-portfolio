import { defineMiddleware } from 'astro:middleware';

// Resized photos are edge-cached under one tag (see routeRules in astro.config.mjs).
// "Replace photo" keeps the same file URL, so purge that tag whenever a replace succeeds.
const REPLACE = /^\/_emdash\/api\/media\/[^/]+\/replace\/?$/;

export const onRequest = defineMiddleware(async (context, next) => {
  const res = await next();
  if (context.request.method !== 'GET' && res.ok && REPLACE.test(context.url.pathname)) {
    try {
      const { cache } = await import('cloudflare:workers');
      await cache.purge({ tags: ['astro-path:/_image'] });
    } catch (error) {
      console.error('[cache] could not purge resized photos after replace:', error);
    }
  }
  return res;
});
