import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, resolve, relative } from "node:path";
import { once } from "node:events";
import { expect, test as base } from "@playwright/test";
import type { Page } from "@playwright/test";

const types: Record<string, string> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
};

export const test = base.extend<{
  site: {
    origin: string;
    stop: () => Promise<void>;
    useLegacy: (source: string | undefined) => void;
  };
}>({
  site: async ({}, use) => {
    let legacy: string | undefined;
    const root = resolve("dist");
    const server = createServer((request, response) => {
      void (async () => {
        const url = new URL(request.url!, "http://localhost");
        let file = resolve(root, `.${decodeURIComponent(url.pathname)}`);
        if (relative(root, file).startsWith("..")) {
          response.writeHead(403).end();
          return;
        }
        let status = 200;
        let body: Buffer | string;
        if (
          url.pathname === "/private/_payload.json" ||
          url.pathname === "/authorised/_payload.json"
        ) {
          response.writeHead(200, {
            "Content-Type": "application/json",
            "Cache-Control": url.pathname.startsWith("/private/")
              ? "private, no-store"
              : "no-cache, must-revalidate",
          });
          response.end("{}");
          return;
        }
        if (url.pathname === "/service-worker.js" && legacy) {
          body = legacy;
        } else {
          try {
            if ((await stat(file)).isDirectory()) {
              file = join(file, "index.html");
            }
            body = await readFile(file);
          } catch (error) {
            if (
              !(error instanceof Error) ||
              !("code" in error) ||
              !["ENOENT", "ENOTDIR"].includes(String(error.code))
            ) {
              throw error;
            }
            status = 404;
            file = join(root, "404.html");
            body = await readFile(file);
          }
        }
        response.writeHead(status, {
          "Content-Type": types[extname(file)] ?? "application/octet-stream",
          "Cache-Control": "no-cache, must-revalidate",
          "Content-Length": Buffer.byteLength(body),
        });
        response.end(body);
      })().catch((error: unknown) => {
        console.error("Offline test server failed:", error);
        response.writeHead(500).end();
      });
    });
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Offline test server has no TCP address.");
    }
    const stop = async () => {
      const closed = once(server, "close");
      server.close();
      server.closeAllConnections();
      await closed;
    };
    try {
      await use({
        origin: `http://127.0.0.1:${address.port}`,
        stop,
        useLegacy: (source) => {
          legacy = source;
        },
      });
    } finally {
      if (server.listening) {
        await stop();
      }
    }
  },
});

test.use({ serviceWorkers: "allow" });

test.beforeEach(async ({ context, site }) => {
  // Routing disables the HTTP cache, including in Firefox. Stop the actual
  // origin for outages: Firefox's setOffline emulation bypasses service workers.
  await context.route(
    (url) => url.origin !== site.origin,
    (route) => route.fulfill({ contentType: "text/plain", body: "" }),
  );
});

export async function controlled(page: Page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => {
        navigator.serviceWorker.addEventListener(
          "controllerchange",
          () => {
            resolve();
          },
          { once: true },
        );
      });
    }
  });
}

export async function saved(page: Page, path: string) {
  await expect
    .poll(() =>
      page.evaluate(async (path) => {
        const pages = await caches.open("blog-pages-v1");
        const data = await caches.open("blog-data-v1");
        const required = performance
          .getEntriesByType("resource")
          .map((entry) => new URL(entry.name))
          .filter(
            (url) =>
              url.origin === location.origin &&
              /^\/(?:_nuxt|_fonts)\/.*\.(?:js|css|woff2?)$/.test(url.pathname),
          );
        const missingAssets = [];
        for (const url of required) {
          if (!(await caches.match(url, { ignoreSearch: true }))) {
            missingAssets.push(url.pathname);
          }
        }
        return {
          missingAssets,
          page: Boolean(await pages.match(new URL(path, location.origin))),
          payload: Boolean(
            await data.match(new URL(`${path}_payload.json`, location.origin), {
              ignoreSearch: true,
            }),
          ),
        };
      }, path),
    )
    .toEqual({ page: true, payload: true, missingAssets: [] });
}
