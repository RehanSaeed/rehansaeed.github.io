import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { lifetimeCounterGrowth } from "../../shared/utils/ticker";
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
  const repositories = new Map<string, { count: number; createdAt?: string }>();
  const packages = new Map<string, { count: number; createdAt?: string }>();
  for (const { data } of projects) {
    const repository = new URL(data.permalink).pathname.slice(1).toLowerCase();
    const snapshot = popularity.snapshots[data.permalink];
    if (!snapshot || snapshot.repository.toLowerCase() !== repository) {
      throw new Error(
        `Missing current portfolio growth observation: ${repository}.`,
      );
    }
    repositories.set(repository, {
      count: snapshot.stars,
      createdAt: snapshot.createdAt,
    });
    for (const { id } of data.nugetPackages ?? []) {
      const key = id.toLowerCase();
      const pkg = downloads.snapshots[key];
      if (!pkg || pkg.id.toLowerCase() !== key) {
        throw new Error(`Missing current portfolio growth observation: ${id}.`);
      }
      packages.set(key, { count: pkg.downloads, createdAt: pkg.createdAt });
    }
  }
  return {
    stars: lifetimeCounterGrowth(
      [...repositories.values()],
      popularity.updated,
    ),
    downloads: lifetimeCounterGrowth([...packages.values()], downloads.updated),
  };
}
