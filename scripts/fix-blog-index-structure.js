#!/usr/bin/env node
/**
 * fix-blog-index-structure.js
 *
 * Fixes two problems in blog/index.html:
 *
 * 1. Posts 21-30 were inserted after the closing </div> of the container,
 *    so they sit outside the layout. This moves them back inside.
 *
 * 2. Some post titles extracted from og:title came through in lowercase.
 *    This applies title case to any post-card-title that is all lowercase.
 *
 * Run from repo root:
 *   node scripts/fix-blog-index-structure.js
 */

const fs   = require('fs');
const path = require('path');

const INDEX_FILE = path.resolve(__dirname, '../blog/index.html');

let html = fs.readFileSync(INDEX_FILE, 'utf8');

// ── Step 1: Fix structural problem ───────────────────────────────────────────
// The new cards were inserted after:
//   </a>        <- end of post 20
//   </div>      <- closes .container
//   </section>  <- closes .post-list (may or may not be present)
//
// They need to be INSIDE the .container div, before its closing </div>.
//
// Strategy: find the block of new cards (post 21 onwards), remove them
// from where they are, and re-insert before the </div></section> closing sequence.

// Find where the misplaced cards start — the first <a> after the </div> break
// We know from the diff it looks like:
//   </div>\n    \n        <a href="ai-automation-opportunities...
// Let's find the exact pattern and restructure.

// Extract all misplaced cards (everything from the stray insertion point to </section>)
const MISPLACE_START = /(<\/a>\s*\n\s*<\/div>\s*\n\s*)\n(\s*<a href="ai-automation-opportunities)/;

if (!MISPLACE_START.test(html)) {
  console.log('  ℹ Structure pattern not found — may already be fixed or structure differs.');
  console.log('  Checking for alternative pattern...');
}

// More robust approach: rebuild the container content cleanly.
// Find the .post-list section and rewrite just its container contents.

// Locate all post-card <a> blocks in order
const cardRegex = /<a href="[^"]+\.html" class="post-card">[\s\S]*?<\/a>/g;
const allCards  = [];
let match;
while ((match = cardRegex.exec(html)) !== null) {
  allCards.push(match[0]);
}

console.log(`  ℹ Found ${allCards.length} post cards total`);

if (allCards.length === 0) {
  console.error('  ✗ No post cards found — check index.html structure');
  process.exit(1);
}

// ── Step 2: Fix lowercase titles ─────────────────────────────────────────────
function toTitleCase(str) {
  // Words that should stay lowercase unless first word
  const minor = new Set(['a','an','the','and','but','or','for','nor','on','at',
                         'to','by','in','of','up','as','is','vs','its']);
  return str.split(' ').map((word, i) => {
    const clean = word.replace(/[^a-zA-Z]/g, '');
    if (i === 0 || !minor.has(clean.toLowerCase())) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
    return word.toLowerCase();
  }).join(' ');
}

const fixedCards = allCards.map(card => {
  return card.replace(/<h2 class="post-card-title">([^<]+)<\/h2>/g, (full, title) => {
    // Only fix if title appears to be all lowercase (no uppercase letters)
    if (title === title.toLowerCase()) {
      const fixed = toTitleCase(title);
      console.log(`  ✓ Title fixed: "${title}" → "${fixed}"`);
      return `<h2 class="post-card-title">${fixed}</h2>`;
    }
    return full;
  });
});

// ── Step 3: Rebuild the post-list section ────────────────────────────────────
// Replace the entire content between <section class="post-list"> and </section>
// with a clean, correctly indented version of all cards.

const INDENT = '        '; // 8 spaces — matches existing cards
const cardsHtml = fixedCards.map(card => {
  // Normalize indentation: strip leading whitespace from each line, re-indent
  const lines = card.split('\n').map(line => INDENT + line.trimStart());
  return lines.join('\n');
}).join('\n');

const newPostList = `    <section class="post-list">
      <div class="container">
${cardsHtml}
      </div>
    </section>`;

// Replace the old post-list section entirely
const postListRegex = /<section class="post-list">[\s\S]*?<\/section>/;

if (!postListRegex.test(html)) {
  console.error('  ✗ Could not find <section class="post-list"> — check index.html');
  process.exit(1);
}

html = html.replace(postListRegex, newPostList);

// ── Write output ──────────────────────────────────────────────────────────────
fs.writeFileSync(INDEX_FILE, html, 'utf8');

console.log(`\n✅ Fixed — ${fixedCards.length} cards normalized, structure corrected.\n`);
console.log('Verify locally, then:');
console.log('  git add blog/index.html');
console.log('  git commit -m "Fix blog index: structure and title casing for posts 21-30"');
console.log('  git push origin main\n');
