#!/usr/bin/env node
/**
 * rebuild-post-template.js
 *
 * Rebuilds blog posts that use the old/wrong template structure
 * (site-header, blog-post, post-body) into the correct DRS template
 * (nav, post-header, post-layout, post-sidebar).
 *
 * Extracts from each file:
 *   - title, excerpt, category, date, readTime, tags, slug
 *   - the raw article HTML content
 *
 * Then wraps it in the correct full DRS post template.
 *
 * Run from repo root:
 *   node scripts/rebuild-post-template.js
 */

const fs   = require('fs');
const path = require('path');

const BLOG_DIR = path.resolve(__dirname, '../blog');

// ── Posts to rebuild ──────────────────────────────────────────────────────────
const TARGETS = [
  'ai-adoption-isnt-a-technology-decision-its-a-discipline-decision',
  'how-to-interview-an-ai-vendor',
  'sequencing-which-ai-project-comes-first',
  'the-ai-policy-you-probably-dont-have',
  'the-compound-return-of-discipline',
  'the-cost-of-not-deciding',
  'the-inventory-nobody-wants-to-make',
  'the-last-initiative-you-ran-predicts-your-next-one',
  'the-missing-voice-in-your-ai-program',
  'the-return-on-manual-work',
  'three-signs-an-ai-pilot-is-about-to-fail',
  'trust-but-verify-reviewing-what-ai-produces',
  'what-happens-after-the-first-ai-win',
  'what-small-businesses-get-right-that-enterprises-miss',
  'when-your-executive-wants-ai-but-doesnt-know-why',
  'whos-responsible-when-your-ai-is-wrong',
  'why-killing-projects-is-the-hardest-ai-skill-to-build',
  'why-your-competitors-are-not-your-ai-roadmap',
  'you-cant-measure-what-you-didnt-baseline',
  'your-data-is-not-ready-heres-how-to-tell',
];

// ── Extractors ────────────────────────────────────────────────────────────────

function extractMeta(html, name) {
  const m = html.match(new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'))
         || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, 'i'));
  return m ? m[1].trim() : null;
}

