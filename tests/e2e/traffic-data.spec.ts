import { generateKeyPairSync, verify } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { postTrafficSnapshot } from "../../modules/blog-content/traffic";
import type { ContentEntry } from "../../modules/blog-content/scan";
import {
  trafficHistorySchema,
  trafficMonths,
  selectTrafficRange,
  trafficDays,
  trafficDailyStart,
  formatTrafficDuration,
} from "../../shared/utils/traffic";

const keys = generateKeyPairSync("rsa", { modulusLength: 2048 });
const originalNow = Date.now;
const credentials = JSON.stringify({
  client_email: "traffic@example.iam.gserviceaccount.com",
  private_key: keys.privateKey.export({ type: "pkcs8", format: "pem" }),
});
const entry = (permalink = "/example/", date = "2020-01-01"): ContentEntry => ({
  path: "posts/2020/example/index.md",
  collection: "posts",
  data: {
    title: "Example",
    heroImage: "/images/hero/Code-1600x900.jpg",
    permalink,
    published: true,
    date,
  },
});
const row = (
  path: string,
  month: string,
  views: string,
  engagementSeconds = "60",
) => ({
  dimensionValues: [{ value: month }, { value: path }],
  metricValues: [{ value: views }, { value: engagementSeconds }],
});
const report = (rows = [row("/example/", "20240115", "12")]) => ({
  dimensionHeaders: [{ name: "date" }, { name: "pagePath" }],
  metricHeaders: [
    { name: "screenPageViews" },
    { name: "userEngagementDuration" },
  ],
  rows,
  rowCount: rows.length,
  metadata: { timeZone: "Europe/London" },
});
let originalFetch: typeof fetch;
let originalEnv: NodeJS.ProcessEnv;
test.beforeEach(() => {
  originalFetch = globalThis.fetch;
  originalEnv = { ...process.env };
  process.env.GA4_PROPERTY_ID = "123456";
  process.env.GA4_START_DATE = "2024-01-15";
  process.env.GA4_SERVICE_ACCOUNT_JSON = credentials;
});
test.afterEach(() => {
  globalThis.fetch = originalFetch;
  Date.now = originalNow;
  for (const key of [
    "GA4_PROPERTY_ID",
    "GA4_START_DATE",
    "GA4_SERVICE_ACCOUNT_JSON",
  ]) {
    if (originalEnv[key] === undefined)
      Reflect.deleteProperty(process.env, key);
    else process.env[key] = originalEnv[key];
  }
});

test("Exports complete monthly history and signs a read-only OAuth assertion", async ({}, info) => {
  const dir = info.outputPath("cache");
  await mkdir(dir, { recursive: true });
  let requests = 0;
  globalThis.fetch = async (input, init) => {
    requests++;
    if (String(input).includes("oauth2")) {
      const assertion = new URLSearchParams(String(init?.body)).get(
        "assertion",
      )!;
      const [header, payload, signature] = assertion.split(".");
      expect(
        verify(
          "RSA-SHA256",
          Buffer.from(`${header}.${payload}`),
          keys.publicKey,
          Buffer.from(signature!, "base64url"),
        ),
      ).toBe(true);
      expect(
        JSON.parse(Buffer.from(payload!, "base64url").toString()),
      ).toMatchObject({
        iss: "traffic@example.iam.gserviceaccount.com",
        scope: "https://www.googleapis.com/auth/analytics.readonly",
        aud: "https://oauth2.googleapis.com/token",
      });
      return Response.json({ access_token: "test-only-token" });
    }
    expect(String(input)).toContain("/properties/123456:runReport");
    const body = JSON.parse(String(init?.body));
    expect(body.metrics).toEqual([
      { name: "screenPageViews" },
      { name: "userEngagementDuration" },
    ]);
    expect(body.dateRanges[0]).toEqual({
      startDate: "2024-01-15",
      endDate: new Date(Date.now() - 4 * 86_400_000).toISOString().slice(0, 10),
    });
    expect(body.dimensionFilter.filter).toMatchObject({
      fieldName: "hostName",
      stringFilter: { matchType: "EXACT", value: "rehansaeed.com" },
    });
    return Response.json(
      report([
        row("/example/", "20240115", "12", "120.5"),
        row("/example", "20240115", "3", "30.25"),
        row("/example/", "20240301", "5", "2e2"),
        row("/draft/", "20240115", "999"),
        row("/about/", "20240115", "999"),
      ]),
    );
  };
  const draft = entry("/draft/");
  draft.data.published = false;
  const snapshot = await postTrafficSnapshot(
    dir,
    [entry(), draft],
    "https://rehansaeed.com",
  );
  expect(Object.keys(snapshot!.posts)).toEqual(["/example/"]);
  expect(snapshot!.timeZone).toBe("Europe/London");
  expect(snapshot!.posts["/example/"]!.months.slice(0, 3)).toEqual([
    { month: "2024-01", views: 15, engagementSeconds: 150.75 },
    { month: "2024-02", views: 0, engagementSeconds: 0 },
    { month: "2024-03", views: 5, engagementSeconds: 200 },
  ]);
  expect(snapshot!.posts["/example/"]!.startDate).toBe("2024-01-15");
  const cache = await readFile(
    info.outputPath("cache", "blog-traffic.json"),
    "utf8",
  );
  expect(cache).not.toContain("PRIVATE KEY");
  expect(cache).not.toContain("test-only-token");
  expect(
    await postTrafficSnapshot(dir, [entry()], "https://rehansaeed.com"),
  ).toEqual(snapshot);
  expect(requests).toBe(2);
});

