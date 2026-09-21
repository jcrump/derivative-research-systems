#!/usr/bin/env node
/**
 * generate-post-json.js
 *
 * Scans /blog/*.html, extracts metadata from each file,
 * and writes a companion .json to /blog/posts/<slug>.json
 *
 * Run from the repo root:
 *   node scripts/generate-post-json.js
 *
 * What it extracts from each HTML file:
 *   - slug:     filename without .html extension
 *   - title:    content of <title> or first <h1>
 *   - excerpt:  content of <meta name="description"> or first <p>
 *   - category: content of <meta name="category"> (optional)
 *   - date:     content of <meta name="date"> or <time datetime="..."> or today
 *   - readTime: content of <meta name="readTime"> or estimated from word count
 *   - tags:     content of <meta name="keywords"> split by comma, or []
 *
 * Add any of these meta tags to your HTML to control the output:
 *   <meta name="description" content="...">
 *   <meta name="category" content="Architecture">
 *   <meta name="date" content="2026-09-20">
 *   <meta name="readTime" content="6 min read">
 *   <meta name="keywords" content="Java, Microservices, Spring Boot">
 */

const fs   = require('fs');
const path = require('path');

const BLOG_DIR  = path.resolve(__dirname, '../blog');
const POSTS_DIR = path.resolve(__dirname, '../blog/posts');

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractMeta(html, name) {
  const re = new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i');
  const m  = html.match(re) ||
             html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, 'i'));
  return m ? m[1].trim() : null;
}

function extractTitle(html) {
  const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleTag) return titleTag[1].trim().replace(/\s*[|\-–—].*$/, '').trim();
  const h1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1) return h1[1].trim();
  return null;
}

function extractExcerpt(html) {
  // Try og:description first, then description meta, then first <p>
  const og = extractMeta(html, 'og:description') || extractMeta(html, 'description');
  if (og) return og;
  const p = html.match(/<p[^>]*>([\s\S]+?)<\/p>/i);
  if (p) return p[1].replace(/<[^>]+>/g, '').trim().slice(0, 200);
  return '';
}

function extractDate(html) {
  const meta = extractMeta(html, 'date') || extractMeta(html, 'publish-date');
  if (meta) return meta;
  const time = html.match(/<time[^>]+datetime=["']([^"']+)["']/i);
  if (time) return time[1].slice(0, 10); // take YYYY-MM-DD portion
  return new Date().toISOString().slice(0, 10);
}

function estimateReadTime(html) {
  const text  = html.replace(/<[^>]+>/g, ' ');
  const words = text.trim().split(/\s+/).length;
  const mins  = Math.max(1, Math.round(words / 200));
  return `${mins} min read`;
}

function extractTags(html) {
  const keywords = extractMeta(html, 'keywords');
  if (!keywords) return [];
  return keywords.split(',').map(t => t.trim()).filter(Boolean);
}

function slugify(filename) {
  return path.basename(filename, '.html');
}

// ── Main ──────────────────────────────────────────────────────────────────────

if (!fs.existsSync(POSTS_DIR)) {
  fs.mkdirSync(POSTS_DIR, { recursive: true });
  console.log(`  ✓ Created ${POSTS_DIR}`);
}

const htmlFiles = fs.readdirSync(BLOG_DIR)
  .filter(f => f.endsWith('.html'))
  .map(f => path.join(BLOG_DIR, f));

if (!htmlFiles.length) {
  console.log('  ℹ No .html files found in blog/ — nothing to process.');
  process.exit(0);
}

let created = 0;
let skipped = 0;

for (const file of htmlFiles) {
  const slug    = slugify(file);
  const outPath = path.join(POSTS_DIR, `${slug}.json`);

  // Skip if .json already exists (don't overwrite manual edits)
  if (fs.existsSync(outPath)) {
    console.log(`  ⟳ Skipping ${slug}.json — already exists (delete to regenerate)`);
    skipped++;
    continue;
  }

  const html  = fs.readFileSync(file, 'utf8');
  const title = extractTitle(html) || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const post = {
    slug,
    title,
    excerpt:  extractExcerpt(html),
    category: extractMeta(html, 'category') || 'Architecture',
    date:     extractDate(html),
    readTime: extractMeta(html, 'readTime') || estimateReadTime(html),
    tags:     extractTags(html),
  };

  fs.writeFileSync(outPath, JSON.stringify(post, null, 2) + '\n', 'utf8');
  console.log(`  ✓ Created ${slug}.json`);
  console.log(`      title:    ${post.title}`);
  console.log(`      date:     ${post.date}`);
  console.log(`      readTime: ${post.readTime}`);
  console.log(`      tags:     ${post.tags.join(', ') || '(none — add <meta name="keywords">)'}`);
  created++;
}

console.log(`\n✅ Done — ${created} created, ${skipped} skipped.\n`);
console.log('Next: node scripts/build-registry.js\n');
