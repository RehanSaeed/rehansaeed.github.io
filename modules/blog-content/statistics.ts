import type { ContentEntry } from "./scan";

export function portfolioStatistics(
  entries: ContentEntry[],
  popularity: Record<string, { repository: string; stars: number }>,
  downloads: Record<
    string,
    { nugetPackages: { id: string; downloads: number }[] }
  >,
) {
  const repositories = new Map<string, number>();
  const packages = new Map<string, number>();
  for (const { data, collection } of entries) {
    if (
      collection !== "portfolio" ||
      !data.published ||
      data.kind === "microsoft"
    ) {
      continue;
    }
    const project = popularity[data.permalink];
    const projectDownloads = downloads[data.permalink];
    if (!project || !projectDownloads) {
      throw new Error(`Missing portfolio statistics: ${data.permalink}`);
    }
    repositories.set(project.repository.toLowerCase(), project.stars);
    for (const pkg of projectDownloads.nugetPackages) {
      packages.set(pkg.id.toLowerCase(), pkg.downloads);
    }
  }
  return {
    stars: [...repositories.values()].reduce((sum, count) => sum + count, 0),
    downloads: [...packages.values()].reduce((sum, count) => sum + count, 0),
    repositories: repositories.size,
    packages: packages.size,
  };
}