test("Retrieves all report pages instead of truncating history", async ({}, info) => {
  const dir = info.outputPath("cache");
  await mkdir(dir, { recursive: true });
  const offsets: number[] = [];
  globalThis.fetch = async (input, init) => {
    if (String(input).includes("oauth2"))
      return Response.json({ access_token: "test" });
    const { offset } = JSON.parse(String(init?.body));
    offsets.push(offset);
    return Response.json({
      ...report([row("/example/", offset ? "20240201" : "20240115", "2")]),
      rowCount: 2,
    });
  };
  const snapshot = await postTrafficSnapshot(
    dir,
    [entry()],
    "https://rehansaeed.com",
  );
  expect(offsets).toEqual([0, 1]);
  expect(
    snapshot!.posts["/example/"]!.months.slice(0, 2).map(({ views }) => views),
  ).toEqual([2, 2]);
});

test("Starts at publication for newer posts and omits posts outside the processed window", async ({}, info) => {
  const dir = info.outputPath("cache");
  await mkdir(dir, { recursive: true });
  globalThis.fetch = async (input) =>
    Response.json(
      String(input).includes("oauth2")
        ? { access_token: "test" }
        : report([
            row("/newer/", "20240219", "100"),
            row("/newer/", "20240220", "5"),
          ]),
    );
  const snapshot = await postTrafficSnapshot(
    dir,
    [entry("/newer/", "2024-02-20"), entry("/future/", "9999-01-01")],
    "https://rehansaeed.com",
  );
  expect(Object.keys(snapshot!.posts)).toEqual(["/newer/"]);
  expect(snapshot!.posts["/newer/"]!.startDate).toBe("2024-02-20");
  expect(snapshot!.posts["/newer/"]!.months[0]).toEqual({
    month: "2024-02",
    views: 5,
    engagementSeconds: 60,
  });
});

test("Disabled reporting makes no API requests even with an old cache", async ({}, info) => {
  delete process.env.GA4_PROPERTY_ID;
  delete process.env.GA4_START_DATE;
  delete process.env.GA4_SERVICE_ACCOUNT_JSON;
  globalThis.fetch = async () => {
    throw new Error("Unexpected API request");
  };
  expect(
    await postTrafficSnapshot(
      info.outputPath("unused"),
      [entry()],
      "https://rehansaeed.com",
    ),
  ).toBeNull();
});

test("Invalid configuration is explicit and does not expose the service-account JSON", async ({}, info) => {
  process.env.GA4_SERVICE_ACCOUNT_JSON = "sensitive-invalid-json";
  await expect(
    postTrafficSnapshot(
      info.outputPath("unused"),
      [entry()],
      "https://rehansaeed.com",
    ),
  ).rejects.toThrow("Invalid GA4 reporting configuration.");
  process.env.GA4_SERVICE_ACCOUNT_JSON = credentials;
  process.env.GA4_START_DATE = "2024-02-30";
  await expect(
    postTrafficSnapshot(
      info.outputPath("unused"),
      [entry()],
      "https://rehansaeed.com",
    ),
  ).rejects.toThrow("Invalid GA4 reporting configuration.");
  process.env.GA4_START_DATE = "9999-01-01";
  await expect(
    postTrafficSnapshot(
      info.outputPath("unused"),
      [entry()],
      "https://rehansaeed.com",
    ),
  ).rejects.toThrow("at least four days ago");
});

