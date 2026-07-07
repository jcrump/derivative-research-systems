/**
 * DRS Site Configuration
 * ──────────────────────
 * This is the single source of truth for all site content.
 * Edit via admin/config.html, or directly here.
 * After editing, run: npm run build
 */
var DRS_CONFIG = {

  /* ── BRAND ─────────────────────────────────────────────────────── */
  brand: {
    logoMark:    "DRS",          // Short initials shown in logo mark
    logoName:    "Derivative Research Systems",
    tagline:     "Boutique IT advisory specializing in modernization, technical debt elimination, and security integration for enterprise teams.",
    domain:      "derivativeresearchsystems.com",
    founded:     "2024",
    location:    "Milwaukee, WI",
    accentColor: "#76b900",      // Primary green — drives CSS --green token
  },

  /* ── CONTACT ────────────────────────────────────────────────────── */
  contact: {
    advisoryEmail:  "advisory.account@derivativeresearchsystems.com",
    ceoEmail:       "jeffcrump@derivativeresearchsystems.com",
    linkedIn:       "https://www.linkedin.com/company/71403992/",
    locationFull:   "Milwaukee, Wisconsin",
    locationSub:    "On-site & remote engagements",
    responseTime:   "Within 1 business day",
    formspreeId:    "xzdqvbvl",  // → https://formspree.io/f/{formspreeId}
    ctaLabel:       "Engage DRS",
  },

  /* ── HERO ───────────────────────────────────────────────────────── */
  hero: {
    eyebrow:    "Milwaukee, WI · Est. 1995",
    headline:   ["Modernize.", "Secure.", "Scale."],   // Lines; last one gets accent color
    subtext:    "Boutique IT advisory for enterprises that need architecture that works — not just architecture that looks good on a slide.",
    ctaPrimary:   "Engage DRS →",
    ctaSecondary: "Our Services",
    stats: [
      { value: 10,  suffix: "+", label: "Years Experience" },
      { value: 40,  suffix: "+", label: "Enterprise Engagements" },
      { value: 96,  suffix: "%", label: "Client Retention Rate" },
      { value: 6,   suffix: "+", label: "Industries Served" },
    ],
  },

  /* ── TICKER ─────────────────────────────────────────────────────── */
  ticker: [
    "IT Modernization",
    "Technical Debt Elimination",
    "Security Integration Advisory",
    "Microservices Architecture",
    "AWS · Azure · Cloud Migration",
    "Kafka · Event Streaming",
    "Zero Trust Security",
    "Spring Boot · Java Platform",
    "CI/CD Pipeline Engineering",
    "Distributed Systems Design",
  ],

  /* ── SERVICES (pillars) ─────────────────────────────────────────── */
  services: [
    {
      icon: "⬡",
      name: "IT Modernization",
      desc: "Transform legacy monoliths into cloud-native, event-driven architectures without disrupting production. We build the bridge, not just the destination.",
    },
    {
      icon: "◈",
      name: "Technical Debt Elimination",
      desc: "Systematic audit, prioritization, and elimination of architectural risk. We quantify the cost of inaction and build a roadmap your board can understand.",
    },
    {
      icon: "⊛",
      name: "Security Integration Advisory",
      desc: "Zero-trust architecture, compliance gap analysis, and security-by-design integration across your platform stack — built in, not bolted on.",
    },
    {
      icon: "⊞",
      name: "Platform Engineering",
      desc: "Microservices design, Kafka event streaming, distributed systems architecture, and CI/CD pipeline modernization. Deep Java and Spring Boot expertise.",
    },
    {
      icon: "◧",
      name: "Cloud Migration Strategy",
      desc: "AWS and Azure migration planning, multi-cloud architecture, and infrastructure-as-code adoption. Practical sequencing, not slide-deck theory.",
    },
    {
      icon: "⬗",
      name: "Architecture Review",
      desc: "Independent review of proposed or existing architectures. We tell you what your internal team can't — clearly, with evidence, and with a path forward.",
    },
  ],

  /* ── TECH STACK ─────────────────────────────────────────────────── */
  techStack: [
    "Java", "Spring Boot", "Apache Kafka", "AWS", "Azure",
    "Kubernetes", "Docker", "PostgreSQL", "TypeScript",
    "Terraform", "GitHub Actions", "Zero Trust",
  ],

  /* ── WHY DRS (split section) ────────────────────────────────────── */
  whyUs: {
    badge:    "Architecture-First",
    eyebrow:  "Why DRS",
    headline: ["We work at the level", "where decisions matter."],
    body:     "Most consulting firms staff engagements with analysts who document your problems and hand the findings to your team. DRS is different: you get a Principal Engineer with real delivery history who works alongside your architects, writes the ADRs, and stays accountable to the outcome.",
    bullets: [
      "10+ years across fintech, healthcare, energy, manufacturing, and SaaS",
      "Hands-on Java and distributed systems depth — not just PowerPoint architecture",
      "Security and compliance integration as a first-class deliverable",
      "Milwaukee-based, available for on-site engagements across the Midwest",
      "Honest gap identification — we tell you what you need, not what sells",
    ],
    cta: "Schedule an Assessment",
  },

  /* ── CASE STUDIES ───────────────────────────────────────────────── */
  caseStudies: [
    {
      industry:  "Fintech",
      client:    "Regional Bank · Chicago, IL",
      title:     "Monolith-to-Microservices Migration for Core Banking Platform",
      excerpt:   "Designed event-driven decomposition strategy for a 15-year-old Java monolith processing $4B/year in transactions. Phased migration using Strangler Fig pattern with Kafka as the event spine.",
      metric:    "73%",
      metricLabel: "Deploy Frequency Increase",
      bgGradient: "linear-gradient(135deg,#0a1a00,#0d2200)",
    },
    {
      industry:  "Healthcare",
      client:    "Regional Health Network · Milwaukee, WI",
      title:     "HIPAA Compliance Architecture & Security Integration",
      excerpt:   "Audited and remediated security posture across 14 microservices. Implemented zero-trust network segmentation, secrets management via Vault, and automated compliance scanning in CI/CD.",
      metric:    "0",
      metricLabel: "Audit Findings Post-Remediation",
      bgGradient: "linear-gradient(135deg,#001a1a,#00221a)",
    },
    {
      industry:  "Energy",
      client:    "Utility Provider · Upper Midwest",
      title:     "AWS Cloud Migration & Technical Debt Paydown Roadmap",
      excerpt:   "Quantified $2.8M/year in carrying costs for deferred architectural debt. Built a 3-phase AWS migration plan with infrastructure-as-code and a 24-month paydown roadmap approved by the board.",
      metric:    "$2.8M",
      metricLabel: "Annual Savings Identified",
      bgGradient: "linear-gradient(135deg,#0a0a1a,#0d0d2a)",
    },
  ],

  /* ── INDUSTRIES ─────────────────────────────────────────────────── */
  industries: [
    { icon: "🏦", name: "Fintech" },
    { icon: "🏥", name: "Healthcare" },
    { icon: "⚡", name: "Energy" },
    { icon: "🏭", name: "Manufacturing" },
    { icon: "☁️", name: "SaaS" },
    { icon: "🔐", name: "Gov & Compliance" },
  ],

  /* ── ABOUT / PRINCIPAL ──────────────────────────────────────────── */
  principal: {
    initials:  "JC",
    name:      "Jeff Crump",
    role:      "Founder & Principal Architect",
    bio:       "Senior Java Engineer and Technical Lead with 10+ years of hands-on delivery across fintech, healthcare, energy, manufacturing, and SaaS. Deep expertise in Java, Spring Boot, microservices, distributed systems, AWS/Azure, Kafka, and CI/CD. Based in Milwaukee, WI.",
  },

  /* ── CREDENTIALS ────────────────────────────────────────────────── */
  credentials: [
    {
      year:  "10+ Years",
      title: "Enterprise Java & Distributed Systems",
      org:   "Spring Boot · Kafka · Microservices · AWS · Azure",
    },
    {
      year:  "Sector Depth",
      title: "Cross-Industry Delivery Experience",
      org:   "Fintech · Healthcare · Energy · Manufacturing · SaaS",
    },
    {
      year:  "Advisory",
      title: "IT Modernization & Security Integration",
      org:   "Technical Debt Elimination · Zero Trust · Compliance Architecture",
    },
    {
      year:  "Location",
      title: "Milwaukee, Wisconsin",
      org:   "Available for on-site engagements across the Midwest and remote globally",
    },
  ],

  /* ── CTA BAND ───────────────────────────────────────────────────── */
  ctaBand: {
    headline: "Ready to fix what's actually broken?",
    sub:      "Most architecture problems are predictable. The cost of waiting isn't.",
    cta:      "Schedule a Free Assessment →",
  },

  /* ── BLOG CATEGORIES ────────────────────────────────────────────── */
  blogCategories: [
    "Architecture",
    "Security",
    "Modernization",
    "Cloud",
    "Engineering",
    "Advisory",
  ],

  /* ── SEO / META ─────────────────────────────────────────────────── */
  seo: {
    siteTitle:   "Derivative Research Systems | IT Modernization & Security Advisory",
    description: "Boutique IT advisory firm specializing in IT modernization, technical debt elimination, and security integration for enterprise teams.",
    keywords:    "IT modernization, technical debt, security integration, microservices, Java, distributed systems, cloud migration, Milwaukee",
    copyrightYear: "2019",
  },
};
