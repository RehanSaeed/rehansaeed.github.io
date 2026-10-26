import { createPrivateKey, sign } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { useLogger } from "nuxt/kit";
import { z } from "zod";
import {
  trafficDateSchema,
  trafficMonths,
  trafficSnapshotSchema,
  type TrafficSnapshot,
} from "../../shared/utils/traffic";
import type { ContentEntry } from "./scan";

const logger = useLogger("blog-content:traffic");
const settingsSchema = z.object({
  propertyId: z.string().regex(/^\d+$/),
  startDate: trafficDateSchema,
  credentials: z.object({
    client_email: z.email(),
    private_key: z.string().min(1),
  }),
});
const sourceSchema = z.object({
  propertyId: z.string(),
  startDate: trafficDateSchema,
  hostname: z.string(),
});
const cacheSchema = z.object({
  source: sourceSchema,
  snapshot: trafficSnapshotSchema,
});
const reportSchema = z.object({
  dimensionHeaders: z.array(z.object({ name: z.string() })),
  metricHeaders: z.array(z.object({ name: z.string() })),
  rowCount: z.number().int().nonnegative().default(0),
  rows: z
    .array(
      z.object({
        dimensionValues: z.array(z.object({ value: z.string() })).length(2),
        metricValues: z
          .array(
            z.object({
              value: z
                .string()
                .regex(/^\d+$/)
                .transform(Number)
                .pipe(z.number().int().nonnegative().safe()),
            }),
          )
          .length(1),
      }),
    )
    .default([]),
  metadata: z.object({
    timeZone: z.string().min(1),
    dataLossFromOtherRow: z.boolean().optional(),
    subjectToThresholding: z.boolean().optional(),
    samplingMetadatas: z.array(z.unknown()).optional(),
  }),
});

async function googleRequest(url: string, init: RequestInit) {
  const response = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    // Do not log Google's response body: authentication responses can contain credentials.
    throw new Error(`GA4 request failed (HTTP ${response.status}).`);
  }
  return response.json();
}

async function accessToken(
  credentials: z.infer<typeof settingsSchema>["credentials"],
) {
  const issued = Math.floor(Date.now() / 1000);
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const assertion = [
    encode({ alg: "RS256", typ: "JWT" }),
    encode({
      iss: credentials.client_email,
      scope: "https://www.googleapis.com/auth/analytics.readonly",
      aud: "https://oauth2.googleapis.com/token",
      iat: issued,
      exp: issued + 3600,
    }),
  ].join(".");
  const signature = sign(
    "RSA-SHA256",
    Buffer.from(assertion),
    createPrivateKey(credentials.private_key),
  ).toString("base64url");
  const token = await googleRequest("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${assertion}.${signature}`,
    }),
  });
  return z.object({ access_token: z.string().min(1) }).parse(token)
    .access_token;
}