for (const failure of [
  "http",
  "sampled",
  "thresholded",
  "other-row",
  "invalid-count",
  "invalid-engagement",
  "missing-engagement",
  "wrong-metric",
  "overflow",
  "incomplete-pagination",
]) {
  test(`Rejects ${failure} reports rather than inventing zero traffic`, async ({}, info) => {
    const dir = info.outputPath("cache");
    await mkdir(dir, { recursive: true });
    globalThis.fetch = async (input) => {
      if (String(input).includes("oauth2"))
        return Response.json({ access_token: "test" });
      if (failure === "http") return new Response(null, { status: 503 });
      const response = report(
        failure === "incomplete-pagination"
          ? []
          : [
              row(
                "/example/",
                "20240115",
                failure === "invalid-count" ? "-1" : "12",
                failure === "invalid-engagement"
                  ? "NaN"
                  : failure === "overflow"
                    ? "1e30"
                    : "60",
              ),
            ],
      );
      return Response.json({
        ...response,
        ...(failure === "missing-engagement"
          ? {
              rows: response.rows.map((item) => ({
                ...item,
                metricValues: item.metricValues.slice(0, 1),
              })),
            }
          : {}),
        ...(failure === "wrong-metric"
          ? {
              metricHeaders: [
                { name: "screenPageViews" },
                { name: "activeUsers" },
              ],
            }
          : {}),
        ...(failure === "incomplete-pagination" ? { rowCount: 1 } : {}),
        metadata: {
          ...response.metadata,
          ...(failure === "sampled" ? { samplingMetadatas: [{}] } : {}),
          ...(failure === "thresholded" ? { subjectToThresholding: true } : {}),
          ...(failure === "other-row" ? { dataLossFromOtherRow: true } : {}),
        },
      });
    };
    await expect(
      postTrafficSnapshot(dir, [entry()], "https://rehansaeed.com"),
    ).rejects.toThrow("GA4 traffic unavailable and no saved snapshot exists.");
  });
}

test("Failed refresh keeps the original timestamp, removes drafts and retries next time", async ({}, info) => {
  const dir = info.outputPath("cache");
  await mkdir(dir, { recursive: true });
  const file = info.outputPath("cache", "blog-traffic.json");
  const history = {
    startDate: "2024-01-15",
    endDate: "2024-01-31",
    months: [{ month: "2024-01", views: 10 }],
  };
  const saved = {
    source: {
      propertyId: "123456",
      startDate: "2024-01-15",
      hostname: "rehansaeed.com",
    },
    snapshot: {
      updated: "2024-02-01T00:00:00Z",
      timeZone: "Europe/London",
      posts: { "/example/": history, "/draft/": history },
    },
  };
  await writeFile(file, JSON.stringify(saved));
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return new Response(null, { status: 503 });
  };
  const snapshot = await postTrafficSnapshot(
    dir,
    [entry()],
    "https://rehansaeed.com",
  );
  expect(snapshot).toEqual({
    ...saved.snapshot,
    posts: { "/example/": history },
  });
  expect(JSON.parse(await readFile(file, "utf8"))).toEqual(saved);
  await postTrafficSnapshot(dir, [entry()], "https://rehansaeed.com");
  expect(calls).toBe(2);
  process.env.GA4_PROPERTY_ID = "987654";
  await expect(
    postTrafficSnapshot(dir, [entry()], "https://rehansaeed.com"),
  ).rejects.toThrow("no saved snapshot");
});

test("History validation rejects missing months, negative values and invalid dates", () => {
  expect(trafficMonths("2023-12-15", "2024-02-01")).toEqual([
    "2023-12",
    "2024-01",
    "2024-02",
  ]);
  const history = {
    startDate: "2024-01-15",
    endDate: "2024-02-01",
    months: [
      { month: "2024-01", views: 2 },
      { month: "2024-02", views: 0 },
    ],
  };
  expect(trafficHistorySchema.safeParse(history).success).toBe(true);
  expect(
    trafficHistorySchema.safeParse({
      ...history,
      months: history.months.slice(1),
    }).success,
  ).toBe(false);
  expect(
    trafficHistorySchema.safeParse({ ...history, startDate: "2024-02-30" })
      .success,
  ).toBe(false);
  expect(
    trafficHistorySchema.safeParse({
      ...history,
      months: [{ month: "2024-01", views: -1 }],
    }).success,
  ).toBe(false);
});

