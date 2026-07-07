#!/usr/bin/env node
/**
 * DRS Site Build Script
 * Copies the static site to /dist, ready for deployment.
 * Skips admin/ from the production build (it's a local tool only).
 */

const fs   = require('fs');
const path = require('path');

const SRC  = path.resolve(__dirname, '..');
const DIST = path.resolve(__dirname, '../dist');

// ── Helpers ────────────────────────────────────────────────────────────────
function copyDir(src, dest, skip = []) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (skip.includes(entry.name)) continue;
    const srcPath  = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, skip);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function log(msg, color = '\x1b[32m') {
  console.log(`${color}%s\x1b[0m`, msg);
}

// ── Clean dist ─────────────────────────────────────────────────────────────
if (fs.existsSync(DIST)) {
  fs.rmSync(DIST, { recursive: true });
  log('  ✓ Cleaned dist/');
}
fs.mkdirSync(DIST, { recursive: true });

// ── Copy site (excluding admin/, scripts/, node_modules/, .git/) ───────────
const SKIP = ['scripts', 'node_modules', '.git', 'dist', 'package.json', 'package-lock.json', '.gitignore', 'README.md', 'netlify.toml', 'wrangler.toml', '_redirects'];
copyDir(SRC, DIST, SKIP);
log('  ✓ Copied site files to dist/');

// ── Copy _redirects for Netlify SPA fallback ───────────────────────────────
const redirectsSrc = path.join(SRC, '_redirects');
if (fs.existsSync(redirectsSrc)) {
  fs.copyFileSync(redirectsSrc, path.join(DIST, '_redirects'));
  log('  ✓ Copied _redirects');
}

// ── Verify critical files exist ────────────────────────────────────────────
const required = ['index.html', 'site.config.js', 'favicon.svg', 'favicon.ico', 'blog/index.html', 'blog/blog-registry.js'];
let ok = true;
for (const f of required) {
  const full = path.join(DIST, f);
  if (fs.existsSync(full)) {
    log(`  ✓ ${f}`);
  } else {
    log(`  ✗ MISSING: ${f}`, '\x1b[31m');
    ok = false;
  }
}

// ── Count blog posts ───────────────────────────────────────────────────────
const blogDir = path.join(DIST, 'blog');
const posts = fs.readdirSync(blogDir)
  .filter(f => f.endsWith('.html') && f !== 'index.html' && !f.startsWith('_'));
log(`  ✓ ${posts.length} blog post(s) included`);

// ── Summary ────────────────────────────────────────────────────────────────
if (ok) {
  log('\n✅ Build complete → dist/\n', '\x1b[32m');
} else {
  log('\n⚠️  Build completed with warnings — check missing files above.\n', '\x1b[33m');
  process.exit(1);
}
