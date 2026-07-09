#!/usr/bin/env node
/**
 * DRS OG Image Generator
 * Generates 1200x630 SVG-based OG images for each blog post
 * Converts to PNG using sharp if available, otherwise outputs SVG
 * 
 * Usage: node scripts/generate-og-images.js
 * Output: public/images/og/[slug].svg (or .jpg if sharp installed)
 */

const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

// ── Load blog registry ──────────────────────────────────────────────────────
const registryPath = path.resolve(__dirname, '../blog/blog-registry.js');
if (!fs.existsSync(registryPath)) {
  console.log('No blog-registry.js found. Run Blog Admin → Publish first.');
  process.exit(0);
}

const registryCode = fs.readFileSync(registryPath, 'utf8');
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(registryCode, sandbox);
const posts = sandbox.DRS_BLOG_POSTS || [];

if (!posts.length) {
  console.log('No posts in registry.');
  process.exit(0);
}

// ── Output directory ────────────────────────────────────────────────────────
const outDir = path.resolve(__dirname, '../images/og');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// ── SVG OG Image Generator ──────────────────────────────────────────────────
function wrapText(text, maxChars) {
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxChars) {
      if (current) lines.push(current.trim());
      current = word;
    } else {
      current = (current + ' ' + word).trim();
    }
  }
  if (current) lines.push(current.trim());
  return lines.slice(0, 3); // max 3 lines
}

function escXml(s) {
  return String(s||'')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function generateSVG(post) {
  const title  = post.title || 'DRS Insights';
  const cat    = post.category || 'Advisory';
  const date   = post.date || '';
  const lines  = wrapText(title, 32);
  const lineH  = 72;
  const startY = 280 - ((lines.length - 1) * lineH) / 2;

  const titleSVG = lines.map((line, i) =>
    `<text x="80" y="${startY + i * lineH}" font-family="Arial, sans-serif" font-weight="900" font-size="58" fill="#FFFFFF" letter-spacing="-1">${escXml(line)}</text>`
  ).join('\n    ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <!-- Background -->
  <rect width="1200" height="630" fill="#0A0A0A"/>

  <!-- Grid pattern -->
  <defs>
    <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
      <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#76b900" stroke-width="0.4" opacity="0.12"/>
    </pattern>
    <radialGradient id="glow" cx="80%" cy="20%" r="60%">
      <stop offset="0%" stop-color="#76b900" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#76b900" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#grid)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>

  <!-- Left accent bar -->
  <rect x="0" y="0" width="6" height="630" fill="#76b900"/>

  <!-- Category badge -->
  <rect x="80" y="80" width="${cat.length * 11 + 32}" height="36" fill="#76b900" rx="2"/>
  <text x="96" y="103" font-family="Arial, sans-serif" font-weight="700" font-size="14" fill="#000000" letter-spacing="2">${escXml(cat.toUpperCase())}</text>

  <!-- Title -->
  ${titleSVG}

  <!-- Bottom bar -->
  <rect x="0" y="540" width="1200" height="90" fill="#111111" opacity="0.9"/>
  <rect x="0" y="540" width="1200" height="1" fill="#222222"/>

  <!-- DRS logo mark (clipped corner polygon) -->
  <polygon points="80,562 104,562 104,594 96,602 80,602" fill="#76b900"/>
  <text x="114" y="581" font-family="Arial, sans-serif" font-weight="700" font-size="13" fill="#FFFFFF" letter-spacing="3">DRS</text>
  <text x="114" y="597" font-family="Arial, sans-serif" font-weight="400" font-size="12" fill="#888888">Derivative Research Systems</text>

  <!-- Date -->
  <text x="1120" y="587" font-family="Arial, sans-serif" font-size="13" fill="#666666" text-anchor="end">${escXml(date)}</text>

  <!-- Divider -->
  <rect x="80" y="530" width="120" height="3" fill="#76b900"/>
</svg>`;
}

// ── Generate for each post ──────────────────────────────────────────────────
let generated = 0;
for (const post of posts) {
  const slug = post.slug || post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const svgPath = path.join(outDir, `${slug}.svg`);

  // Skip if already exists
  if (fs.existsSync(svgPath)) {
    console.log(`  → skipping ${slug}.svg (already exists)`);
    continue;
  }

  const svg = generateSVG(post);
  fs.writeFileSync(svgPath, svg, 'utf8');
  console.log(`  ✓ ${slug}.svg`);
  generated++;
}

console.log(`\n✅ Generated ${generated} OG image(s) → images/og/`);
console.log('\nNote: SVG files are generated. For JPG conversion, run:');
console.log('  npm install --save-dev sharp');
console.log('  node scripts/convert-og-to-jpg.js');
console.log('\nLinkedIn accepts SVG via the og:image tag in some cases,');
console.log('but JPG at 1200x630 is most reliable. Use the LinkedIn Post Inspector');
console.log('at https://www.linkedin.com/post-inspector/ to validate each URL.');
