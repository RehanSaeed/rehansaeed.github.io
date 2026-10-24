const { chromium } = require("@playwright/test");

// LHCI's bundled preset still references audits retired by Lighthouse 13.
const retiredAudits = [
  "dom-size",
  "duplicated-javascript",
  "efficient-animated-content",
  "first-meaningful-paint",
  "font-display",
  "font-size",
  "interaction-to-next-paint-insight",
  "lcp-lazy-loaded",
  "lcp-phases-insight",
  "legacy-javascript",
  "modern-image-formats",
  "no-document-write",
  "offscreen-images",
  "prioritize-lcp-image",
  "render-blocking-resources",
  "third-party-facades",
  "uses-long-cache-ttl",
  "uses-optimized-images",
  "uses-passive-event-listeners",
  "uses-rel-preconnect",
  "uses-responsive-images",
  "uses-text-compression",
  "viewport",
];

module.exports = {
  ci: {
    assert: {
      preset: "lighthouse:recommended",
      assertions: {
        ...Object.fromEntries(retiredAudits.map((id) => [id, "off"])),
        "categories:accessibility": ["error", { minScore: 1 }],
        "categories:best-practices": ["error", { minScore: 1 }],
        "categories:seo": ["error", { minScore: 1 }],
        "categories:performance": [
          "warn",
          { minScore: 0.9, aggregationMethod: "median" },
        ],
        // Chromium can report "Internal error / IgnoreEventAndEvict" with no actionable cause.
        "bf-cache": "warn",
        // These diagnostic insights also flag valid high-DPI images and same-origin CSS/manifest chains.
        "image-delivery-insight": "warn",
        "network-dependency-tree-insight": "warn",
        // Browser layout is reported as "[unattributed]" without an actionable script location.
        "forced-reflow-insight": "warn",
        // Keep the old exemptions visible in reports rather than disabling their audits.
        "unused-javascript": ["warn", { maxLength: 0 }],
        "non-composited-animations": "warn",
      },
    },
    collect: {
      staticDistDir: "./dist",
      chromePath: process.env.CHROME_PATH || chromium.executablePath(),
      numberOfRuns: 3,
      settings: {
        // Hosted Ubuntu's AppArmor profile disallows the downloaded Chromium sandbox.
        chromeFlags:
          process.env.GITHUB_ACTIONS === "true" ? "--no-sandbox" : "",
      },
      url: [
        "http://localhost/",
        "http://localhost/about/",
        "http://localhost/portfolio/",
        "http://localhost/on-the-etiquette-of-pull-request-comments/",
      ],
    },
    upload: {
      target: "filesystem",
      outputDir: ".lighthouseci/reports",
    },
  },
};
