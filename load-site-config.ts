/**
 * load-site-config.ts
 *
 * site.config.js declares `var DRS_CONFIG = {...}` as a plain browser
 * global — it has no module.exports / export default. To reuse the same
 * file as the single source of truth in a Node build step (sitemap
 * generation, meta tag injection), we load it in a sandboxed VM context
 * and pull DRS_CONFIG back out, rather than forking a second copy of
 * the config.
 *
 * If you'd rather not do this, the simpler alternative is adding one line
 * to the bottom of site.config.js:
 *   if (typeof module !== "undefined") module.exports = DRS_CONFIG;
 * — which makes it a normal CommonJS export in Node while still working
 * as a browser global (module is undefined in the browser). If you add
 * that line, swap this loader for a plain `require("./site.config.js")`.
 */

import fs from "fs";
import path from "path";
import vm from "vm";

export interface SiteConfig {
  brand: {
    logoMark: string;
    logoName: string;
    tagline: string;
    domain: string;
    founded: string;
    location: string;
    accentColor: string;
    /** Fallback Open Graph / Twitter Card image for pages/posts with no image of their own. */
    defaultOgImage?: string;
  };
  contact: {
    advisoryEmail: string;
    ceoEmail: string;
    linkedIn: string;
    locationFull: string;
    locationSub: string;
    responseTime: string;
    formspreeId: string;
    ctaLabel: string;
  };
  hero: {
    eyebrow: string;
    headline: string[];
    subtext: string;
    ctaPrimary: string;
    ctaSecondary: string;
    stats: { value: number; suffix: string; label: string }[];
  };
  blogCategories: string[];
  principal: {
    initials: string;
    name: string;
    role: string;
    bio: string;
  };
  seo: {
    siteTitle: string;
    description: string;
    keywords: string;
    copyrightYear: string;
  };
}

export function loadSiteConfig(configPath = path.join(__dirname, "..", "site.config.js")): SiteConfig {
  const src = fs.readFileSync(configPath, "utf-8");
  const sandbox: { DRS_CONFIG?: SiteConfig } = {};
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox, { filename: configPath });

  if (!sandbox.DRS_CONFIG) {
    throw new Error(
      `DRS_CONFIG not found after evaluating ${configPath}. ` +
        `Check that the file still declares "var DRS_CONFIG = {...}".`
    );
  }
  return sandbox.DRS_CONFIG;
}
