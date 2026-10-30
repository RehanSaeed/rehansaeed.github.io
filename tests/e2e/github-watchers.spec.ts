import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { accountWatchers } from "../../modules/blog-content/watchers";

const originalFetch = globalThis.fetch;
const originalToken = process.env.GITHUB_TOKEN;
test.beforeEach(() => {
  process.env.GITHUB_TOKEN = "watchers-test-token";
});
test.afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalToken === undefined) delete process.env.GITHUB_TOKEN;
  else process.env.GITHUB_TOKEN = originalToken;
});

function page(
  counts: number[],
  hasNextPage = false,
  endCursor: string | null = null,
  followers = 123,
) {
  return {
    data: {
      user: {
        followers: { totalCount: followers },
        repositories: {
          nodes: counts.map((totalCount) => ({
            watchers: { totalCount },
            watchers_count: 9000,
          })),
          pageInfo: { hasNextPage, endCursor },
        },
      },
    },
  };
}

test("Account watchers sum true watch subscriptions across every public owned repository page", async ({}, info) => {
  const dir = info.outputPath("watchers-cache");
  await mkdir(dir, { recursive: true });
  let calls = 0;
  globalThis.fetch = async (url, init) => {
    expect(url).toBe("https://api.github.com/graphql");
    expect(init?.method).toBe("POST");
    const request = JSON.parse(String(init?.body));
    expect(request.query).toContain("ownerAffiliations: [OWNER]");
    expect(request.query).toContain("privacy: PUBLIC");
    expect(request.query).toContain("followers { totalCount }");
    expect(request.variables).toEqual({
      owner: "example",
      cursor: calls === 0 ? null : "next",
    });
    calls++;
    return Response.json(
      calls === 1 ? page(Array(100).fill(2), true, "next") : page([3, 4]),
    );
  };
  expect(await accountWatchers(dir, "example")).toEqual({
    followers: 123,
    watchers: 207,
    repositories: 102,
  });
  expect(calls).toBe(2);
  expect(await accountWatchers(dir, "example")).toEqual({
    followers: 123,
    watchers: 207,
    repositories: 102,
  });
  expect(calls).toBe(2);
  expect(
    JSON.parse(await readFile(join(dir, "blog-github-watchers.json"), "utf8")),
  ).toEqual({
    owner: "example",
    updated: expect.any(Number),
    followers: 123,
    watchers: 207,
    repositories: 102,
  });
});

test("Expired watcher totals refresh and genuine zero subscriptions are retained", async ({}, info) => {
  const dir = info.outputPath("watchers-cache");
  await mkdir(dir, { recursive: true });
  await writeFile(
    join(dir, "blog-github-watchers.json"),
    JSON.stringify({
      owner: "example",
      updated: 0,
      followers: 123,
      watchers: 50,
      repositories: 3,
    }),
  );
  globalThis.fetch = async () => Response.json(page([0], false, null, 0));
  expect(await accountWatchers(dir, "example")).toEqual({
    followers: 0,
    watchers: 0,
    repositories: 1,
  });
});

test("A failed later page keeps the complete saved watcher total and retries next build", async ({}, info) => {
  const dir = info.outputPath("watchers-cache");
  await mkdir(dir, { recursive: true });
  const file = join(dir, "blog-github-watchers.json");
  const saved = {
    owner: "example",
    updated: 0,
    followers: 123,
    watchers: 50,
    repositories: 3,
  };
  await writeFile(file, JSON.stringify(saved));
  let calls = 0;
  globalThis.fetch = async () =>
    ++calls === 1
      ? Response.json(page([10], true, "next"))
      : new Response(null, { status: 503 });
  expect(await accountWatchers(dir, "example")).toEqual({
    followers: 123,
    watchers: 50,
    repositories: 3,
  });
  expect(JSON.parse(await readFile(file, "utf8"))).toEqual(saved);
});

test("Invalid and partial watcher responses never fabricate zero or partial totals", async ({}, info) => {
  const dir = info.outputPath("watchers-cache");
  await mkdir(dir, { recursive: true });
  for (const response of [
    new Response(null, { status: 503 }),
    Response.json(page([-1])),
    Response.json(page([10], true, null)),
    Response.json({ ...page([10]), errors: [{ message: "rate limited" }] }),
    Response.json({ errors: [{ message: "not authorised" }] }),
    Response.json({
      data: {
        user: { ...page([10]).data.user, followers: { totalCount: -1 } },
      },
    }),
    Response.json({
      data: { user: { repositories: page([10]).data.user.repositories } },
    }),
  ]) {
    globalThis.fetch = async () => response;
    await expect(accountWatchers(dir, "example")).rejects.toThrow(
      "GitHub watchers unavailable for example.",
    );
  }
  delete process.env.GITHUB_TOKEN;
  await expect(accountWatchers(dir, "example")).rejects.toThrow(
    "GitHub watchers unavailable for example.",
  );
});

test("A fresh legacy cache without followers is refreshed rather than displaying zero", async ({}, info) => {
  const dir = info.outputPath("watchers-cache");
  await mkdir(dir, { recursive: true });
  await writeFile(
    join(dir, "blog-github-watchers.json"),
    JSON.stringify({
      owner: "example",
      updated: Date.now(),
      watchers: 10,
      repositories: 1,
    }),
  );
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return Response.json(page([20]));
  };
  expect(await accountWatchers(dir, "example")).toEqual({
    followers: 123,
    watchers: 20,
    repositories: 1,
  });
  expect(calls).toBe(1);
});

test("A different account's cached watcher total is never reused", async ({}, info) => {
  const dir = info.outputPath("watchers-cache");
  await mkdir(dir, { recursive: true });
  await writeFile(
    join(dir, "blog-github-watchers.json"),
    JSON.stringify({
      owner: "another-account",
      updated: Date.now(),
      followers: 123,
      watchers: 99,
      repositories: 5,
    }),
  );
  globalThis.fetch = async () => new Response(null, { status: 403 });
  await expect(accountWatchers(dir, "example")).rejects.toThrow(
    "GitHub watchers unavailable for example.",
  );
});

test("Invalid watcher caches are reported and repeated pagination cursors fail", async ({}, info) => {
  const dir = info.outputPath("watchers-cache");
  await mkdir(dir, { recursive: true });
  await writeFile(
    join(dir, "blog-github-watchers.json"),
    JSON.stringify({
      owner: "example",
      updated: Date.now(),
      followers: 123,
      watchers: -1,
      repositories: 1,
    }),
  );
  globalThis.fetch = async () => Response.json(page([10], true, "same"));
  await expect(accountWatchers(dir, "example")).rejects.toThrow(
    "GitHub watchers unavailable for example.",
  );
});
