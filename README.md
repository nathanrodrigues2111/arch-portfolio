# Architect portfolio

Astro static site. Deploys to Cloudflare Pages as-is.

## Run

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # outputs dist/
```

## Edit content

- Site name, intro, email, socials: `src/site.json`
- Projects: one folder per project in `src/content/projects/<slug>/`
  - `index.md` holds title, location, year, type, area, status, order, image list, and the description text
  - drop images (jpg/png) next to it and list them in `images:`; the first image is the cover
  - images are resized and converted to webp at build time
- Layout and left panel: `src/pages/index.astro`, styles in `src/styles/global.css`
- Projects open in place on the home page at `/#<slug>`

## Hosting

GitHub Pages: every push to `main` builds and deploys via `.github/workflows/deploy.yml`.
Live at https://nathanrodrigues2111.github.io/arch-portfolio/

Cloudflare Pages later: build command `npm run build`, output directory `dist`, and remove `base` from `astro.config.mjs`.
