/**
 * generate-sitemap.ts
 *
 * Generates sitemap.xml from site.config.js + a static route list, and
 * (once wired) blog-registry.js for per-post URLs.
 *
 * Usage:
 *   npx ts-node scripts/generate-sitemap.ts
 * as a `prebuild` step:
 *   "scripts": { "prebuild": "ts-node scripts/generate-sitemap.ts" }
 *
 * STATUS: fully wired. Domain comes from site.config.js, post URLs come
 * from blog-registry.js (both loaded via the VM-sandbox loaders since
 * neither file uses module.exports).
 */

import fs from "fs";
import path from "path";
import { loadSiteConfig } from "./load-site-config";
import { loadBlogRegistry, toIsoDate } from "./load-blog-registry";

interface StaticRoute {
  path: string;
  changefreq: "daily" | "weekly" | "monthly" | "yearly";
  priority: number;
}

// TODO: confirm against your actual router/nav — inferred from
// site.config.js sections (hero, services, blogCategories, contact).
const staticRoutes: StaticRoute[] = [
  { path: "/", changefreq: "weekly", priority: 1.0 },
  { path: "/services", changefreq: "monthly", priority: 0.9 },
  { path: "/about", changefreq: "monthly", priority: 0.8 },
  { path: "/blog", changefreq: "daily", priority: 0.8 },
  { path: "/contact", changefreq: "monthly", priority: 0.7 },
];

// Adjust to wherever Netlify serves static files from (e.g. "dist", "public", "out").
const OUTPUT_PATH = path.join(__dirname, "..", "dist", "sitemap.xml");

function urlEntry(loc: string, changefreq: string, priority: number, lastmod?: string): string {
  return [
    "  <url>",
    `    <loc>${loc}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : "",
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority.toFixed(1)}</priority>`,
    "  </url>",
  ]
    .filter(Boolean)
    .join("\n");
}

function main() {
  const config = loadSiteConfig();
  const domain = config.brand.domain.replace(/\/+$/, "");
  const baseUrl = `https://${domain}`;

  const entries: string[] = staticRoutes.map((r) =>
    urlEntry(`${baseUrl}${r.path}`, r.changefreq, r.priority)
  );

  // Blog posts — registry has no separate "updated" field, so <lastmod>
  // falls back to the post's publish date. Posts whose date string fails
  // to parse are still included, just without a <lastmod>.
  const posts = loadBlogRegistry();
  for (const post of posts) {
    entries.push(
      urlEntry(`${baseUrl}/blog/${post.slug}`, "monthly", 0.6, toIsoDate(post.date))
    );
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    "</urlset>",
  ].join("\n");

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, xml, "utf-8");
  console.log(`Sitemap written to ${OUTPUT_PATH} (${entries.length} URLs, domain: ${domain})`);
}

main();
