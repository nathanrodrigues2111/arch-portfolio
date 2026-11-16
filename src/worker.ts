import handler, { createScheduledHandler, PluginBridge } from '@emdash-cms/cloudflare/worker';
import { WorkerEntrypoint } from 'cloudflare:workers';

export { PluginBridge };

// The public site is the Pages proxy (pages-proxy/), bound to the cached Site entrypoint below.
// The default entrypoint (workers.dev) has the cache off in wrangler.jsonc, so its redirect always runs.
export class Site extends WorkerEntrypoint {
  fetch(request: Request) {
    return handler.fetch!(request, this.env as never, this.ctx);
  }
}

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
