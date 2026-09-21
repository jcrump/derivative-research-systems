#!/usr/bin/env node
/**
 * inject-blog-index-styles.js
 *
 * Injects the blog index page CSS into blog/index.html.
 * The index uses completely different classes from the post-article pages,
 * so it needs its own style block.
 *
 * Run from repo root:
 *   node scripts/inject-blog-index-styles.js
 */

const fs   = require('fs');
const path = require('path');

const INDEX_FILE = path.resolve(__dirname, '../blog/index.html');

const BLOG_INDEX_STYLE = `  <style>
    /* ── Reset & tokens ─────────────────────────────────────────────────── */
    :root{
      --green:#76b900;--green-dk:#5a8c00;
      --black:#000;--surface:#0a0a0a;--panel:#111;
      --border:#222;--mid:#444;--text:#e8e8e8;--muted:#888;--white:#fff;
      --nav-h:64px;
      --font:'Inter',system-ui,sans-serif;
      --serif:'Merriweather',Georgia,serif;
    }
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    html{scroll-behavior:smooth;}
    body{background:var(--black);color:var(--text);font-family:var(--font);
         font-size:15px;line-height:1.6;-webkit-font-smoothing:antialiased;}
    a{color:inherit;text-decoration:none;}

    /* ── Layout container ───────────────────────────────────────────────── */
    .container{width:100%;max-width:1100px;margin:0 auto;padding:0 24px;}

    /* ── Site header / nav ──────────────────────────────────────────────── */
    .site-header{
      position:fixed;top:0;left:0;right:0;z-index:100;
      height:var(--nav-h);
      background:rgba(0,0,0,0.92);backdrop-filter:blur(12px);
      border-bottom:1px solid var(--border);
    }
    .site-header .container{
      height:100%;display:flex;align-items:center;justify-content:space-between;
    }
    .brand{display:flex;align-items:center;gap:10px;}
    .brand-mark{
      width:26px;height:26px;background:var(--green);
      clip-path:polygon(0 0,100% 0,100% 60%,60% 100%,0 100%);
    }
    .brand-text{
      font-size:13px;font-weight:700;letter-spacing:0.08em;
      text-transform:uppercase;color:var(--white);
    }
    .site-nav{display:flex;align-items:center;gap:28px;}
    .site-nav a{
      font-size:12px;font-weight:600;color:var(--muted);
      letter-spacing:0.06em;text-transform:uppercase;transition:color .15s;
    }
    .site-nav a:hover,.site-nav a.active{color:var(--green);}

    /* ── Hero ───────────────────────────────────────────────────────────── */
    .blog-index{padding-top:var(--nav-h);}
    .hero{
      padding:80px 0 64px;
      background:var(--surface);border-bottom:1px solid var(--border);
    }
    .eyebrow{
      font-size:11px;font-weight:700;letter-spacing:0.12em;
      text-transform:uppercase;color:var(--green);margin-bottom:20px;
    }
    .hero h1{
      font-size:clamp(28px,4.5vw,52px);font-weight:900;
      letter-spacing:-0.02em;color:var(--white);line-height:1.08;
      margin-bottom:20px;max-width:720px;
    }
    .dek{
      font-size:16px;color:var(--muted);line-height:1.7;
      max-width:640px;font-weight:300;
    }

    /* ── Post list ──────────────────────────────────────────────────────── */
    .post-list{padding:64px 0;}
    .post-list .container{
      display:flex;flex-direction:column;gap:0;
    }

    /* ── Post card ──────────────────────────────────────────────────────── */
    .post-card{
      display:block;
      padding:32px 0;
      border-bottom:1px solid var(--border);
      transition:background .15s;
    }
    .post-card:first-child{border-top:1px solid var(--border);}
    .post-card:hover{background:rgba(255,255,255,0.02);padding-left:8px;}

    .post-card-eyebrow{
      display:flex;align-items:center;gap:8px;
      font-size:11px;color:var(--muted);
      text-transform:uppercase;letter-spacing:0.08em;
      margin-bottom:12px;
    }
    .post-card-num{font-weight:700;color:var(--green);}
    .post-card-dot{color:var(--mid);}
    .post-card-category{color:var(--muted);}

    .post-card-title{
      font-size:clamp(17px,2.2vw,24px);font-weight:800;
      color:var(--white);line-height:1.2;margin-bottom:12px;
      letter-spacing:-0.01em;
    }
    .post-card:hover .post-card-title{color:var(--green);}

    .post-card-excerpt{
      font-size:14px;color:var(--muted);line-height:1.65;
      max-width:680px;margin-bottom:16px;
    }

    .post-card-read{
      font-size:12px;font-weight:700;color:var(--green);
      letter-spacing:0.04em;text-transform:uppercase;
    }

    /* ── CTA card ───────────────────────────────────────────────────────── */
    .index-cta{padding:64px 0;}
    .cta-card{
      background:rgba(118,185,0,0.07);
      border:1px solid rgba(118,185,0,0.2);
      padding:48px;max-width:640px;
    }
    .cta-eyebrow{
      font-size:11px;font-weight:700;letter-spacing:0.12em;
      text-transform:uppercase;color:var(--green);margin-bottom:16px;
    }
    .cta-card h2{
      font-size:clamp(20px,3vw,32px);font-weight:800;
      color:var(--white);line-height:1.15;margin-bottom:16px;
      letter-spacing:-0.01em;
    }
    .cta-card p{
      font-size:14px;color:var(--muted);line-height:1.65;margin-bottom:24px;
    }
    .cta-button{
      display:inline-block;padding:12px 24px;
      background:var(--green);color:var(--black);
      font-size:12px;font-weight:700;letter-spacing:0.06em;
      text-transform:uppercase;transition:background .15s;
    }
    .cta-button:hover{background:#9fd600;}

    /* ── License / footer note ──────────────────────────────────────────── */
    .license{
      padding:24px 0;border-top:1px solid var(--border);
      font-size:11px;color:var(--mid);line-height:1.6;
    }

    /* ── Site footer ────────────────────────────────────────────────────── */
    .site-footer{
      background:#050505;border-top:1px solid var(--border);
      padding:32px 24px;text-align:center;
    }
    .site-footer p{font-size:12px;color:var(--mid);}
    .site-footer a{color:var(--green);}

    /* ── Responsive ─────────────────────────────────────────────────────── */
    @media(max-width:600px){
      .hero{padding:48px 0 40px;}
      .post-list{padding:40px 0;}
      .post-card{padding:24px 0;}
      .cta-card{padding:32px 24px;}
      .site-nav a:not(.active){display:none;}
    }
  </style>`;

