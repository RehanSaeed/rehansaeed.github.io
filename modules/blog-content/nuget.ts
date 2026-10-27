import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { load } from "cheerio";
import { useLogger } from "nuxt/kit";
import { z } from "zod";
import type { ContentEntry } from "./scan";

const packageSchema = z.object({
  id: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_.-]*$/),
  downloads: z.number().int().nonnegative(),
  createdAt: z.iso.datetime({ offset: true }).optional(),
});
const observationSchema = z.object({
  updated: z.number(),
  snapshots: z.record(z.string(), packageSchema),
});
export const cacheSchema = observationSchema.extend({
  previous: observationSchema.optional(),
});
const downloadCountSchema = z
  .string()
  .regex(/^\d+$/)
  .transform(Number)
  .pipe(packageSchema.shape.downloads);
const logger = useLogger("blog-content:nuget");

export async function portfolioDownloads(
  dataDir: string,
  entries: ContentEntry[],
) {
  const projects = entries
    .filter(
      (entry) =>
        entry.collection === "portfolio" && entry.data.kind !== "microsoft",
    )
    .map(({ data }) => {
      const packages = z
        .array(packageSchema.pick({ id: true }))
        .parse(data.nugetPackages ?? []);
      const ids = packages.map(({ id }) => id.toLowerCase());
      if (new Set(ids).size !== ids.length) {
        throw new Error(`Duplicate NuGet packages for ${data.permalink}.`);
      }
      return { permalink: data.permalink, packages };
    });
  const ids = [
    ...new Set(
      projects.flatMap(({ packages }) =>
        packages.map(({ id }) => id.toLowerCase()),
      ),
    ),
  ].sort();
  const path = join(dataDir, "blog-nuget.json");
  let cached: z.infer<typeof cacheSchema> | undefined;
  try {
    cached = cacheSchema.parse(JSON.parse(await readFile(path, "utf8")));
  } catch (error) {
    if (!(
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    )) {
      logger.warn("Ignoring invalid NuGet snapshot cache:", error);
    }
  }
  const fresh =
    cached &&
    Date.now() - cached.updated < 60 * 60 * 1000 &&
    ids.every(
      (id) =>
        cached.snapshots[id]?.id.toLowerCase() === id &&
        cached.snapshots[id]?.createdAt,
    );
  const snapshots: z.infer<typeof cacheSchema>["snapshots"] = {};
  let complete = true;
  for (const id of ids) {
    const saved = cached?.snapshots[id];
    if (fresh && saved) {
      snapshots[id] = saved;
      continue;
    }
    try {
      const url = new URL("https://www.nuget.org/api/v2/FindPackagesById()");
      url.searchParams.set("id", `'${id}'`);
      url.searchParams.set("$top", "1");
      url.searchParams.set("$orderby", "Created asc");
      url.searchParams.set("semVerLevel", "2.0.0");
      const response = await fetch(url, {
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) {
        throw new Error(`NuGet request failed: HTTP ${response.status}`);
      }
      const $ = load(await response.text(), { xml: true });
      const entry = $("entry").first();
      const responseId = entry.find("d\\:Id").text();
      if (responseId.toLowerCase() !== id) {
        throw new Error(`NuGet response did not contain package ${id}.`);
      }
      snapshots[id] = {
        id: responseId,
        // DownloadCount is package-wide; VersionDownloadCount is not.
        downloads: downloadCountSchema.parse(
          entry.find("d\\:DownloadCount").text(),
        ),
        createdAt: packageSchema.shape.createdAt
          .unwrap()
          .parse(entry.find("d\\:Created").text()),
      };
    } catch (error) {
      if (!saved || saved.id.toLowerCase() !== id) {
        throw new Error(`NuGet downloads unavailable for ${id}.`, {
          cause: error,
        });
      }
      complete = false;
      logger.warn(
        `NuGet downloads unavailable for ${id}; keeping saved counts:`,
        error,
      );
      snapshots[id] = saved;
    }
  }
  if (!fresh) {
    await writeFile(
      path,
      JSON.stringify({
        updated: complete ? Date.now() : 0,
        snapshots,
        previous:
          cached && cached.updated > 0
            ? { updated: cached.updated, snapshots: cached.snapshots }
            : cached?.previous,
      }),
    );
  }
  return Object.fromEntries(
    projects.map(({ permalink, packages }) => {
      const nugetPackages = packages.map(({ id }) => ({
        id,
        downloads: snapshots[id.toLowerCase()]!.downloads,
      }));
      return [
        permalink,
        {
          nugetPackages,
          nugetDownloads: packageSchema.shape.downloads.parse(
            nugetPackages.reduce((total, pkg) => total + pkg.downloads, 0),
          ),
        },
      ];
    }),
  );
}
