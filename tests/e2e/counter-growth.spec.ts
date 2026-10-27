import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { portfolioGrowth } from "../../modules/blog-content/growth";
import type { ContentEntry } from "../../modules/blog-content/scan";
import {
  advanceCounter,
  canProjectCounter,
  maximumProjectionAge,
  lifetimeCounterGrowth,
} from "../../shared/utils/ticker";

const now = Date.UTC(2026, 9, 27, 12);
const hour = 3600_000;
const created = new Date(now - 2 * hour).toISOString();

test("Lifetime rates sum each item's count divided by its own actual age", () => {
  expect(
    lifetimeCounterGrowth(
      [
        { count: 7200, createdAt: created },
        { count: 3600, createdAt: new Date(now - hour).toISOString() },
      ],
      now,
    ),
  ).toEqual({ observedAt: now, since: now - 2 * hour, perSecond: 2 });
  for (const createdAt of [
    undefined,
    "invalid",
    new Date(now).toISOString(),
    new Date(now + hour).toISOString(),
  ]) {
    expect(
      lifetimeCounterGrowth([{ count: 100, createdAt }], now).perSecond,
    ).toBeNull();
  }
  expect(
    lifetimeCounterGrowth([{ count: 100, createdAt: created }], 0).perSecond,
  ).toBeNull();
  expect(
    lifetimeCounterGrowth([{ count: 0, createdAt: created }], now).perSecond,
  ).toBe(0);
});

test("Missing, future and stale observations cannot start a portfolio estimate", () => {
  const growth = { observedAt: now, since: now - hour, perSecond: 2 };
  expect(canProjectCounter(growth, now)).toBe(true);
  expect(canProjectCounter(growth, now - 1)).toBe(false);
  expect(canProjectCounter(growth, now + maximumProjectionAge + 1)).toBe(false);
  expect(canProjectCounter({ ...growth, perSecond: null }, now)).toBe(false);
  expect(canProjectCounter({ ...growth, perSecond: 0 }, now)).toBe(false);
});

test("Random second-by-second movement preserves the supplied average and fractional increments", () => {
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
    if (Math.abs(rate) < 1)
      expect(Math.max(...[...movements].map(Math.abs))).toBe(1);
  }
  expect(advanceCounter({ value: 0, remainder: 0 }, -2, 1, 0.5).value).toBe(0);
  expect(
    advanceCounter({ value: Number.MAX_SAFE_INTEGER, remainder: 0 }, 2, 1, 0.5)
      .value,
  ).toBe(Number.MAX_SAFE_INTEGER);
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

async function saveObservations(
  dir: string,
  createdAt: string | undefined = created,
  updated = now,
) {
  await mkdir(dir, { recursive: true });
  await writeFile(
    join(dir, "blog-portfolio.json"),
    JSON.stringify({
      updated,
      snapshots: {
        [project.data.permalink]: {
          repository: "example/project",
          stars: 102,
          forks: 0,
          createdAt,
        },
      },
    }),
  );
  await writeFile(
    join(dir, "blog-nuget.json"),
    JSON.stringify({
      updated,
      snapshots: {
        "example.package": {
          id: "Example.Package",
          downloads: 7200,
          createdAt,
        },
      },
    }),
  );
}

test("Portfolio lifetime rates work on the first observation and deduplicate published scope", async ({}, info) => {
  const dir = info.outputPath("growth");
  await saveObservations(dir);
  const ignored = [false, true].map((published) => ({
    ...project,
    data: { ...project.data, published, kind: "microsoft" as const },
  }));
  const result = await portfolioGrowth(dir, [project, project, ...ignored]);
  expect(result.downloads.perSecond).toBe(1);
  expect(result.stars.perSecond).toBe(102 / 7200);
});

test("Missing creation dates and source failures disable a rate rather than inventing one", async ({}, info) => {
  const dir = info.outputPath("growth");
  await saveObservations(dir);
  await writeFile(
    join(dir, "blog-nuget.json"),
    JSON.stringify({
      updated: now,
      snapshots: {
        "example.package": { id: "Example.Package", downloads: 100 },
      },
    }),
  );
  expect(
    (await portfolioGrowth(dir, [project])).downloads.perSecond,
  ).toBeNull();
  await saveObservations(dir, created, 0);
  expect(
    (await portfolioGrowth(dir, [project])).downloads.observedAt,
  ).toBeNull();
  await writeFile(join(dir, "blog-nuget.json"), "{}");
  await expect(portfolioGrowth(dir, [project])).rejects.toThrow();
});
