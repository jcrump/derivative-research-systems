# Derivative Research Systems — Site Package

## File Structure

```
drs-site/
├── index.html                  ← Homepage
├── package.json                ← npm scripts
├── netlify.toml                ← Netlify config
├── wrangler.toml               ← Cloudflare Pages config
├── .gitignore
├── admin/
│   └── index.html              ← Blog Admin CMS (local use only, excluded from dist/)
├── blog/
│   ├── index.html              ← Blog listing page
│   ├── blog-registry.js        ← Post index (exported from Admin or built by script)
│   ├── _post-template.html     ← Template reference
│   └── [slug].html             ← Individual post files (exported from Admin)
└── scripts/
    ├── build.js                ← Copies site to dist/ for deployment
    └── build-registry.js       ← Regenerates blog-registry.js from /blog/posts/*.json
```

---

## Quick Start

```bash
# Install dev tooling
npm install

# Start local dev server at http://localhost:3000
npm run dev
```

---

## Blog Workflow

### 1. Write a post
Open `admin/index.html` directly in your browser (no server needed):
```
open admin/index.html       # macOS
start admin/index.html      # Windows
xdg-open admin/index.html   # Linux
```

- Click **+ New**, fill in title / category / excerpt / tags / date
- Write in Markdown in the editor
- Click **Show Preview** for live rendering
- Click **Save Post** (persists to browser localStorage)

### 2. Export and publish
In the Admin, click **Export Files → Download All Files**. You get:
- `blog-registry.js` — drop into `blog/`
- `[slug].html` per post — drop into `blog/`

Then build and deploy:
```bash
npm run build            # copies site to dist/, skipping admin/
npm run deploy:netlify   # build + push to Netlify production
```

### Alternative: JSON-based posts (version-controlled)
If you prefer keeping posts as source files in git:
```bash
# Create blog/posts/my-post.json with fields: slug, title, excerpt, category, date, readTime, tags
# Then regenerate the registry:
npm run build:registry
```

---

## npm Commands

| Command | What it does |
|---|---|
| `npm install` | Install dev dependencies (serve, netlify-cli, wrangler, gh-pages) |
| `npm run dev` | Local dev server at **http://localhost:3000** |
| `npm run build` | Copy site to `dist/` (excludes `admin/`, `scripts/`, `node_modules/`) |
| `npm run build:registry` | Rebuild `blog-registry.js` from `blog/posts/*.json` files |
| `npm run preview` | Build then serve `dist/` at http://localhost:3001 |
| `npm run clean` | Delete `dist/` |
| `npm run deploy:netlify` | Build + deploy to **Netlify production** |
| `npm run deploy:netlify:preview` | Build + deploy to Netlify **draft URL** (no production swap) |
| `npm run deploy:cloudflare` | Build + deploy to **Cloudflare Pages production** |
| `npm run deploy:cloudflare:preview` | Build + deploy to Cloudflare Pages **preview branch** |
| `npm run deploy:gh-pages` | Build + deploy to **GitHub Pages** (`gh-pages` branch) |

---

## First-Time Deployment Setup

### Netlify
```bash
npm install
npx netlify-cli login          # authenticate with your Netlify account
npx netlify-cli init           # link or create a Netlify site (run once)
npm run deploy:netlify         # deploy to production
```

Your site URL will be printed after deploy. To set a custom domain, go to
Netlify → Site Settings → Domain Management.

### Cloudflare Pages
```bash
npm install
npx wrangler login             # authenticate with your Cloudflare account
npm run deploy:cloudflare      # deploy to production
```

On first deploy, Cloudflare will create the project. Set your custom domain
in Cloudflare Dashboard → Pages → your project → Custom Domains.

### GitHub Pages
```bash
npm install
npm run deploy:gh-pages        # pushes dist/ to the gh-pages branch
```

Then in your GitHub repo → Settings → Pages → set source to `gh-pages` branch.

---

## Environment Notes

- **Node.js 18+** required
- **No framework, no bundler** — pure static HTML, deploys anywhere
- **admin/** is excluded from `dist/` — it's a local CMS tool, not public-facing
- `blog-registry.js` must be present and up to date before running `npm run build`

---

## Contact

advisory@derivativeresearchsystems.com  
ceo@derivativeresearchsystems.com  
linkedin.com/in/jeffmcrump/
