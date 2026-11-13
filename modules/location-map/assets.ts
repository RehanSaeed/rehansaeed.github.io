import type { NuxtManifest } from "@nuxt/schema";

export const deferMapAssets = (manifest: NuxtManifest): Set<string> => {
  const files = new Set<string>();
  for (const [id, resource] of Object.entries(manifest)) {
    const sources = [id, resource.src ?? ""];
    if (
      !sources.some((source) =>
        /(?:^|\/)maplibre-gl\//.test(source.replaceAll("\\", "/")),
      )
    ) {
      continue;
    }
    files.add(resource.file);
    for (const file of [...(resource.css ?? []), ...(resource.assets ?? [])]) {
      files.add(file);
    }
  }
  for (const resource of Object.values(manifest)) {
    if (files.has(resource.file)) {
      resource.prefetch = false;
      resource.preload = false;
    }
  }
  return files;
};
