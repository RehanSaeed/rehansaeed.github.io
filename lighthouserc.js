const { chromium } = require("@playwright/test");

const paths = [
  "/",
  "/about/",
  "/portfolio/",
  "/on-the-etiquette-of-pull-request-comments/",
];
// CI audits each page in a parallel job; locally every page is audited.
const selectedPaths = process.env.LIGHTHOUSE_PATHS
  ? process.env.LIGHTHOUSE_PATHS.split(",")
  : paths;
const unknownPaths = selectedPaths.filter((path) => !paths.includes(path));
if (unknownPaths.length > 0) {
  throw new Error(`Unknown Lighthouse paths: ${unknownPaths.join(", ")}`);
}

module.exports = {
  ci: {
    assert: {
      preset: "lighthouse:recommended",
      assertions: {
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
      url: selectedPaths.map((path) => `http://localhost${path}`),
    },
    upload: {
      target: "filesystem",
      outputDir: ".lighthouseci/reports",
    },
  },
};
