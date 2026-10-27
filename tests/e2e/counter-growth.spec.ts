import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { portfolioGrowth } from "../../modules/blog-content/growth";
import type { ContentEntry } from "../../modules/blog-content/scan";
import {
  advanceCounter,
  canProjectCounter,
  maximumProjectionAge,
  measureCounterGrowth,
  projectCounter,
} from "../../shared/utils/ticker";

const hour = 60 * 60 * 1000;
const now = Date.UTC(2026, 9, 27, 12);

test("Counter rates use genuine elapsed time, allow falling stars and reject download regressions", () => {
  const previous = { count: 100, observedAt: now - 2 * hour };
  expect(measureCounterGrowth(7300, now, previous)).toEqual({
    observedAt: now,
    since: previous.observedAt,
    perSecond: 1,
  });
  expect(measureCounterGrowth(98, now, previous, true).perSecond).toBe(
    -2 / 7200,
  );
  expect(measureCounterGrowth(98, now, previous).perSecond).toBeNull();
  expect(measureCounterGrowth(100, now, previous).perSecond).toBe(0);
  expect(measureCounterGrowth(100, now).perSecond).toBeNull();
  expect(measureCounterGrowth(100, 0, previous).perSecond).toBeNull();
  expect(
    measureCounterGrowth(100, now, {
      count: 90,
      observedAt: now - hour + 1,
    }).perSecond,
  ).toBeNull();
});

test("Ticker projections are bounded, expire and never extrapolate from a future observation", () => {
  const growth = { observedAt: now, since: now - hour, perSecond: 2 };
  expect(projectCounter(100, growth, now + 5000)).toBe(110);
  expect(projectCounter(100, { ...growth, perSecond: -2 }, now + 100_000)).toBe(
    0,
  );
  expect(projectCounter(Number.MAX_SAFE_INTEGER, growth, now + 5000)).toBe(
    Number.MAX_SAFE_INTEGER,
  );
  expect(projectCounter(100, growth, now - 1)).toBe(100);
  expect(projectCounter(100, growth, now + maximumProjectionAge + 1)).toBe(100);
  expect(canProjectCounter(growth, now + maximumProjectionAge)).toBe(true);
  expect(canProjectCounter(growth, now + maximumProjectionAge + 1)).toBe(false);
  expect(canProjectCounter({ ...growth, perSecond: null }, now)).toBe(false);
  expect(canProjectCounter({ ...growth, perSecond: 0 }, now)).toBe(false);
});

test("Random second-by-second movement preserves the measured average and fractional star increments", () => {
  for (const rate of [100, 0.01, -0.01]) {
    let state = { value: 1000, remainder: 0 };
    const movements = new Set<number>();
    for (let i = 0; i < 10_000; i++) {
      const next = advanceCounter(state, rate, 1, (i + 0.5) / 10_000);
      movements.add(next.value - state.value);
      state = next;
    }
    expect(state.value + state.remainder).toBeCloseTo(1000 + rate * 10_000, 6);
    expect(movements.size).toBeGreaterThan(1);
    if (Math.abs(rate) < 1) {
      expect(movements.has(0)).toBe(true);
      expect(Math.max(...[...movements].map(Math.abs))).toBe(1);
    }
  }
  expect(advanceCounter({ value: 0, remainder: 0 }, -2, 1, 0.5).value).toBe(0);
});

const project: ContentEntry = {
  collection: "portfolio",
  path: "portfolio/example/index.md",
  data: {
    title: "Example",
    permalink: "https://github.com/example/project",
    published: true,
    heroImage: "/images/hero/Code-1600x900.jpg",
    nugetPackages: [{ id: "Example.Package" }],
  },
};

async function saveObservations(dir: string, previous = true) {
  await mkdir(dir, { recursive: true });
  const popularity = (stars: number) => ({
    [project.data.permalink]: {
      repository: "example/project",
      stars,
      forks: 0,
    },
  });
  const packages = (downloads: number) => ({
    "example.package": { id: "Example.Package", downloads },
  });
  await writeFile(
    join(dir, "blog-portfolio.json"),
    JSON.stringify({
      updated: now,
      snapshots: popularity(102),
      previous: previous
        ? { updated: now - 2 * hour, snapshots: popularity(100) }
        : undefined,
    }),
  );
  await writeFile(
    join(dir, "blog-nuget.json"),
    JSON.stringify({
      updated: now,
      snapshots: packages(7300),
      previous: previous
        ? { updated: now - 2 * hour, snapshots: packages(100) }
        : undefined,
    }),
  );
}

test("Portfolio trends compare the same published scope and deduplicate entries", async ({}, info) => {
  const dir = info.outputPath("growth");
  await saveObservations(dir);
  const ignored = [false, true].map((published) => ({
    ...project,
    data: { ...project.data, published, kind: "microsoft" as const },
  }));
  const result = await portfolioGrowth(dir, [project, project, ...ignored]);
  expect(result.downloads.perSecond).toBe(1);
  expect(result.stars.perSecond).toBe(2 / 7200);
});

test("Missing history and newly added packages have no invented rate", async ({}, info) => {
  const dir = info.outputPath("growth");
  await saveObservations(dir, false);
  expect(
    (await portfolioGrowth(dir, [project])).downloads.perSecond,
  ).toBeNull();
  await saveObservations(dir);
  const file = join(dir, "blog-nuget.json");
  await writeFile(
    file,
    JSON.stringify({
      updated: now,
      snapshots: {
        "example.package": { id: "Example.Package", downloads: 100 },
        "example.new": { id: "Example.New", downloads: 200 },
      },
      previous: {
        updated: now - 2 * hour,
        snapshots: {
          "example.package": { id: "Example.Package", downloads: 90 },
        },
      },
    }),
  );
  const expanded = {
    ...project,
    data: {
      ...project.data,
      nugetPackages: [{ id: "Example.Package" }, { id: "Example.New" }],
    },
  };
  const result = await portfolioGrowth(dir, [expanded]);
  expect(result.downloads.perSecond).toBeNull();
  expect(result.stars.perSecond).not.toBeNull();
});

test("Incomplete or corrupt source data never becomes a new measured rate", async ({}, info) => {
  const dir = info.outputPath("growth");
  await saveObservations(dir);
  await writeFile(
    join(dir, "blog-nuget.json"),
    JSON.stringify({
      updated: 0,
      snapshots: {
        "example.package": { id: "Example.Package", downloads: 7300 },
      },
      previous: {
        updated: now - 2 * hour,
        snapshots: {
          "example.package": { id: "Example.Package", downloads: 100 },
        },
      },
    }),
  );
  const result = await portfolioGrowth(dir, [project]);
  expect(result.downloads.perSecond).toBeNull();
  expect(result.downloads.observedAt).toBeNull();
  await writeFile(join(dir, "blog-nuget.json"), "{}");
  await expect(portfolioGrowth(dir, [project])).rejects.toThrow();
});
