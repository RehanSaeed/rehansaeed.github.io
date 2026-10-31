import { mkdir, readFile, writeFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { portfolioDownloads } from "../../modules/blog-content/nuget";
import type { ContentEntry } from "../../modules/blog-content/scan";
import { cacheSchema, requestUrl } from "./data";

const originalFetch = globalThis.fetch;

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

const project = (...ids: string[]): ContentEntry => ({
  path: "portfolio/example/index.md",
  collection: "portfolio",
  data: {
    title: "Example",
    heroImage: "/images/hero/Code-1600x900.jpg",
    permalink: "https://github.com/example/project",
    published: true,
    nugetPackages: ids.map((id) => ({ id })),
  },
});
const response = (id: string, downloads: string | number) =>
  new Response(
    `<feed xmlns:d="urn:data"><entry><d:Id>${id}</d:Id><d:DownloadCount>${downloads}</d:DownloadCount><d:VersionDownloadCount>2</d:VersionDownloadCount></entry><entry><d:Id>${id}</d:Id><d:DownloadCount>${downloads}</d:DownloadCount></entry></feed>`,
  );

test("NuGet sums package-wide counts once and refreshes only expired snapshots", async ({}, info) => {
  const dir = info.outputPath("cache");
  await mkdir(dir, { recursive: true });
  const entry = project("Example.First", "Example.Second");
  let firstCount = 100;
  let calls = 0;
  globalThis.fetch = (input) => {
    calls++;
    const url = new URL(requestUrl(input));
    expect(url.origin).toBe("https://www.nuget.org");
    expect(url.searchParams.get("semVerLevel")).toBe("2.0.0");
    const id = url.searchParams.get("id")!.replaceAll("'", "");
    return Promise.resolve(
      response(id, id === "example.first" ? firstCount : 50),
    );
  };
  const snapshots = await portfolioDownloads(dir, [entry]);
  expect(snapshots[entry.data.permalink]).toEqual({
    nugetDownloads: 150,
    nugetPackages: [
      { id: "Example.First", downloads: 100 },
      { id: "Example.Second", downloads: 50 },
    ],
  });
  expect(calls).toBe(2);
  firstCount = 300;
  expect(await portfolioDownloads(dir, [entry])).toEqual(snapshots);
  expect(calls).toBe(2);
  const file = info.outputPath("cache", "blog-nuget.json");
  const saved = cacheSchema.parse(JSON.parse(await readFile(file, "utf8")));
  await writeFile(file, JSON.stringify({ ...saved, updated: 0 }));
  expect(
    (await portfolioDownloads(dir, [entry]))[entry.data.permalink]
      ?.nugetDownloads,
  ).toBe(350);
  expect(calls).toBe(4);
});

test("A new NuGet package invalidates a fresh snapshot and cannot disappear from totals", async ({}, info) => {
  const dir = info.outputPath("cache");
  await mkdir(dir, { recursive: true });
  let calls = 0;
  globalThis.fetch = (input) => {
    calls++;
    const id = new URL(requestUrl(input)).searchParams
      .get("id")!
      .replaceAll("'", "");
    return Promise.resolve(response(id, 100));
  };
  await portfolioDownloads(dir, [project("Example.First")]);
  const entry = project("Example.First", "Example.Second");
  const snapshots = await portfolioDownloads(dir, [entry]);
  expect(snapshots[entry.data.permalink]?.nugetDownloads).toBe(200);
  expect(calls).toBe(3);
});

test("NuGet failures preserve validated saved counts and schedule another refresh", async ({}, info) => {
  const dir = info.outputPath("cache");
  await mkdir(dir, { recursive: true });
  const entry = project("Example.Package");
  globalThis.fetch = () => Promise.resolve(response("Example.Package", 100));
  const snapshots = await portfolioDownloads(dir, [entry]);
  const file = info.outputPath("cache", "blog-nuget.json");
  const saved = cacheSchema.parse(JSON.parse(await readFile(file, "utf8")));
  await writeFile(file, JSON.stringify({ ...saved, updated: 0 }));
  globalThis.fetch = () => Promise.resolve(new Response(null, { status: 503 }));
  expect(await portfolioDownloads(dir, [entry])).toEqual(snapshots);
  expect(
    cacheSchema.parse(JSON.parse(await readFile(file, "utf8"))).updated,
  ).toBe(0);
});

test("Missing, malformed and mismatched NuGet counts fail instead of inventing popularity", async ({}, info) => {
  const dir = info.outputPath("cache");
  await mkdir(dir, { recursive: true });
  for (const invalid of [
    new Response(null, { status: 503 }),
    new Response("<feed/>"),
    response("Other.Package", 100),
    response("Example.Package", ""),
    response("Example.Package", "invalid"),
    response("Example.Package", "-1"),
    response("Example.Package", "1.5"),
    response("Example.Package", "9007199254740992"),
  ]) {
    globalThis.fetch = () => Promise.resolve(invalid);
    await expect(
      portfolioDownloads(dir, [project("Example.Package")]),
    ).rejects.toThrow("NuGet downloads unavailable for example.package.");
  }
});

test("Repeated case-insensitive package IDs cannot double-count downloads", async ({}, info) => {
  globalThis.fetch = () =>
    Promise.reject(
      new Error("No request should be made for invalid package lists."),
    );
  await expect(
    portfolioDownloads(info.outputPath("unused"), [
      project("Example.Package", "example.package"),
    ]),
  ).rejects.toThrow("Duplicate NuGet packages");
  await expect(
    portfolioDownloads(info.outputPath("unused"), [project("../invalid")]),
  ).rejects.toThrow();
});

test("Projects without packages have a known zero and Microsoft work makes no NuGet requests", async ({}, info) => {
  const dir = info.outputPath("cache");
  await mkdir(dir, { recursive: true });
  const openSource = project();
  const microsoft = project("Do.Not.Fetch");
  microsoft.data.kind = "microsoft";
  microsoft.data.permalink = "https://blogs.windows.com/example/";
  globalThis.fetch = () =>
    Promise.reject(new Error("Neither project should make a NuGet request."));
  expect(await portfolioDownloads(dir, [openSource, microsoft])).toEqual({
    [openSource.data.permalink]: { nugetDownloads: 0, nugetPackages: [] },
  });
});
