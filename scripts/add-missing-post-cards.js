#!/usr/bin/env node
/**
 * add-missing-post-cards.js
 *
 * Reads metadata from blog HTML files that are missing from blog/index.html
 * and inserts the correct post-card HTML blocks into the post-list section.
 *
 * Run from repo root:
 *   node scripts/add-missing-post-cards.js
 */

const fs   = require('fs');
const path = require('path');

const BLOG_DIR   = path.resolve(__dirname, '../blog');
const INDEX_FILE = path.resolve(__dirname, '../blog/index.html');

// ── The 10 missing slugs (in desired display order) ───────────────────────────
const MISSING_SLUGS = [
  'ai-automation-opportunities-every-smb-should-evaluate',
  'build-vs-buy-choosing-the-right-ai-solution-for-your-business',
  'five-signs-your-java-monolith-is-holding-back-growth',
  'how-to-reduce-cloud-costs-through-application-modernization',
  'modernizing-legacy-applications-a-roadmap-for-smbs',
  'payment-modernization-without-rewriting-your-entire-platform',
  'preparing-your-organization-for-an-ai-driven-future',
  'the-hidden-cost-of-technical-debt-for-mid-market-companies',
  'why-api-first-architecture-accelerates-digital-transformation',
  'you-dont-need-a-data-scientist-to-start-using-ai',
];

// ── Metadata extractors ───────────────────────────────────────────────────────

function extractMeta(html, name) {
  const re = new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i');
  const m  = html.match(re) ||
             html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, 'i'));
  return m ? m[1].trim() : null;
}

function extractOgMeta(html, property) {
  const re = new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i');
  const m  = html.match(re) ||
             html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'));
  return m ? m[1].trim() : null;
}

function extractTitle(html) {
  // Try og:title first, then <title>, then h1
  const og = extractOgMeta(html, 'og:title');
  if (og && og.length > 5) return og;
  const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleTag) return titleTag[1].replace(/\s*[|\-–—].*$/, '').trim();
  const h1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  return h1 ? h1[1].trim() : null;
}

function extractExcerpt(html) {
  const desc = extractMeta(html, 'description');
  if (desc && desc.length > 10) return desc;
  const ogDesc = extractOgMeta(html, 'og:description');
  if (ogDesc && ogDesc.length > 10) return ogDesc;
  // Fall back to first <p> in article content
  const p = html.match(/<p[^>]*>([\s\S]+?)<\/p>/i);
  if (p) return p[1].replace(/<[^>]+>/g, '').trim().slice(0, 180);
  return '';
}

function extractDate(html) {
  // Try article:published_time, then meta name="date", then <time>
  const pub = extractOgMeta(html, 'article:published_time');
  if (pub) return pub.slice(0, 10); // YYYY-MM-DD
  const meta = extractMeta(html, 'date');
  if (meta) return meta.slice(0, 10);
  const time = html.match(/<time[^>]+datetime=["']([^"']+)["']/i);
  if (time) return time[1].slice(0, 10);
  return null;
}

function extractCategory(html) {
  const sec = extractOgMeta(html, 'article:section');
  if (sec && sec.length > 1) return sec;
  const cat = extractMeta(html, 'category');
  if (cat) return cat;
  return 'AI Adoption';
}

function formatDisplayDate(isoDate) {
  if (!isoDate) return '';
  const d = new Date(isoDate + 'T12:00:00Z');
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

function slugToTitle(slug) {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// ── Build card HTML ────────────────────────────────────────────────────────────

function buildCard(slug, postNum, meta) {
  const { title, excerpt, date, category } = meta;
  const displayDate = formatDisplayDate(date);
  const datetimeAttr = date || '';

  return `        <a href="${slug}.html" class="post-card">
          <p class="post-card-eyebrow">
            <span class="post-card-num">Post ${postNum}</span>
            <span class="post-card-dot">&middot;</span>
            <span class="post-card-category">${category}</span>
            <span class="post-card-dot">&middot;</span>
            <time datetime="${datetimeAttr}">${displayDate}</time>
          </p>
          <h2 class="post-card-title">${title}</h2>
          <p class="post-card-excerpt">${excerpt}</p>
          <p class="post-card-read">Read the post &rarr;</p>
        </a>`;
}

// ── Main ──────────────────────────────────────────────────────────────────────

let indexHtml = fs.readFileSync(INDEX_FILE, 'utf8');

// Count existing post cards to assign correct post numbers
const existingCount = (indexHtml.match(/class="post-card"/g) || []).length;
console.log(`  ℹ Found ${existingCount} existing post cards in index.html`);

// Find the insertion point — just before </section> that closes .post-list
// We look for the last </a> before </section>
const postListEnd = indexHtml.indexOf('</section>', indexHtml.indexOf('class="post-list"'));
if (postListEnd === -1) {
  console.error('  ✗ Could not find </section> closing the post-list — check index.html structure');
  process.exit(1);
}

// Build all missing cards
const newCards = [];
let postNum = existingCount + 1;

for (const slug of MISSING_SLUGS) {
  const filePath = path.join(BLOG_DIR, `${slug}.html`);
  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠  Skipping ${slug} — file not found`);
    continue;
  }

  const html    = fs.readFileSync(filePath, 'utf8');
  const title   = extractTitle(html) || slugToTitle(slug);
  const excerpt = extractExcerpt(html);
  const date    = extractDate(html);
  const category = extractCategory(html);

  const card = buildCard(slug, postNum, { title, excerpt, date, category });
  newCards.push(card);

  console.log(`  ✓ Post ${postNum}: ${title}`);
  console.log(`      date:     ${date || '(not found)'}`);
  console.log(`      category: ${category}`);
  postNum++;
}

if (!newCards.length) {
  console.log('\n  ℹ No new cards to add.\n');
  process.exit(0);
}

// Insert all new cards before the closing </section> of post-list
const insertion = '\n' + newCards.join('\n') + '\n      ';
indexHtml = indexHtml.slice(0, postListEnd) + insertion + indexHtml.slice(postListEnd);

fs.writeFileSync(INDEX_FILE, indexHtml, 'utf8');

console.log(`\n✅ Added ${newCards.length} post cards to blog/index.html\n`);
console.log('Next steps:');
console.log('  git add blog/index.html');
console.log('  git commit -m "Add missing post cards to blog index"');
console.log('  git push origin main\n');
