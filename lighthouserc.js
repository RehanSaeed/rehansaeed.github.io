module.exports = {
  ci: {
    assert: {
      preset: "lighthouse:recommended",
      assertions: {
        canonical: "off",
        "content-width": "off",
        "crawlable-anchors": "off",
        "image-size-responsive": "off",
        "unsized-images": "off",
        "unused-javascript": "off",
        "uses-optimized-images": "off",
        "uses-responsive-images": "off",
        "non-composited-animations": "off",
        "largest-contentful-paint": ["warn", { minScore: 0.07 }],
        "legacy-javascript": ["warn", { minScore: 3 }],
        "uses-webp-images": "off",
        //   'categories:performance': ['error', { minScore: 0.9 }],
        //   'categories:accessibility': ['warn', { minScore: 0.9 }],
      },
    },
    collect: {
      staticDistDir: "./dist",
      url: [
        "http://localhost/index.html",
        // "http://localhost/just-start-the-first-blog-post/index.html",
        // "http://localhost/portfolio/index.html",
        // "http://localhost/about/index.html",
        // "http://localhost.com/tag/net/index.html"
      ],
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
