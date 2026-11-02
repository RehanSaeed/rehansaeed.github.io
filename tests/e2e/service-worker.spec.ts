import { once } from "node:events";
import { createServer } from "node:http";
import { expect, test as base } from "./fixtures";

type WorkerSite = {
  /** Isolated HTTP origin serving a real service worker. */
  origin: string;
  /** Resolves when installation reaches the controlled network request. */
  installRequested: Promise<void>;
  /** Allows the real install event to complete or reject. */
  releaseInstall: () => void;
};

const test = base.extend<{ workerSite: WorkerSite }>({
  workerSite: async ({}, use) => {
    let requestInstall!: () => void;
    const installRequested = new Promise<void>((resolve) => {
      requestInstall = resolve;
    });
    let releaseInstall!: () => void;
    const released = new Promise<void>((resolve) => {
      releaseInstall = resolve;
    });
    const server = createServer((request, response) => {
      const url = new URL(request.url!, "http://localhost");
      const mode = url.searchParams.get("mode");
      if (url.pathname === "/worker.js") {
        response.writeHead(200, {
          "Content-Type": "text/javascript",
          "Cache-Control": "no-cache",
        });
        response.end(
          mode === "invalid"
            ? "this is not valid JavaScript;"
            : `self.addEventListener("install", (event) => {
                event.waitUntil(fetch("/install-gate").then(() => {
                  ${mode === "reject" ? 'throw new Error("Intentional install rejection");' : ""}
                }));
              });
              self.addEventListener("activate", (event) => {
                event.waitUntil(self.clients.claim());
              });`,
        );
      } else if (url.pathname === "/install-gate") {
        requestInstall();
        void released.then(() => response.end("Install released"));
      } else {
        response.writeHead(200, { "Content-Type": "text/html" });
        response.end(`<!doctype html><title>Worker readiness</title>
          <script>navigator.serviceWorker.register("/worker.js?mode=${mode}");</script>`);
      }
    });
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Service worker test server has no TCP address");
    }
    try {
      await use({
        origin: `http://127.0.0.1:${address.port}`,
        installRequested,
        releaseInstall,
      });
    } finally {
      releaseInstall();
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
        server.closeAllConnections();
      });
    }
  },
});

test.use({ serviceWorkers: "allow" });

test("Readiness waits for a real worker to finish installing", async ({
  page,
  workerSite,
  serviceWorkerReady,
}) => {
  await page.goto(`${workerSite.origin}/?mode=activate`);
  await workerSite.installRequested;
  let activated = false;
  const ready = serviceWorkerReady().then((scriptURL) => {
    activated = true;
    return scriptURL;
  });
  expect(
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      return {
        installing: registration?.installing?.state,
        active: registration?.active?.scriptURL,
      };
    }),
  ).toEqual({ installing: "installing", active: undefined });
  expect(activated).toBe(false);

  workerSite.releaseInstall();
  expect(await ready).toBe(`${workerSite.origin}/worker.js?mode=activate`);
});

test("Readiness reports a real rejected install with its script, scope and state", async ({
  page,
  workerSite,
  serviceWorkerReady,
}) => {
  await page.goto(`${workerSite.origin}/?mode=reject`);
  await workerSite.installRequested;
  const failure = expect(serviceWorkerReady()).rejects.toThrow(
    `Service worker installation failed: script=${workerSite.origin}/worker.js?mode=reject, scope=${workerSite.origin}/, state=redundant`,
  );
  workerSite.releaseInstall();
  await failure;
});

test("Readiness retains an install failure that happens before it is awaited", async ({
  page,
  workerSite,
  serviceWorkerReady,
}) => {
  await page.goto(`${workerSite.origin}/?mode=reject`);
  await workerSite.installRequested;
  workerSite.releaseInstall();
  await page.waitForFunction(
    async () => !(await navigator.serviceWorker.getRegistration()),
  );

  await expect(serviceWorkerReady()).rejects.toThrow(
    `Service worker installation failed: script=${workerSite.origin}/worker.js?mode=reject, scope=${workerSite.origin}/, state=redundant`,
  );
});

test("Readiness reports a real registration error", async ({
  page,
  workerSite,
  serviceWorkerReady,
}) => {
  await page.goto(`${workerSite.origin}/?mode=invalid`);

  await expect(serviceWorkerReady()).rejects.toThrow(
    "Service worker registration failed: script=/worker.js?mode=invalid",
  );
});