if (!fs.existsSync(INDEX_FILE)) {
  console.error(`  ✗ File not found: ${INDEX_FILE}`);
  process.exit(1);
}

let html = fs.readFileSync(INDEX_FILE, 'utf8');

// Check if the blog-index styles are already injected
if (html.includes('.post-card-title') || html.includes('.blog-index')) {
  // Already has some index styles — check if it looks complete
  if (html.includes('.post-card-read') && html.includes('.site-footer')) {
    console.log('  ⟳ blog/index.html already has blog index styles — skipping.');
    process.exit(0);
  }
  // Partial styles present — replace the whole <style> block
  console.log('  ⚠  Partial styles detected — replacing style block.');
  html = html.replace(/<style>[\s\S]*?<\/style>/i, BLOG_INDEX_STYLE);
} else if (html.includes('<style>')) {
  // Has post-article styles, not index styles — replace
  console.log('  ⚠  Found post-article styles instead of index styles — replacing.');
  html = html.replace(/<style>[\s\S]*?<\/style>/i, BLOG_INDEX_STYLE);
} else {
  // No styles at all — inject before </head>
  html = html.replace('</head>', `${BLOG_INDEX_STYLE}\n</head>`);
}

fs.writeFileSync(INDEX_FILE, html, 'utf8');
console.log('  ✓ blog/index.html — blog index styles injected.\n');
console.log('Next steps:');
console.log('  git add blog/index.html');
console.log('  git commit -m "Fix CSS: blog index page styles"');
console.log('  git push origin main\n');
