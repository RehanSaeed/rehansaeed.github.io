import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { measureCounterGrowth } from "../../shared/utils/ticker";
import { cacheSchema as popularitySchema } from "./portfolio";
import { cacheSchema as downloadsSchema } from "./nuget";
import type { ContentEntry } from "./scan";

export async function portfolioGrowth(
  dataDir: string,
  entries: ContentEntry[],
) {
  const projects = entries.filter(
    ({ collection, data }) =>
      collection === "portfolio" && data.published && data.kind !== "microsoft",
  );
  const [popularity, downloads] = await Promise.all([
    readFile(join(dataDir, "blog-portfolio.json"), "utf8").then((text) =>
      popularitySchema.parse(JSON.parse(text)),
    ),
    readFile(join(dataDir, "blog-nuget.json"), "utf8").then((text) =>
      downloadsSchema.parse(JSON.parse(text)),
    ),
  ]);
  const repositories = [...new Set(projects.map(({ data }) => data.permalink))];
  const ids = [
    ...new Set(
      projects.flatMap(({ data }) =>
        (data.nugetPackages ?? []).map(({ id }) => id.toLowerCase()),
      ),
    ),
  ];
  function starCount(snapshots: typeof popularity.snapshots) {
    const counts = new Map<string, number>();
    for (const permalink of repositories) {
      const snapshot = snapshots[permalink];
      if (!snapshot) return undefined;
      const repository = new URL(permalink).pathname.slice(1).toLowerCase();
      if (snapshot.repository.toLowerCase() !== repository) return undefined;
      counts.set(repository, snapshot.stars);
    }
    return [...counts.values()].reduce((sum, count) => sum + count, 0);
  }
  function downloadCount(snapshots: typeof downloads.snapshots) {
    let total = 0;
    for (const id of ids) {
      const snapshot = snapshots[id];
      if (!snapshot || snapshot.id.toLowerCase() !== id) return undefined;
      total += snapshot.downloads;
    }
    return total;
  }
  const stars = starCount(popularity.snapshots);
  const packages = downloadCount(downloads.snapshots);
  if (stars === undefined || packages === undefined) {
    throw new Error("Missing current portfolio growth observations.");
  }
  const previousStars =
    popularity.previous && starCount(popularity.previous.snapshots);
  const previousDownloads =
    downloads.previous && downloadCount(downloads.previous.snapshots);
  return {
    stars: measureCounterGrowth(
      stars,
      popularity.updated,
      previousStars !== undefined && popularity.previous
        ? { count: previousStars, observedAt: popularity.previous.updated }
        : undefined,
      true,
    ),
    downloads: measureCounterGrowth(
      packages,
      downloads.updated,
      previousDownloads !== undefined && downloads.previous
        ? { count: previousDownloads, observedAt: downloads.previous.updated }
        : undefined,
    ),
  };
}
