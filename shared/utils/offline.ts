import { z } from "zod";

export const offlineEntrySchema = z.object({
  url: z.string(),
  revision: z.string().nullable(),
  integrity: z.string(),
});
export type OfflineEntry = z.infer<typeof offlineEntrySchema>;

export const offlineGenerationSchema = z.object({
  id: z.string(),
  entries: z.array(offlineEntrySchema).min(1),
});
export type OfflineGeneration = z.infer<typeof offlineGenerationSchema>;

export const offlineStateSchema = z.object({
  active: z.string().optional(),
  previous: z.string().optional(),
  pending: z
    .object({
      generation: z.string(),
      cursor: z.number().int().nonnegative(),
      phase: z.enum(["download", "verify"]),
      paused: z.boolean(),
      error: z.string(),
    })
    .optional(),
  lease: z.object({ token: z.string(), until: z.number() }).optional(),
});
export type OfflineState = z.infer<typeof offlineStateSchema>;

export const offlineStatusSchema = z.object({
  generation: z.string(),
  total: z.number().int().positive(),
  saved: z.number().int().nonnegative(),
  verified: z.number().int().nonnegative(),
  ready: z.boolean(),
  previousReady: z.boolean(),
  paused: z.boolean(),
  busy: z.boolean(),
  error: z.string(),
});
export type OfflineStatus = z.infer<typeof offlineStatusSchema>;

export const offlineCommandSchema = z.enum([
  "status",
  "start",
  "pause",
  "batch",
]);
export type OfflineCommand = z.infer<typeof offlineCommandSchema>;
export const offlineMessageSchema = z.object({
  command: offlineCommandSchema,
  buildIntegrity: z.string(),
});

export function offlineKey(entry: OfflineEntry, origin: string) {
  const url = new URL(entry.url, origin);
  if (entry.revision) {
    url.searchParams.set("__WB_REVISION__", entry.revision);
  }
  return url.href;
}

export function offlineCandidates(input: string) {
  const url = new URL(input);
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) {
    if (/^(utm_|fbclid$|_b$|v$)/.test(key)) {
      url.searchParams.delete(key);
    }
  }
  const candidates = [url.href];
  if (url.pathname.endsWith("/")) {
    candidates.push(new URL(`index.html${url.search}`, url).href);
  } else if (!url.pathname.split("/").at(-1)?.includes(".")) {
    url.pathname += "/";
    candidates.push(url.href);
  }
  return candidates;
}

export function offlineCache(id: string) {
  return `blog-offline-full-${id}`;
}

export async function offlineIntegrity(response: Response, integrity: string) {
  const hash = await crypto.subtle.digest(
    "SHA-256",
    await response.arrayBuffer(),
  );
  return (
    `sha256-${btoa(String.fromCharCode(...new Uint8Array(hash)))}` === integrity
  );
}
