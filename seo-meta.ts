/**
 * seo-meta.ts
 *
 * Reusable helpers for building <head> meta tags and JSON-LD structured data.
 * Pull the constant values below from your existing site.config.js so there's
 * a single source of truth; wire buildHeadTags() into whatever templating step
 * renders each page (or call it client-side if pages are hydrated).
 */

export interface SiteConfig {
  siteName: string;
  siteUrl: string;
  defaultTitle: string;
  defaultDescription: string;
  twitterHandle?: string;      // e.g. "@jeffmcrump" - optional, omit if none
  logoUrl: string;              // absolute URL to logo image
  ogImageUrl: string;           // absolute URL to default social share image
  linkedinUrl?: string;
  address?: {
    city: string;
    region: string;
    country: string;
  };
}

export interface PageMeta {
  title: string;
  description: string;
  path: string;                 // e.g. "/blog/modernizing-legacy-java"
  ogImageUrl?: string;          // per-page override
  type?: "website" | "article";
  publishDate?: string;         // ISO, articles only
  modifiedDate?: string;        // ISO, articles only
  author?: string;
}

/**
 * Builds the full set of <head> tag strings for a page: title, meta
 * description, canonical, Open Graph, and Twitter Card.
 */
export function buildHeadTags(site: SiteConfig, page: PageMeta): string {
  const canonical = `${site.siteUrl}${page.path}`;
  const ogImage = page.ogImageUrl ?? site.ogImageUrl;
  const isArticle = page.type === "article";

  const tags: string[] = [
    `<title>${escapeHtml(page.title)}</title>`,
    `<meta name="description" content="${escapeHtml(page.description)}" />`,
    `<link rel="canonical" href="${canonical}" />`,

    // Open Graph
    `<meta property="og:type" content="${isArticle ? "article" : "website"}" />`,
    `<meta property="og:site_name" content="${escapeHtml(site.siteName)}" />`,
    `<meta property="og:title" content="${escapeHtml(page.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(page.description)}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:image" content="${ogImage}" />`,
  ];

  if (isArticle && page.publishDate) {
    tags.push(`<meta property="article:published_time" content="${page.publishDate}" />`);
  }
  if (isArticle && page.modifiedDate) {
    tags.push(`<meta property="article:modified_time" content="${page.modifiedDate}" />`);
  }

  // Twitter Card
  tags.push(
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(page.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(page.description)}" />`,
    `<meta name="twitter:image" content="${ogImage}" />`
  );
  if (site.twitterHandle) {
    tags.push(`<meta name="twitter:site" content="${site.twitterHandle}" />`);
  }

  return tags.join("\n");
}

/**
 * Organization JSON-LD — include once, site-wide (e.g. in the root layout).
 */
export function buildOrganizationSchema(site: SiteConfig): string {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.siteName,
    url: site.siteUrl,
    logo: site.logoUrl,
    ...(site.linkedinUrl ? { sameAs: [site.linkedinUrl] } : {}),
  };
  return jsonLdScript(schema);
}

/**
 * LocalBusiness JSON-LD — useful if you want regional (Milwaukee-area) search
 * visibility for mid-market/SMB clients. Omit if you'd rather stay purely
 * remote/national in positioning.
 */
export function buildLocalBusinessSchema(site: SiteConfig): string {
  if (!site.address) return "";
  const schema = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: site.siteName,
    url: site.siteUrl,
    image: site.logoUrl,
    address: {
      "@type": "PostalAddress",
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      addressCountry: site.address.country,
    },
  };
  return jsonLdScript(schema);
}

/**
 * Article JSON-LD — include on each blog post page.
 */
export function buildArticleSchema(site: SiteConfig, page: PageMeta): string {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: page.title,
    description: page.description,
    image: page.ogImageUrl ?? site.ogImageUrl,
    author: {
      "@type": "Person",
      name: page.author ?? site.siteName,
    },
    publisher: {
      "@type": "Organization",
      name: site.siteName,
      logo: {
        "@type": "ImageObject",
        url: site.logoUrl,
      },
    },
    datePublished: page.publishDate,
    dateModified: page.modifiedDate ?? page.publishDate,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${site.siteUrl}${page.path}`,
    },
  };
  return jsonLdScript(schema);
}

function jsonLdScript(schema: Record<string, unknown>): string {
  return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ---------------------------------------------------------------------
 * Example usage:
 *
 * import { buildHeadTags, buildOrganizationSchema, buildArticleSchema } from "./seo-meta";
 *
 * const site: SiteConfig = {
 *   siteName: "Derivative Research Systems",
 *   siteUrl: "https://derivativeresearchsystems.com",
 *   defaultTitle: "DRS | IT Modernization & Technical Debt Consulting",
 *   defaultDescription: "Boutique IT consulting for mid-market enterprises...",
 *   logoUrl: "https://derivativeresearchsystems.com/logo.png",
 *   ogImageUrl: "https://derivativeresearchsystems.com/og-default.png",
 *   linkedinUrl: "https://linkedin.com/in/jeffmcrump/",
 *   address: { city: "Milwaukee", region: "WI", country: "US" },
 * };
 *
 * const headHtml = buildHeadTags(site, {
 *   title: "Modernizing Legacy Java Systems Without a Rewrite",
 *   description: "A phased approach to eliminating technical debt in enterprise Java stacks.",
 *   path: "/blog/modernizing-legacy-java",
 *   type: "article",
 *   publishDate: "2026-05-01",
 * });
 * ------------------------------------------------------------------- */
