import handler, { createScheduledHandler, PluginBridge } from '@emdash-cms/cloudflare/worker';

export { PluginBridge };

// The public site is the Pages proxy (pages-proxy/). Its service binding forwards the pages.dev URL,
// so only direct visits to the workers.dev URL are redirected.
const SITE = 'https://spatialdiscourse.pages.dev';

export default {
  ...handler,
  fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.hostname.endsWith('.workers.dev')) return Response.redirect(SITE + url.pathname + url.search, 301);
    return handler.fetch!(request, env, ctx);
  },
  scheduled: createScheduledHandler(),
} satisfies ExportedHandler;