test("Fresh caches refresh when reporting coverage or the published article set changes", async ({}, info) => {
  const dir = info.outputPath("cache");
  await mkdir(dir, { recursive: true });
  let calls = 0;
  globalThis.fetch = async (input) => {
    calls++;
    return Response.json(
      String(input).includes("oauth2") ? { access_token: "test" } : report([]),
    );
  };
  await postTrafficSnapshot(dir, [entry()], "https://rehansaeed.com");
  await postTrafficSnapshot(
    dir,
    [entry(), entry("/new/")],
    "https://rehansaeed.com",
  );
  expect(calls).toBe(4);
  const file = info.outputPath("cache", "blog-traffic.json");
  const cached = JSON.parse(await readFile(file, "utf8"));
  cached.snapshot.posts["/new/"].endDate = "2024-01-31";
  cached.snapshot.posts["/new/"].months = [{ month: "2024-01", views: 0 }];
  await writeFile(file, JSON.stringify(cached));
  await postTrafficSnapshot(
    dir,
    [entry(), entry("/new/")],
    "https://rehansaeed.com",
  );
  expect(calls).toBe(6);
});

test("Processing cutoff leaves more than 48 hours even at UTC midnight for western timezones", async ({}, info) => {
  const dir = info.outputPath("cache");
  await mkdir(dir, { recursive: true });
  Date.now = () => Date.parse("2026-10-25T00:00:00Z");
  globalThis.fetch = async (input, init) => {
    if (String(input).includes("oauth2"))
      return Response.json({ access_token: "test" });
    const { endDate } = JSON.parse(String(init?.body)).dateRanges[0];
    const latestEndOfDay = Date.parse(`${endDate}T23:59:59-12:00`);
    expect(Date.now() - latestEndOfDay).toBeGreaterThan(48 * 60 * 60 * 1000);
    return Response.json(report([]));
  };
  await postTrafficSnapshot(dir, [entry()], "https://rehansaeed.com");
});

test("Engagement requires complete finite nonnegative totals but accepts old view-only snapshots", () => {
  const history = {
    startDate: "2024-01-15",
    endDate: "2024-02-29",
    months: [
      { month: "2024-01", views: 2, engagementSeconds: 20.5 },
      { month: "2024-02", views: 0, engagementSeconds: 0 },
    ],
  };
  expect(trafficHistorySchema.safeParse(history).success).toBe(true);
  for (const engagementSeconds of [
    -1,
    NaN,
    Infinity,
    Number.MAX_VALUE,
    undefined,
  ]) {
    expect(
      trafficHistorySchema.safeParse({
        ...history,
        months: [
          history.months[0],
          { ...history.months[1], engagementSeconds },
        ],
      }).success,
    ).toBe(false);
  }
  expect(
    trafficHistorySchema.safeParse({
      ...history,
      months: history.months.map(({ month, views }) => ({ month, views })),
    }).success,
  ).toBe(true);
});

test("A fresh view-only cache is upgraded instead of hiding engagement for a day", async ({}, info) => {
  const dir = info.outputPath("cache");
  await mkdir(dir, { recursive: true });
  let calls = 0;
  globalThis.fetch = async (input) => {
    calls++;
    return Response.json(
      String(input).includes("oauth2") ? { access_token: "test" } : report(),
    );
  };
  await postTrafficSnapshot(dir, [entry()], "https://rehansaeed.com");
  const file = info.outputPath("cache", "blog-traffic.json");
  const saved = JSON.parse(await readFile(file, "utf8"));
  for (const month of saved.snapshot.posts["/example/"].months)
    delete month.engagementSeconds;
  delete saved.snapshot.posts["/example/"].days;
  await writeFile(file, JSON.stringify(saved));
  const updated = await postTrafficSnapshot(
    dir,
    [entry()],
    "https://rehansaeed.com",
  );
  expect(calls).toBe(4);
  expect(updated!.posts["/example/"]!.months[0]!.engagementSeconds).toBe(60);
});

