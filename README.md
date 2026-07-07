# SEO Templates for DRS Site

Three standalone pieces — wire them into your build whenever you're ready:

## 1. `robots.txt`
Drop straight into your site's public root (same level as `index.html`).
Blocks `/admin/*`, points crawlers at the sitemap.

## 2. `generate-sitemap.ts`
Node/TypeScript script that reads your `blog-registry` and a small static
route list, and writes `sitemap.xml` to your build output dir.

- Adjust the `import blogRegistry from "./blog-registry"` line to match
  the real path/shape of your registry file.
- Adjust `OUTPUT_PATH` to match wherever Netlify serves static files from.
- Run it as a `prebuild` step in `package.json`:
  ```json
  "scripts": {
    "prebuild": "ts-node scripts/generate-sitemap.ts",
    "build": "your-existing-build-command"
  }
  ```
  or compile with `tsc` first if you're not using `ts-node` in the pipeline.

## 3. `seo-meta.ts`
Helper functions for:
- `buildHeadTags()` — title, meta description, canonical, Open Graph, Twitter Card
- `buildOrganizationSchema()` — site-wide JSON-LD, include once (root layout)
- `buildLocalBusinessSchema()` — optional, for Milwaukee/regional search visibility
- `buildArticleSchema()` — per-post JSON-LD for blog content

Fill in a single `SiteConfig` object from your `site.config.js` values, then
call `buildHeadTags(site, pageMeta)` per page/post and inject the returned
string into the `<head>`.

## Not included here (do once, outside code)
- Verify the site in Google Search Console + Bing Webmaster Tools
- Add GA4 or Plausible
- Set up a Google Business Profile if you want local map-pack visibility

Happy to wire any of this directly into your actual repo structure if you
paste in `site.config.js` / `blog-registry.js` or the relevant files.
