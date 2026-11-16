# Architect portfolio

Astro site with a built-in editor ([EmDash](https://github.com/emdash-cms/emdash)). Runs on Cloudflare Workers: content in D1, photos added as links (R2 uploads later), resized by Cloudflare Images. Everything fits the Cloudflare free plan.

## Editing (for the site owner)

Go to `https://<your-site>/_emdash/admin` and sign in with your username (or email) and password.

- **Passwords**: `https://<your-site>/_emdash/admin/passwords` changes your own password. Admins also add accounts there (pick Editor for someone who only edits content) and reset other people's passwords.

- **Projects**: add, edit or remove a project. Each photo is either an upload or a pasted image link (Google Drive works if the file is shared as "Anyone with the link"), not both. Drag photos to reorder them; the first photo is the cover. Uploading does not work until R2 is on (see below). "Position on the page" sets the order on the home page (1 shows first).
- **About me**: name, intro, services, awards, email and social links on the left side.
- Click **Publish changes** and the live site updates straight away. Nothing to build or upload.

## Run locally

```bash
npm install
npm run dev
```

Site: http://localhost:4321. Editor: open http://localhost:4321/_emdash/api/setup/dev-bypass?redirect=/_emdash/admin (signs you in as a local admin and loads the starter content from `seed/seed.json`). Local data lives in `.wrangler/`; delete that folder to start fresh.

## Live site

https://spatialdiscourse.pages.dev. The `spatialdiscourse` Worker runs the site and editor (D1 `spatialdiscourse`, KV `spatialdiscourse-session`). The Pages project `spatialdiscourse` (`pages-proxy/`) only forwards to the Worker; the workers.dev URL redirects there.

- Code changes: `EMDASH_SITE_URL=https://spatialdiscourse.pages.dev npm run deploy` (without it photos ship full size).
- Proxy changes: copy `pages-proxy/` outside the repo (wrangler otherwise picks up the main build config), then run `npx wrangler pages deploy --branch main --force` there.
- Setup is already complete; no setup wizard. To remove the default Categories and Tags (signed in as admin, in the browser console on the admin page):
  ```js
  for (const t of ['category', 'tag']) await fetch(`/_emdash/api/taxonomies/${t}`, { method: 'DELETE', headers: { 'X-EmDash-Request': '1' } });
  ```

### Sign-in

Username + password replaces EmDash's passkey login (`src/auth/`, wired as an `authProviders` entry in `astro.config.mjs`; `/_emdash/admin/login` is our own page). Passwords are PBKDF2-SHA256 hashes (100k iterations, the Workers maximum, random salt) in the D1 table `user_passwords`; the session is EmDash's own cookie. 5 wrong passwords for one username (or 20 from one IP) lock sign-in for up to 15 minutes. Check the hashing with `node scripts/check-password.ts`.

Locked out or forgot the password:

```bash
# Clear the lockout
npx wrangler d1 execute spatialdiscourse --remote --command "DELETE FROM _emdash_rate_limits WHERE key LIKE 'pwlogin:%'"
# Set a new password: make a hash locally, then store it
node -e "import('./src/lib/password.ts').then(m => m.hashPassword(process.argv[1])).then(console.log)" 'new-password-here'
npx wrangler d1 execute spatialdiscourse --remote --command "UPDATE user_passwords SET hash = '<hash from above>' WHERE username = 'pamelina'"
```

### Turning on photo uploads (R2)

1. Enable R2 in the Cloudflare dashboard (R2 Object Storage).
2. `npx wrangler r2 bucket create spatialdiscourse-media`
3. In `wrangler.jsonc` add `"r2_buckets": [{ "binding": "MEDIA", "bucket_name": "spatialdiscourse-media" }],` and in `astro.config.mjs` import `r2` from `@emdash-cms/cloudflare` and set `storage: r2({ binding: 'MEDIA' })` (where the `ponytail:` note is).
4. Deploy as above. Photo links keep working next to uploads.

## Caching

- Pages are cached at Cloudflare's edge (1 hour, served stale up to a day while refreshing). Publishing purges them immediately.
- Resized photos are edge-cached for a day. New photos get new URLs; "Replace photo" purges the photo cache (`src/middleware.ts`).
- Signed-in editors always get fresh, uncached pages.

## Code map

- Editor fields and starter content: `seed/seed.json` (applied once to an empty database)
- Data loading: `src/lib/data.ts`
- Page: `src/pages/index.astro`, styles `src/styles/global.css`
- Cloudflare config: `wrangler.jsonc`, `astro.config.mjs`

## GitHub Pages preview (static, no editor)

GitHub Pages can't run the editor, so it gets a static snapshot of the current site from the `gh-pages` branch.

```bash
EMDASH_SITE_URL=http://localhost:4330 npm run build && npx astro preview --port 4330 &
python3 -I scripts/pages-snapshot.py http://localhost:4330 dist/client /tmp/pages /arch-portfolio
# then force-push /tmp/pages as the gh-pages branch
```