function extractOg(html, prop) {
  const m = html.match(new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i'))
         || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${prop}["']`, 'i'));
  return m ? m[1].trim() : null;
}

function extractTitle(html) {
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (title) return title[1].replace(/\s*[|\-–—].*$/, '').trim();
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  return h1 ? h1[1].replace(/<[^>]+>/g, '').trim() : '';
}

function extractExcerpt(html) {
  const desc = extractMeta(html, 'description');
  if (desc && desc.length > 10) return desc;
  const og = extractOg(html, 'og:description');
  if (og && og.length > 10) return og;
  return '';
}

function extractCategory(html) {
  // Try eyebrow <p class="eyebrow">
  const eyebrow = html.match(/<p[^>]*class=["']eyebrow["'][^>]*>([^<]+)<\/p>/i);
  if (eyebrow) return eyebrow[1].trim();
  const sec = extractOg(html, 'article:section');
  if (sec && sec.length > 1) return sec;
  const cat = extractMeta(html, 'category');
  if (cat) return cat;
  return 'AI Adoption';
}

function extractDate(html) {
  // Try <time datetime="..."> in post-meta first
  const timeEl = html.match(/<time[^>]+datetime=["']([^"']+)["']/i);
  if (timeEl) return timeEl[1].slice(0, 10);
  const pub = extractOg(html, 'article:published_time');
  if (pub) return pub.slice(0, 10);
  const meta = extractMeta(html, 'date');
  if (meta) return meta.slice(0, 10);
  return new Date().toISOString().slice(0, 10);
}

function extractReadTime(html) {
  const rt = extractMeta(html, 'readTime');
  if (rt) return rt;
  // Estimate from word count
  const text  = html.replace(/<[^>]+>/g, ' ');
  const words = text.trim().split(/\s+/).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
}

function extractTags(html) {
  const kw = extractMeta(html, 'keywords');
  if (kw) return kw.split(',').map(t => t.trim()).filter(Boolean);
  return [];
}

function extractArticleBody(html) {
  // The wrong template wraps content in .post-body > .container
  // Try to extract just the inner content paragraphs
  let body = '';

  // Try <div class="post-body">...</div>
  const postBody = html.match(/<div[^>]+class=["'][^"']*post-body[^"']*["'][^>]*>([\s\S]*?)<\/div>\s*<\/article>/i);
  if (postBody) {
    // Get the inner container content
    const inner = postBody[1].match(/<div[^>]+class=["'][^"']*container[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
    body = inner ? inner[1].trim() : postBody[1].trim();
    return body;
  }

  // Fallback: grab everything between <article> and </article> excluding the header
  const article = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (article) {
    let content = article[1];
    // Remove the post header inside the article
    content = content.replace(/<header[^>]*>[\s\S]*?<\/header>/i, '');
    // Remove the post-body wrapper divs but keep content
    content = content.replace(/<div[^>]+class=["'][^"']*post-body[^"']*["'][^>]*>/gi, '');
    content = content.replace(/<div[^>]+class=["'][^"']*container[^"']*["'][^>]*>/gi, '');
    // Remove closing divs that were wrappers (tricky — just clean up excess)
    return content.trim();
  }

  return '<p>Content could not be extracted automatically — please add manually.</p>';
}

function formatDisplayDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T12:00:00Z');
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

// ── The correct DRS post template ─────────────────────────────────────────────

const DRS_STYLE = `  <style>
    :root{--green:#76b900;--green-dk:#5a8c00;--black:#000;--surface:#0a0a0a;--panel:#111;--border:#222;--mid:#444;--text:#e8e8e8;--muted:#888;--white:#fff;--nav-h:60px;--font:'Inter',system-ui,sans-serif;--serif:'Merriweather',Georgia,serif;}
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    html{scroll-behavior:smooth;}
    body{background:var(--black);color:var(--text);font-family:var(--font);font-size:15px;line-height:1.6;-webkit-font-smoothing:antialiased;}
    a{color:inherit;text-decoration:none;}
    .nav{position:fixed;top:0;left:0;right:0;z-index:100;height:var(--nav-h);background:rgba(0,0,0,0.92);backdrop-filter:blur(12px);border-bottom:1px solid var(--border);display:flex;align-items:center;}
    .nav-inner{width:100%;max-width:1400px;margin:0 auto;padding:0 24px;display:flex;align-items:center;}
    .nav-logo{display:flex;align-items:center;gap:10px;margin-right:auto;}
    .nav-logo-mark{width:28px;height:28px;background:var(--green);clip-path:polygon(0 0,100% 0,100% 60%,60% 100%,0 100%);}
    .nav-logo-text{font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--white);}
    .nav-logo-text span{color:var(--green);}
    .nav-back{font-size:12px;font-weight:600;color:var(--muted);letter-spacing:0.06em;text-transform:uppercase;display:flex;align-items:center;gap:6px;transition:color .15s;}
    .nav-back:hover{color:var(--green);}
    .post-header{padding:calc(var(--nav-h) + 80px) 24px 60px;background:var(--surface);border-bottom:1px solid var(--border);}
    .post-header-inner{max-width:860px;margin:0 auto;}
    .post-breadcrumb{display:flex;align-items:center;gap:8px;font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:24px;}
    .post-breadcrumb a:hover{color:var(--green);}
    .post-breadcrumb span{color:var(--mid);}
    .post-cat-badge{display:inline-block;background:var(--green);color:var(--black);font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;padding:4px 12px;margin-bottom:20px;}
    .post-title{font-size:clamp(28px,5vw,52px);font-weight:900;letter-spacing:-0.02em;color:var(--white);line-height:1.08;margin-bottom:20px;}
    .post-excerpt-lede{font-size:18px;color:var(--muted);line-height:1.6;margin-bottom:32px;font-weight:300;}
    .post-meta-bar{display:flex;align-items:center;gap:24px;flex-wrap:wrap;padding-top:24px;border-top:1px solid var(--border);}
    .post-author{display:flex;align-items:center;gap:12px;}
    .post-author-avatar{width:36px;height:36px;background:var(--green);clip-path:polygon(0 0,100% 0,100% 60%,60% 100%,0 100%);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;color:var(--black);}
    .post-author-name{font-size:13px;font-weight:600;color:var(--text);}
    .post-author-role{font-size:11px;color:var(--muted);}
    .post-meta-item{font-size:12px;color:var(--muted);}
    .post-meta-item strong{color:var(--text);}
    .post-layout{max-width:1100px;margin:0 auto;padding:64px 24px;display:grid;grid-template-columns:1fr 260px;gap:64px;align-items:start;}
    .post-content{font-family:var(--serif);font-size:17px;line-height:1.85;color:#ccc;}
    .post-content h2{font-family:var(--font);font-size:26px;font-weight:800;color:var(--white);margin:48px 0 16px;letter-spacing:-0.01em;}
    .post-content h3{font-family:var(--font);font-size:20px;font-weight:700;color:var(--white);margin:36px 0 12px;}
    .post-content p{margin-bottom:24px;}
    .post-content ul,.post-content ol{margin:0 0 24px 24px;}
    .post-content li{margin-bottom:8px;}
    .post-content blockquote{border-left:3px solid var(--green);padding:16px 24px;margin:32px 0;background:rgba(118,185,0,0.04);font-style:italic;color:var(--muted);}
    .post-content table{width:100%;border-collapse:collapse;margin:32px 0;}
    .post-content th{background:var(--panel);color:var(--white);font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;padding:12px 16px;text-align:left;border-bottom:2px solid var(--green);}
    .post-content td{padding:12px 16px;border-bottom:1px solid var(--border);font-size:15px;color:#ccc;vertical-align:top;}
    .post-content tr:last-child td{border-bottom:none;}
    .post-content code{font-family:'Courier New',monospace;background:var(--panel);color:var(--green);padding:2px 7px;font-size:14px;border:1px solid var(--border);}
    .post-content pre{background:var(--panel);border:1px solid var(--border);border-left:3px solid var(--green);padding:24px;margin:32px 0;overflow-x:auto;font-size:13px;line-height:1.6;}
    .post-content pre code{background:none;border:none;padding:0;color:#9fd600;}
    .post-content hr{border:none;border-top:1px solid var(--border);margin:40px 0;}
    .post-content a{color:var(--green);text-decoration:underline;text-decoration-color:rgba(118,185,0,0.3);}
    .post-content a:hover{text-decoration-color:var(--green);}
    .post-content strong{color:var(--white);font-family:var(--font);}
    .post-sidebar{position:sticky;top:calc(var(--nav-h) + 24px);}
    .sidebar-card{background:var(--panel);border:1px solid var(--border);padding:24px;margin-bottom:20px;}
    .sidebar-title{font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--white);margin-bottom:16px;}
    .toc-list{list-style:none;display:flex;flex-direction:column;gap:8px;}
    .toc-list li a{font-size:12px;color:var(--muted);transition:color .15s;display:block;padding:4px 0;border-left:2px solid transparent;padding-left:10px;}
    .toc-list li a:hover,.toc-list li a.active{color:var(--green);border-left-color:var(--green);}
    .tag-list{display:flex;flex-wrap:wrap;gap:8px;}
    .tag{padding:4px 10px;border:1px solid var(--border);font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.08em;}
    .cta-card{background:rgba(118,185,0,0.07);border:1px solid rgba(118,185,0,0.2);padding:24px;}
    .cta-card p{font-size:13px;color:var(--muted);margin-bottom:16px;line-height:1.6;}
    .btn-cta{display:block;text-align:center;padding:11px 16px;background:var(--green);color:var(--black);font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;}
    .btn-cta:hover{background:#9fd600;}
    .post-nav{max-width:860px;margin:0 auto;padding:0 24px 80px;display:grid;grid-template-columns:1fr 1fr;gap:16px;}
    .post-nav-card{background:var(--panel);border:1px solid var(--border);padding:20px;display:flex;flex-direction:column;gap:6px;}
    .post-nav-label{font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--mid);}
    .post-nav-title{font-size:14px;font-weight:600;color:var(--text);}
    footer{background:#050505;border-top:1px solid var(--border);padding:32px 24px;text-align:center;}
    footer p{font-size:12px;color:var(--mid);}
    footer a{color:var(--green);}
    @media(max-width:900px){.post-layout{grid-template-columns:1fr;}.post-sidebar{display:none;}.post-nav{grid-template-columns:1fr;}}
  </style>`;

function buildPage(slug, meta, articleBody) {
  const { title, excerpt, category, date, readTime, tags } = meta;
  const displayDate = formatDisplayDate(date);
  const tagHtml = tags.length
    ? tags.map(t => `<span class="tag">${t}</span>`).join('')
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title} | DRS Insights</title>
  <meta name="description" content="${excerpt}"/>
  <meta property="og:type"        content="article"/>
  <meta property="og:site_name"   content="Derivative Research Systems"/>
  <meta property="og:title"       content="${title}"/>
  <meta property="og:description" content="${excerpt}"/>
  <meta property="og:url"         content="https://derivativeresearchsystems.com/blog/${slug}"/>
  <meta property="article:author"         content="Jeff Crump"/>
  <meta property="article:published_time" content="${date}"/>
  <meta property="article:section"        content="${category}"/>
  <meta name="twitter:card"        content="summary_large_image"/>
  <meta name="twitter:title"       content="${title}"/>
  <meta name="twitter:description" content="${excerpt}"/>
  <link rel="canonical" href="https://derivativeresearchsystems.com/blog/${slug}"/>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&family=Merriweather:wght@300;400;700&display=swap" rel="stylesheet"/>
${DRS_STYLE}
</head>
<body>

<nav class="nav">
  <div class="nav-inner">
    <a class="nav-logo" href="../index.html">
      <div class="nav-logo-mark"></div>
      <div class="nav-logo-text"><span>DRS</span> Derivative Research Systems</div>
    </a>
    <a href="index.html" class="nav-back">← All Insights</a>
  </div>
</nav>

<header class="post-header">
  <div class="post-header-inner">
    <div class="post-breadcrumb">
      <a href="../index.html">Home</a><span>/</span>
      <a href="index.html">Insights</a><span>/</span>
      <span>${category}</span>
    </div>
    <div class="post-cat-badge">${category}</div>
    <h1 class="post-title">${title}</h1>
    <p class="post-excerpt-lede">${excerpt}</p>
    <div class="post-meta-bar">
      <div class="post-author">
        <div class="post-author-avatar">JC</div>
        <div>
          <div class="post-author-name">Jeff Crump</div>
          <div class="post-author-role">Founder &amp; Principal Architect, DRS</div>
        </div>
      </div>
      <div class="post-meta-item"><strong>${displayDate}</strong></div>
      <div class="post-meta-item">${readTime}</div>
    </div>
  </div>
</header>

<div class="post-layout">
  <article class="post-content" id="postContent">
${articleBody}
  </article>
  <aside class="post-sidebar">
    <div class="sidebar-card">
      <div class="sidebar-title">In This Post</div>
      <ul class="toc-list" id="tocList"></ul>
    </div>
    ${tagHtml ? `<div class="sidebar-card">
      <div class="sidebar-title">Tags</div>
      <div class="tag-list">${tagHtml}</div>
    </div>` : ''}
    <div class="cta-card">
      <div class="sidebar-title">Work With DRS</div>
      <p>Ready to solve the problem you're reading about?</p>
      <a href="../index.html#contact" class="btn-cta">Schedule Assessment</a>
    </div>
  </aside>
</div>

<nav class="post-nav"></nav>

<footer>
  <p>&copy; 2024&ndash;2026 Derivative Research Systems LLC &nbsp;&middot;&nbsp;
     <a href="../index.html">Home</a> &nbsp;&middot;&nbsp;
     <a href="index.html">Insights</a> &nbsp;&middot;&nbsp;
     <a href="../index.html#contact">Contact</a>
  </p>
</footer>

<script>
const content = document.getElementById('postContent');
const toc     = document.getElementById('tocList');
if (content && toc) {
  const headings = content.querySelectorAll('h2,h3');
  headings.forEach((h, i) => {
    const id = 'h' + i;
    h.id = id;
    const li = document.createElement('li');
    li.innerHTML = '<a href="#' + id + '">' + h.textContent + '</a>';
    toc.appendChild(li);
  });
  // Active TOC highlight on scroll
  const links = toc.querySelectorAll('a');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        const active = toc.querySelector('a[href="#' + e.target.id + '"]');
        if (active) active.classList.add('active');
      }
    });
  }, { rootMargin: '-20% 0px -70% 0px' });
  headings.forEach(h => obs.observe(h));
}
</script>

</body>
</html>`;
}

// ── Main ──────────────────────────────────────────────────────────────────────

let rebuilt = 0;
let failed  = 0;

for (const slug of TARGETS) {
  const filePath = path.join(BLOG_DIR, `${slug}.html`);

  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠  Skipping ${slug} — file not found`);
    failed++;
    continue;
  }

  const html = fs.readFileSync(filePath, 'utf8');

  // Extract metadata
  const title    = extractTitle(html);
  const excerpt  = extractExcerpt(html);
  const category = extractCategory(html);
  const date     = extractDate(html);
  const readTime = extractReadTime(html);
  const tags     = extractTags(html);

  // Extract article body
  const articleBody = extractArticleBody(html);

  // Build the new page
  const newHtml = buildPage(slug, { title, excerpt, category, date, readTime, tags }, articleBody);

  // Back up original
  fs.writeFileSync(filePath + '.bak', html, 'utf8');

  // Write rebuilt file
  fs.writeFileSync(filePath, newHtml, 'utf8');

  console.log(`  ✓ Rebuilt: ${slug}`);
  console.log(`      title:    ${title}`);
  console.log(`      date:     ${date}  |  category: ${category}  |  readTime: ${readTime}`);
  rebuilt++;
}

console.log(`\n✅ Done — ${rebuilt} rebuilt, ${failed} skipped.`);
console.log('\nOriginal files backed up as .html.bak — delete after verifying.');
console.log('\nNext steps:');
console.log('  git add blog/');
console.log('  git commit -m "Rebuild 20 posts to correct DRS template"');
console.log('  git push origin main\n');
