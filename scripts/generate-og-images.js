#!/usr/bin/env node
/**
 * DRS OG Image Generator
 * Generates 1200x630 JPG OG images for each blog post
 * Uses 'canvas' npm package — install once with: npm install canvas
 *
 * Usage: node scripts/generate-og-images.js
 * Output: images/og/[slug].jpg
 */

const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

// ── Check canvas is available ───────────────────────────────────────────────
let createCanvas;
try {
  ({ createCanvas } = require('canvas'));
} catch (e) {
  console.error('\n❌ Missing dependency. Run:\n\n  npm install canvas\n\nthen retry.\n');
  process.exit(1);
}

// ── Load blog registry ──────────────────────────────────────────────────────
const registryPath = path.resolve(__dirname, '../blog/blog-registry.js');
if (!fs.existsSync(registryPath)) {
  console.log('No blog-registry.js found. Publish from Blog Admin first.');
  process.exit(0);
}
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(registryPath, 'utf8'), sandbox);
const posts = sandbox.DRS_BLOG_POSTS || [];

if (!posts.length) {
  console.log('No posts in registry.');
  process.exit(0);
}

// ── Output directory ────────────────────────────────────────────────────────
const outDir = path.resolve(__dirname, '../images/og');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// ── Remove old SVG files ────────────────────────────────────────────────────
const oldSVGs = fs.readdirSync(outDir).filter(f => f.endsWith('.svg'));
for (const f of oldSVGs) {
  fs.unlinkSync(path.join(outDir, f));
  console.log(`  🗑  removed ${f}`);
}

// ── Word wrap helper ────────────────────────────────────────────────────────
function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3); // max 3 lines
}

// ── Draw one OG image and save as JPG ──────────────────────────────────────
function generateJPG(post, outPath) {
  const W = 1200, H = 630;
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#0A0A0A';
  ctx.fillRect(0, 0, W, H);

  // Subtle grid
  ctx.strokeStyle = 'rgba(118,185,0,0.07)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
  for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

  // Radial glow top-right
  const glow = ctx.createRadialGradient(W*0.85, H*0.15, 0, W*0.85, H*0.15, 500);
  glow.addColorStop(0, 'rgba(118,185,0,0.18)');
  glow.addColorStop(1, 'rgba(118,185,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Left accent bar
  ctx.fillStyle = '#76b900';
  ctx.fillRect(0, 0, 6, H);

  // Category badge
  const cat = (post.category || 'Advisory').toUpperCase();
  ctx.font = 'bold 14px Arial';
  const catW = ctx.measureText(cat).width + 32;
  ctx.fillStyle = '#76b900';
  ctx.fillRect(80, 72, catW, 36);
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 14px Arial';
  ctx.fillText(cat, 96, 96);

  // Title
  const title = post.title || 'DRS Insights';
  ctx.font = 'bold 58px Arial';
  ctx.fillStyle = '#FFFFFF';
  const lines = wrapText(ctx, title, W - 160);
  const lineH = 72;
  const totalH = lines.length * lineH;
  const startY = (H - totalH) / 2 + 20;
  lines.forEach((line, i) => {
    ctx.fillText(line, 80, startY + i * lineH);
  });

  // Green underline accent
  ctx.fillStyle = '#76b900';
  ctx.fillRect(80, startY + lines.length * lineH + 16, 120, 4);

  // Bottom bar
  ctx.fillStyle = 'rgba(17,17,17,0.95)';
  ctx.fillRect(0, H - 90, W, 90);
  ctx.strokeStyle = '#222222';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, H-90); ctx.lineTo(W, H-90); ctx.stroke();

  // DRS logo mark (clipped polygon)
  ctx.fillStyle = '#76b900';
  ctx.beginPath();
  ctx.moveTo(80, H-68);
  ctx.lineTo(104, H-68);
  ctx.lineTo(104, H-36);
  ctx.lineTo(96, H-28);
  ctx.lineTo(80, H-28);
  ctx.closePath();
  ctx.fill();

  // DRS text
  ctx.font = 'bold 13px Arial';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('DRS', 114, H-52);
  ctx.font = '12px Arial';
  ctx.fillStyle = '#888888';
  ctx.fillText('Derivative Research Systems', 114, H-36);

  // Date (right aligned)
  if (post.date) {
    ctx.font = '13px Arial';
    ctx.fillStyle = '#666666';
    ctx.textAlign = 'right';
    ctx.fillText(post.date, W - 80, H - 44);
    ctx.textAlign = 'left';
  }

  // Save as JPG
  const buf = canvas.toBuffer('image/jpeg', { quality: 0.92 });
  fs.writeFileSync(outPath, buf);
}

// ── Generate for each post ──────────────────────────────────────────────────
let generated = 0;
for (const post of posts) {
  const slug = post.slug || (post.title||'post').toLowerCase().replace(/[^a-z0-9]+/g,'-');
  const outPath = path.join(outDir, `${slug}.jpg`);

  try {
    generateJPG(post, outPath);
    console.log(`  ✓ ${slug}.jpg`);
    generated++;
  } catch (err) {
    console.error(`  ✗ ${slug}: ${err.message}`);
  }
}

console.log(`\n✅ Generated ${generated} OG image(s) as JPG → images/og/`);
console.log('\nNext steps:');
console.log('  1. npm run deploy:netlify');
console.log('  2. Validate at https://www.linkedin.com/post-inspector/');