test("Date presets select monthly or daily data relative to the reporting cutoff", () => {
  const history = {
    startDate: "2020-01-15",
    endDate: "2024-02-29",
    months: trafficMonths("2020-01-15", "2024-02-29").map((month, index) => ({
      month,
      views: index + 1,
      engagementSeconds: (index + 1) * 10,
    })),
  };
  expect(selectTrafficRange(history, 0).points).toHaveLength(
    history.months.length,
  );
  const year = selectTrafficRange(history, 12);
  expect(year.startDate).toBe("2023-03-01");
  expect(year.endDate).toBe("2024-02-29");
  expect(year.interval).toBe("month");
  expect(year.points.map((point) => point.date)).toEqual(
    history.months.slice(-12).map((point) => `${point.month}-01`),
  );
  expect(year.points.reduce((sum, item) => sum + item.views, 0)).toBe(534);
  const short = {
    ...history,
    startDate: "2023-03-15",
    months: history.months.slice(-12),
  };
  expect(selectTrafficRange(short, 12).startDate).toBe("2023-03-15");
  expect(() => selectTrafficRange(history, 30)).toThrow(
    "Daily traffic is unavailable",
  );
  const days = trafficDays("2024-01-31", "2024-02-29").map((date) => ({
    date,
    views: 1,
    engagementSeconds: 10,
  }));
  const daily = selectTrafficRange({ ...history, days }, 30);
  expect(daily.interval).toBe("day");
  expect(daily.points).toEqual(days);
  expect(daily.startDate).toBe("2024-01-31");
  expect(daily.endDate).toBe("2024-02-29");
  expect(trafficDailyStart("2024-02-20", "2024-02-29")).toBe("2024-02-20");
  expect(trafficDays("2024-02-20", "2024-02-29")).toHaveLength(10);
  expect(formatTrafficDuration(59.5)).toBe("1m 0s");
});

test("Exports exactly the last 30 processed days without another GA4 query", async ({}, info) => {
  Date.now = () => Date.parse("2024-03-04T12:00:00Z");
  const dir = info.outputPath("cache");
  await mkdir(dir, { recursive: true });
  globalThis.fetch = async (input) =>
    Response.json(
      String(input).includes("oauth2")
        ? { access_token: "test" }
        : report([
            row("/example/", "20240130", "100", "1000"),
            row("/example/", "20240131", "3", "30"),
            row("/example", "20240131", "2", "20"),
            row("/example/", "20240201", "5", "50"),
            row("/example/", "20240229", "7", "70"),
          ]),
    );
  const snapshot = await postTrafficSnapshot(
    dir,
    [entry()],
    "https://rehansaeed.com",
  );
  const history = snapshot!.posts["/example/"]!;
  expect(history.days).toHaveLength(30);
  expect(history.days![0]).toEqual({
    date: "2024-01-31",
    views: 5,
    engagementSeconds: 50,
  });
  expect(history.days!.at(-1)).toEqual({
    date: "2024-02-29",
    views: 7,
    engagementSeconds: 70,
  });
  expect(history.days![2]).toEqual({
    date: "2024-02-02",
    views: 0,
    engagementSeconds: 0,
  });
  expect(history.days!.reduce((sum, day) => sum + day.views, 0)).toBe(17);
  expect(history.months[0]!.views).toBe(105);
});

test("Daily coverage is shortened at publication and inconsistent totals are rejected", () => {
  const history = {
    startDate: "2024-02-28",
    endDate: "2024-02-29",
    months: [{ month: "2024-02", views: 5, engagementSeconds: 50 }],
    days: [
      { date: "2024-02-28", views: 2, engagementSeconds: 20 },
      { date: "2024-02-29", views: 3, engagementSeconds: 30 },
    ],
  };
  expect(trafficHistorySchema.safeParse(history).success).toBe(true);
  expect(
    trafficHistorySchema.safeParse({ ...history, days: history.days.slice(1) })
      .success,
  ).toBe(false);
  expect(
    trafficHistorySchema.safeParse({
      ...history,
      days: [history.days[0], { ...history.days[1], date: "2024-03-01" }],
    }).success,
  ).toBe(false);
  expect(
    trafficHistorySchema.safeParse({
      ...history,
      days: [history.days[0], { ...history.days[1], views: 100 }],
    }).success,
  ).toBe(false);
  expect(
    trafficHistorySchema.safeParse({
      ...history,
      days: [history.days[0], { ...history.days[1], views: 1 }],
    }).success,
  ).toBe(false);
});
