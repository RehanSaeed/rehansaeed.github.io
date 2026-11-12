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

const assertions = {
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
};

module.exports = {
  ci: {
    assert: {
      assertMatrix: [
        { matchingUrlPattern: "^(?!.*/about/$)", assertions },
        {
          // The author keeps About's hotlinked Stack Overflow flair, whose Cloudflare
          // __cf_bm and _cfuvid cookies fail these audits; keep them visible as warnings.
          matchingUrlPattern: "/about/$",
          assertions: {
            ...assertions,
            "categories:best-practices": ["warn", { minScore: 1 }],
            "third-party-cookies": "warn",
            "inspector-issues": "warn",
          },
        },
      ].map((entry) => ({ preset: "lighthouse:recommended", ...entry })),
    },
    collect: {
      staticDistDir: "./dist",
      chromePath: process.env.CHROME_PATH || chromium.executablePath(),
      // Other CI page jobs keep their existing browser launch path.
      ...(selectedPaths.includes("/about/")
        ? {
            puppeteerScript: "./scripts/lighthouse-fixtures.cjs",
            puppeteerLaunchOptions: {
              args:
                process.env.GITHUB_ACTIONS === "true" ? ["--no-sandbox"] : [],
            },
          }
        : {}),
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
