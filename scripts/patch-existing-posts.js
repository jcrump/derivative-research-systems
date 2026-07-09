const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

// Load registry to get post metadata
const registryPath = path.resolve(__dirname, '../blog/blog-registry.js');
const registryCode = fs.readFileSync(registryPath, 'utf8');
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(registryCode, sandbox);
const posts = sandbox.DRS_BLOG_POSTS || [];

const blogDir = path.resolve(__dirname, '../blog');
const htmlFiles = fs.readdirSync(blogDir).filter(f =>
  f.endsWith('.html') && f !== 'index.html' && !f.startsWith('_')
);

if (!htmlFiles.length) {
  console.log('No published blog post HTML files found in blog/.');
  console.log('Re-export your posts from the Blog Admin after downloading the new ZIP.');
  process.exit(0);
}

let patched = 0;
for (const file of htmlFiles) {
  const slug = file.replace('.html', '');
  const filePath = path.join(blogDir, file);
  let html = fs.readFileSync(filePath, 'utf8');

  // Skip if already has OG tags
  if (html.includes('og:title')) {
    console.log(`  → skipping ${file} (already has OG tags)`);
    continue;
  }

  // Find matching post in registry
  const post = posts.find(p => (p.slug || '') === slug);
  const title    = post ? post.title   : slug.replace(/-/g, ' ');
  const excerpt  = post ? post.excerpt : '';
  const category = post ? post.category : '';
  const date     = post ? post.date    : '';
  const isoDate  = date ? new Date(date).toISOString() : new Date().toISOString();

  function esc(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  const ogTags = `
  <!-- Open Graph — LinkedIn, Facebook, Slack previews -->
  <meta property="og:type"        content="article"/>
  <meta property="og:site_name"   content="Derivative Research Systems"/>
  <meta property="og:title"       content="${esc(title)}"/>
  <meta property="og:description" content="${esc(excerpt)}"/>
  <meta property="og:url"         content="https://derivativeresearchsystems.com/blog/${slug}"/>
  <meta property="og:image"       content="https://derivativeresearchsystems.com/images/og/${slug}.jpg"/>
  <meta property="og:image:width"  content="1200"/>
  <meta property="og:image:height" content="630"/>
  <meta property="og:image:alt"   content="${esc(title)} — DRS Insights"/>
  <meta property="article:author"         content="Jeff Crump"/>
  <meta property="article:published_time" content="${isoDate}"/>
  <meta property="article:section"        content="${esc(category)}"/>
  <!-- Twitter Card -->
  <meta name="twitter:card"        content="summary_large_image"/>
  <meta name="twitter:title"       content="${esc(title)}"/>
  <meta name="twitter:description" content="${esc(excerpt)}"/>
  <meta name="twitter:image"       content="https://derivativeresearchsystems.com/images/og/${slug}.jpg"/>
  <meta name="twitter:image:alt"   content="${esc(title)} — DRS Insights"/>
  <!-- Canonical -->
  <link rel="canonical" href="https://derivativeresearchsystems.com/blog/${slug}"/>`;

  // Insert after the <meta name="description"> tag
  html = html.replace(
    /(<meta name="description"[^>]+>)/,
    `$1\n${ogTags}`
  );

  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`  ✓ patched ${file}`);
  patched++;
}

console.log(`\n✅ Patched ${patched} existing post(s) with OG tags.`);
