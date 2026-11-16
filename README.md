# Architect portfolio

Astro site with a built-in editor ([EmDash](https://github.com/emdash-cms/emdash)). Runs on Cloudflare Workers: content in D1, photos in R2, resized by Cloudflare Images. Everything fits the Cloudflare free plan.

## Editing (for the site owner)

Go to `https://<your-site>/_emdash/admin` and sign in.

- **Projects**: add, edit or remove a project. Drag photos to reorder them; the first photo is the cover. "Position on the page" sets the order on the home page (1 shows first).
- **About me**: name, intro, services, awards, email and social links on the left side.
- Click **Publish changes** and the live site updates straight away. Nothing to build or upload.

## Run locally

```bash
npm install
npm run dev
```

Site: http://localhost:4321. Editor: open http://localhost:4321/_emdash/api/setup/dev-bypass?redirect=/_emdash/admin (signs you in as a local admin and loads the starter content from `seed/seed.json`). Local data lives in `.wrangler/`; delete that folder to start fresh.

## Deploy to Cloudflare (first time)

1. `npx wrangler login`
2. `npm run deploy` (Wrangler creates the D1 database, R2 bucket and KV namespace on first deploy)
3. Open `https://<your-site>/_emdash/admin`, run the setup wizard, create your admin account with a passkey, and pick **include sample content** so the six projects and their photos are imported. The seed downloads the photos from this GitHub repo once; after that nothing depends on GitHub.
4. In **Users**, invite the site owner by email with the **Editor** role. Editors only see Projects, About me and Media.
5. Remove the unused default Categories and Tags. Signed in as admin, run this in the browser console on the admin page:
   ```js
   for (const t of ['category', 'tag']) await fetch(`/_emdash/api/taxonomies/${t}`, { method: 'DELETE', headers: { 'X-EmDash-Request': '1' } });
   ```

Later code changes: `npm run deploy`. Content changes never need a deploy.

## Code map

- Editor fields and starter content: `seed/seed.json` (applied once to an empty database)
- Data loading: `src/lib/data.ts`
- Page: `src/pages/index.astro`, styles `src/styles/global.css`
- Cloudflare config: `wrangler.jsonc`, `astro.config.mjs`
