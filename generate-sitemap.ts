/**
 * generate-sitemap.ts
 *
 * Generates sitemap.xml from your blog-registry.js + a list of static routes.
 * Run as a Netlify build step (or pre-build script) so the sitemap stays in
 * sync with every new post automatically.
 *
 * Usage:
 *   npx ts-node generate-sitemap.ts
 *   (or compile with tsc and run with node)
 *
 * Expects blog-registry to export an array like:
 *   [{ slug: "modernizing-legacy-java", date: "2026-05-01", updated: "2026-05-10" }, ...]
 * Adjust the import path / shape to match your actual registry.
 */

import fs from "fs";
import path from "path";

// --- Adjust this import to match your actual blog-registry.js export ---
// If blog-registry.js is CommonJS, you can require() it instead:
// const blogRegistry = require("./blog-registry.js");
import blogRegistry from "./blog-registry"; // e.g. export default [...]

interface BlogPost {
  slug: string;
  date?: string;      // publish date, ISO format YYYY-MM-DD
  updated?: string;    // last modified date, ISO format
}

interface StaticRoute {
  path: string;        // e.g. "/", "/about", "/services"
  changefreq: "daily" | "weekly" | "monthly" | "yearly";
  priority: number;     // 0.0 - 1.0
}

const SITE_URL = "https://derivativeresearchsystems.com";
const OUTPUT_PATH = path.join(__dirname, "..", "dist", "sitemap.xml"); // adjust to your build output dir

// Static (non-blog) routes worth listing explicitly
const staticRoutes: StaticRoute[] = [
  { path: "/", changefreq: "weekly", priority: 1.0 },
  { path: "/about", changefreq: "monthly", priority: 0.8 },
  { path: "/services", changefreq: "monthly", priority: 0.9 },
  { path: "/blog", changefreq: "daily", priority: 0.8 },
  { path: "/contact", changefreq: "monthly", priority: 0.7 },
];

function isoDate(d?: string): string {
  return d ? new Date(d).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
}

function buildUrlEntry(loc: string, lastmod: string, changefreq: string, priority: number): string {
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority.toFixed(1)}</priority>
  </url>`;
}

function generateSitemap(posts: BlogPost[]): string {
  const staticEntries = staticRoutes.map((r) =>
    buildUrlEntry(`${SITE_URL}${r.path}`, isoDate(), r.changefreq, r.priority)
  );

  const postEntries = posts.map((post) =>
    buildUrlEntry(
      `${SITE_URL}/blog/${post.slug}`,
      isoDate(post.updated ?? post.date),
      "monthly",
      0.6
    )
  );

  const body = [...staticEntries, ...postEntries].join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

function main() {
  const posts: BlogPost[] = (blogRegistry as unknown as BlogPost[]) ?? [];
  const xml = generateSitemap(posts);

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, xml, "utf-8");

  console.log(`Sitemap written to ${OUTPUT_PATH} (${posts.length} posts + ${staticRoutes.length} static routes)`);
}

main();
