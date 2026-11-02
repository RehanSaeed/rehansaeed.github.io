import { mkdir, readFile, writeFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { portfolioSnapshots } from "../../modules/blog-content/portfolio";
import type { ContentEntry } from "../../modules/blog-content/scan";
import { cacheSchema } from "./data";

const project = (repository: string): ContentEntry => ({
  path: `portfolio/${repository}/index.md`,
  collection: "portfolio",
  data: {
    title: repository,
    heroImage: "/images/hero/Code-1600x900.jpg",
    permalink: `https://github.com/${repository}`,
    published: true,
  },
});

test("Portfolio popularity refreshes expired counts and reuses fresh counts", async ({}, info) => {
  const dir = info.outputPath("portfolio-cache");
  await mkdir(dir, { recursive: true });
  const entry = project("example/project");
  const originalFetch = globalThis.fetch;
  let calls = 0;
  let stars = 20;
  globalThis.fetch = () => {
    calls++;
    return Promise.resolve(
      new Response(JSON.stringify({ stargazers_count: stars, forks_count: 3 })),
    );
  };
  try {
    const snapshots = await portfolioSnapshots(dir, [entry]);
    expect(snapshots[entry.data.permalink]).toEqual({
      repository: "example/project",
      stars: 20,
      forks: 3,
    });
    stars = 30;
    expect(await portfolioSnapshots(dir, [entry])).toEqual(snapshots);
    expect(calls).toBe(1);
    await writeFile(
      info.outputPath("portfolio-cache", "blog-portfolio.json"),
      JSON.stringify({ updated: 0, snapshots }),
    );
    const refreshed = await portfolioSnapshots(dir, [entry]);
    expect(refreshed[entry.data.permalink]?.stars).toBe(30);
    expect(calls).toBe(2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("A newly added project cannot be omitted by a fresh popularity cache", async ({}, info) => {
  const dir = info.outputPath("portfolio-cache");
  await mkdir(dir, { recursive: true });
  const first = project("example/first");
  const second = project("example/second");
  await writeFile(
    info.outputPath("portfolio-cache", "blog-portfolio.json"),
    JSON.stringify({
      updated: Date.now(),
      snapshots: {
        [first.data.permalink]: {
          repository: "example/first",
          stars: 10,
          forks: 1,
        },
      },
    }),
  );
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () =>
    Promise.resolve(
      new Response(JSON.stringify({ stargazers_count: 50, forks_count: 4 })),
    );
  try {
    const snapshots = await portfolioSnapshots(dir, [first, second]);
    expect(Object.keys(snapshots)).toHaveLength(2);
    expect(snapshots[second.data.permalink]?.stars).toBe(50);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Unavailable GitHub preserves saved popularity and schedules another refresh", async ({}, info) => {
  const dir = info.outputPath("portfolio-cache");
  await mkdir(dir, { recursive: true });
  const entry = project("example/project");
  const snapshots = {
    [entry.data.permalink]: {
      repository: "example/project",
      stars: 20,
      forks: 3,
    },
  };
  const file = info.outputPath("portfolio-cache", "blog-portfolio.json");
  await writeFile(file, JSON.stringify({ updated: 0, snapshots }));
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => Promise.resolve(new Response(null, { status: 503 }));
  try {
    expect(await portfolioSnapshots(dir, [entry])).toEqual(snapshots);
    expect(
      cacheSchema.parse(JSON.parse(await readFile(file, "utf8"))).updated,
    ).toBe(0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Missing or invalid GitHub counts fail instead of fabricating zero popularity", async ({}, info) => {
  const dir = info.outputPath("portfolio-cache");
  await mkdir(dir, { recursive: true });
  const entries = [project("example/project")];
  const originalFetch = globalThis.fetch;
  try {
    for (const response of [
      new Response(null, { status: 503 }),
      new Response(JSON.stringify({ stargazers_count: -1, forks_count: 3 })),
      new Response(JSON.stringify({ stargazers_count: "20", forks_count: 3 })),
    ]) {
      globalThis.fetch = () => Promise.resolve(response);
      await expect(portfolioSnapshots(dir, entries)).rejects.toThrow(
        "GitHub popularity unavailable for example/project.",
      );
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Portfolio repositories must be HTTPS GitHub repository URLs", async ({}, info) => {
  for (const permalink of [
    "https://example.com/owner/repo",
    "http://github.com/owner/repo",
    "https://github.com/owner/repo/issues",
    "https://github.com/owner/repo?tab=readme",
  ]) {
    const entry = project("example/project");
    entry.data.permalink = permalink;
    await expect(
      portfolioSnapshots(info.outputPath("unused-cache"), [entry]),
    ).rejects.toThrow("Invalid portfolio GitHub URL:");
  }
});

test("Microsoft work does not request or fabricate GitHub statistics", async ({}, info) => {
  const dir = info.outputPath("portfolio-cache");
  await mkdir(dir, { recursive: true });
  const entry = project("example/project");
  entry.data.kind = "microsoft";
  entry.data.permalink = "https://blogs.windows.com/example/";
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () =>
    Promise.reject(
      new Error("Microsoft product links must not reach the GitHub API."),
    );
  try {
    expect(await portfolioSnapshots(dir, [entry])).toEqual({});
  } finally {
    globalThis.fetch = originalFetch;
  }
});
