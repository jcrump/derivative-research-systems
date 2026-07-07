/**
 * seo-meta.ts
 *
 * Head-tag and JSON-LD builders wired directly to the real site.config.js
 * shape (brand / contact / hero / principal / seo). Call buildHeadTags()
 * per page/post and inject the returned string into <head>.
 */

import { SiteConfig } from "./load-site-config";

export interface PageMeta {
  /** Page-specific title. Falls back to config.seo.siteTitle if omitted. */
  title?: string;
  /** Page-specific description. Falls back to config.seo.description. */
  description?: string;
  /** Path only, e.g. "/blog/modernizing-legacy-java" — combined with brand.domain. */
  path: string;
  /** Absolute image URL for Open Graph / Twitter Card. */
  ogImage?: string;
  /** "website" | "article" — defaults to "website". */
  type?: "website" | "article";
}

function siteUrl(config: SiteConfig, pagePath = ""): string {
  const domain = config.brand.domain.replace(/\/+$/, "");
  const cleanPath = pagePath.startsWith("/") ? pagePath : `/${pagePath}`;
  return `https://${domain}${cleanPath === "/" ? "" : cleanPath}`;
}

export function buildHeadTags(config: SiteConfig, page: PageMeta): string {
  const title = page.title ?? config.seo.siteTitle;
  const description = page.description ?? config.seo.description;
  const url = siteUrl(config, page.path);
  const type = page.type ?? "website";

  const tags: string[] = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}">`,
    `<meta name="keywords" content="${escapeHtml(config.seo.keywords)}">`,
    `<link rel="canonical" href="${url}">`,

    // Open Graph
    `<meta property="og:type" content="${type}">`,
    `<meta property="og:title" content="${escapeHtml(title)}">`,
    `<meta property="og:description" content="${escapeHtml(description)}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:site_name" content="${escapeHtml(config.brand.logoName)}">`,

    // Twitter Card
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escapeHtml(title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(description)}">`,
  ];

  const ogImage = page.ogImage ?? config.brand.defaultOgImage;
  if (ogImage) {
    tags.push(
      `<meta property="og:image" content="${ogImage}">`,
      `<meta name="twitter:image" content="${ogImage}">`
    );
  }

  return tags.join("\n");
}

/** Site-wide Organization schema — include once, e.g. in the root layout. */
export function buildOrganizationSchema(config: SiteConfig): string {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: config.brand.logoName,
    url: siteUrl(config),
    foundingDate: config.brand.founded,
    email: config.contact.advisoryEmail,
    sameAs: [config.contact.linkedIn].filter(Boolean),
    address: {
      "@type": "PostalAddress",
      addressLocality: config.brand.location,
    },
  };
  return jsonLdScript(schema);
}

/** Local/regional visibility schema (Milwaukee-area search). */
export function buildLocalBusinessSchema(config: SiteConfig): string {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: config.brand.logoName,
    description: config.brand.tagline,
    url: siteUrl(config),
    email: config.contact.advisoryEmail,
    areaServed: config.contact.locationSub,
    address: {
      "@type": "PostalAddress",
      addressLocality: config.contact.locationFull,
    },
    founder: {
      "@type": "Person",
      name: config.principal.name,
      jobTitle: config.principal.role,
    },
  };
  return jsonLdScript(schema);
}

export interface ArticlePost {
  title: string;
  slug: string;
  description: string;
  /** ISO date, e.g. "2026-05-01" */
  datePublished: string;
  /** ISO date; falls back to datePublished if omitted */
  dateModified?: string;
  category?: string;
  ogImage?: string;
}

/** Per-post Article schema for blog content. */
export function buildArticleSchema(config: SiteConfig, post: ArticlePost): string {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    url: siteUrl(config, `/blog/${post.slug}`),
    datePublished: post.datePublished,
    dateModified: post.dateModified ?? post.datePublished,
    author: {
      "@type": "Person",
      name: config.principal.name,
    },
    publisher: {
      "@type": "Organization",
      name: config.brand.logoName,
    },
    ...((post.ogImage ?? config.brand.defaultOgImage)
      ? { image: post.ogImage ?? config.brand.defaultOgImage }
      : {}),
    ...(post.category ? { articleSection: post.category } : {}),
  };
  return jsonLdScript(schema);
}

function jsonLdScript(schema: unknown): string {
  return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
