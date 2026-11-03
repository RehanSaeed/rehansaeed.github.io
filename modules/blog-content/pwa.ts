import type { RuntimeCaching } from "workbox-build";
import type { WorkboxPlugin } from "workbox-core";

// generateSW serialises the blog's runtime policies: keep callbacks self-contained.
const retainedResponse = async ({
  request,
  cachedResponse,
}: {
  request: Request;
  cachedResponse?: Response;
}) => {
  if (cachedResponse) {
    return cachedResponse;
  }
  const url = new URL(request.url);
  url.searchParams.delete("_b");
  url.searchParams.delete("v");
  for (const name of await caches.keys()) {
    if (
      !name.startsWith("workbox-precache-v2-") ||
      !name.endsWith(`${location.origin}/`)
    ) {
      continue;
    }
    const cache = await caches.open(name);
    const candidates = [url.href];
    if (url.pathname.endsWith("/")) {
      candidates.push(`${url.origin}${url.pathname}index.html`);
    }
    for (const candidate of candidates) {
      const response = await cache.match(candidate, { ignoreSearch: true });
      if (response?.status === 200) {
        // The retained precache has no runtime age limit. Do not let the
        // runtime expiration plugin reject it before an offline fetch fails.
        const headers = new Headers(response.headers);
        headers.delete("Date");
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      }
    }
  }
  return undefined;
};
const retainedPrecache: WorkboxPlugin = {
  cachedResponseWillBeUsed: retainedResponse,
  // Runtime expiration must not discard the last usable legacy response offline.
  handlerDidError: retainedResponse,
};

const publicResponse: WorkboxPlugin = {
  cacheWillUpdate: ({ response }) =>
    Promise.resolve(
      response.status === 200 &&
        !/\b(?:private|no-store)\b/i.test(
          response.headers.get("Cache-Control") ?? "",
        )
        ? response
        : null,
    ),
};

const dataCacheOptions: NonNullable<RuntimeCaching["options"]> = {
  cacheName: "blog-data-v1",
  fetchOptions: { cache: "no-store" },
  matchOptions: { ignoreSearch: true },
  plugins: [publicResponse, retainedPrecache],
  expiration: { maxEntries: 150, maxAgeSeconds: 30 * 24 * 60 * 60 },
};

export const runtimeCaching: RuntimeCaching[] = [
  {
    urlPattern: ({ url, request, sameOrigin }) =>
      sameOrigin &&
      !request.headers.has("Authorization") &&
      !url.search &&
      !/^\/(?:api|_nuxt|_ipx|__nuxt_content)\//.test(url.pathname) &&
      (request.mode === "navigate" ||
        request.headers.get("Accept")?.includes("text/html") === true),
    handler: "NetworkFirst",
    options: {
      cacheName: "blog-pages-v1",
      networkTimeoutSeconds: 3,
      fetchOptions: { cache: "no-store" },
      plugins: [publicResponse, retainedPrecache],
      expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
      precacheFallback: { fallbackURL: "/offline.html" },
    },
  },
  {
    // A cached guard probe must not wait for the same network failure twice.
    urlPattern: ({ url, request, sameOrigin }) =>
      sameOrigin &&
      !request.headers.has("Authorization") &&
      request.headers.get("X-Blog-Cache-Probe") === "1" &&
      [...url.searchParams.keys()].every((key) => key === "_b") &&
      url.pathname.endsWith("/_payload.json"),
    handler: "CacheFirst",
    options: dataCacheOptions,
  },
  {
    urlPattern: ({ url, request, sameOrigin }) =>
      sameOrigin &&
      !request.headers.has("Authorization") &&
      [...url.searchParams.keys()].every((key) => key === "_b") &&
      (url.pathname.endsWith("/_payload.json") ||
        url.pathname === "/flexsearch.json" ||
        /^\/_nuxt\/builds\/.*\.json$/.test(url.pathname) ||
        /^\/__nuxt_content\/.*\.json$/.test(url.pathname)),
    handler: "NetworkFirst",
    options: {
      ...dataCacheOptions,
      networkTimeoutSeconds: 3,
    },
  },
  {
    urlPattern: ({ url, request, sameOrigin }) =>
      sameOrigin &&
      !request.headers.has("Authorization") &&
      !url.search &&
      /^\/(?:_nuxt|_fonts)\/.*\.(?:js|css|woff2?)$/.test(url.pathname),
    handler: "CacheFirst",
    options: {
      cacheName: "blog-assets-v1",
      plugins: [publicResponse, retainedPrecache],
      expiration: { maxEntries: 200, maxAgeSeconds: 90 * 24 * 60 * 60 },
    },
  },
  {
    urlPattern: ({ url, request, sameOrigin }) =>
      sameOrigin &&
      !request.headers.has("Authorization") &&
      [...url.searchParams.keys()].every((key) => key === "v") &&
      /^\/(?:_ipx|images|content-images)\//.test(url.pathname) &&
      /\.(?:avif|png|jpe?g|webp|gif|svg)$/.test(url.pathname),
    handler: "CacheFirst",
    options: {
      cacheName: "blog-images-v1",
      plugins: [publicResponse, retainedPrecache],
      expiration: { maxEntries: 250, maxAgeSeconds: 30 * 24 * 60 * 60 },
    },
  },
];