export async function postTrafficSnapshot(
  dataDir: string,
  entries: ContentEntry[],
  siteUrl: string,
): Promise<TrafficSnapshot | null> {
  const values = [
    process.env.GA4_PROPERTY_ID,
    process.env.GA4_START_DATE,
    process.env.GA4_SERVICE_ACCOUNT_JSON,
  ];
  if (values.every((value) => !value)) {
    logger.info("Article traffic disabled: GA4 reporting is not configured.");
    return null;
  }
  let settings: z.infer<typeof settingsSchema>;
  try {
    settings = settingsSchema.parse({
      propertyId: values[0],
      startDate: values[1],
      credentials: JSON.parse(values[2] ?? "null"),
    });
    createPrivateKey(settings.credentials.private_key);
  } catch {
    throw new Error(
      "Invalid GA4 reporting configuration. Set GA4_PROPERTY_ID, GA4_START_DATE and GA4_SERVICE_ACCOUNT_JSON (a service account with a valid private key).",
    );
  }
  const hostname = new URL(siteUrl).hostname;
  const source = {
    propertyId: settings.propertyId,
    startDate: settings.startDate,
    hostname,
  };
  // Leave at least 48 hours for processing, even in properties behind UTC.
  const endDate = new Date(Date.now() - 4 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  if (settings.startDate > endDate) {
    throw new Error("GA4_START_DATE must be at least four days ago.");
  }
  const posts = entries
    .filter((entry) => entry.collection === "posts" && entry.data.published)
    .map(({ data }) => ({
      permalink: data.permalink,
      date: trafficDateSchema.parse(data.date?.slice(0, 10)),
    }));
  const cachePath = join(dataDir, "blog-traffic.json");
  let cached: z.infer<typeof cacheSchema> | undefined;
  try {
    const saved = cacheSchema.parse(
      JSON.parse(await readFile(cachePath, "utf8")),
    );
    if (JSON.stringify(saved.source) === JSON.stringify(source)) cached = saved;
  } catch (error) {
    if (!(
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    )) {
      logger.warn("Ignoring invalid GA4 snapshot cache.");
    }
  }
  const filterSnapshot = (snapshot: TrafficSnapshot): TrafficSnapshot => ({
    ...snapshot,
    posts: Object.fromEntries(
      posts.flatMap(({ permalink, date }) => {
        const history = snapshot.posts[permalink];
        return history && history.startDate >= date
          ? [[permalink, history]]
          : [];
      }),
    ),
  });
  if (
    cached &&
    Date.now() >= Date.parse(cached.snapshot.updated) &&
    Date.now() - Date.parse(cached.snapshot.updated) < 24 * 60 * 60 * 1000 &&
    posts.every(({ permalink, date }) => {
      const history = cached.snapshot.posts[permalink];
      return (
        date > endDate ||
        (history?.startDate ===
          (date > settings.startDate ? date : settings.startDate) &&
          history.endDate === endDate)
      );
    })
  ) {
    return filterSnapshot(cached.snapshot);
  }
  let snapshot: TrafficSnapshot;
  try {
    const token = await accessToken(settings.credentials);
    const counts = new Map<string, Map<string, number>>();
    const published = new Map(
      posts.map(({ permalink, date }) => [permalink, date]),
    );
    let offset = 0;
    let rowCount = 0;
    let timeZone: string | undefined;
    do {
      const report = reportSchema.parse(
        await googleRequest(
          `https://analyticsdata.googleapis.com/v1beta/properties/${settings.propertyId}:runReport`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              dateRanges: [{ startDate: settings.startDate, endDate }],
              dimensions: [{ name: "date" }, { name: "pagePath" }],
              metrics: [{ name: "screenPageViews" }],
              dimensionFilter: {
                filter: {
                  fieldName: "hostName",
                  stringFilter: { matchType: "EXACT", value: hostname },
                },
              },
              orderBys: [
                { dimension: { dimensionName: "date" } },
                { dimension: { dimensionName: "pagePath" } },
              ],
              limit: 10_000,
              offset,
            }),
          },
        ),
      );
      if (
        report.dimensionHeaders.map(({ name }) => name).join() !==
          "date,pagePath" ||
        report.metricHeaders.map(({ name }) => name).join() !==
          "screenPageViews" ||
        report.metadata.dataLossFromOtherRow ||
        report.metadata.subjectToThresholding ||
        report.metadata.samplingMetadatas?.length ||
        (timeZone && timeZone !== report.metadata.timeZone) ||
        (offset && rowCount !== report.rowCount)
      ) {
        throw new Error("GA4 returned an incomplete or inconsistent report.");
      }
      timeZone = report.metadata.timeZone;
      rowCount = report.rowCount;
      for (const row of report.rows) {
        const rawDate = row.dimensionValues[0]!.value;
        if (!/^\d{8}$/.test(rawDate)) {
          throw new Error("GA4 returned an invalid reporting date.");
        }
        const date = trafficDateSchema.parse(
          `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6)}`,
        );
        if (date < settings.startDate || date > endDate) {
          throw new Error("GA4 returned a date outside the requested range.");
        }
        const month = date.slice(0, 7);
        const path = row.dimensionValues[1]!.value;
        const permalink = path.endsWith("/") ? path : `${path}/`;
        const publicationDate = published.get(permalink);
        if (!publicationDate || date < publicationDate) continue;
        const months = counts.get(permalink) ?? new Map<string, number>();
        months.set(
          month,
          (months.get(month) ?? 0) + row.metricValues[0]!.value,
        );
        counts.set(permalink, months);
      }
      offset += report.rows.length;
      if (offset > rowCount) {
        throw new Error("GA4 returned more rows than the report's row count.");
      }
      if (!report.rows.length && offset < rowCount) {
        throw new Error("GA4 pagination ended before all rows were returned.");
      }
    } while (offset < rowCount);
    snapshot = trafficSnapshotSchema.parse({
      updated: new Date().toISOString(),
      timeZone,
      posts: Object.fromEntries(
        posts.flatMap(({ permalink, date }) => {
          const startDate =
            date > settings.startDate ? date : settings.startDate;
          if (startDate > endDate) return [];
          return [
            [
              permalink,
              {
                startDate,
                endDate,
                months: trafficMonths(startDate, endDate).map((month) => ({
                  month,
                  views: counts.get(permalink)?.get(month) ?? 0,
                })),
              },
            ],
          ];
        }),
      ),
    });
  } catch (error) {
    if (!cached) {
      throw new Error("GA4 traffic unavailable and no saved snapshot exists.", {
        cause: error,
      });
    }
    logger.warn(
      `GA4 traffic unavailable; retaining snapshot from ${cached.snapshot.updated}:`,
      error,
    );
    return filterSnapshot(cached.snapshot);
  }
  await writeFile(cachePath, JSON.stringify({ source, snapshot }));
  return snapshot;
}
