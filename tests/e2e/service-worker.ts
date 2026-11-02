import type { Page } from "@playwright/test";

declare global {
  interface Window {
    /** Test binding that records a failed registration or redundant installing worker. */
    __reportServiceWorkerFailure: (message: string) => Promise<void>;
  }
}

/** Observe registration before navigation without replacing the browser's readiness promise. */
export async function observeServiceWorkerRegistration(page: Page) {
  let reportFailure!: (message: string) => void;
  const failure = new Promise<string>((resolve) => {
    reportFailure = resolve;
  });
  await page.exposeFunction("__reportServiceWorkerFailure", reportFailure);
  await page.addInitScript(() => {
    const container = navigator.serviceWorker;
    const register = container.register.bind(container);
    container.register = (...args) => {
      const registration = register(...args);
      void registration.then(
        (registration) => {
          const observed = new WeakSet<ServiceWorker>();
          const observe = () => {
            const worker = registration.installing;
            if (!worker || observed.has(worker)) {
              return;
            }
            observed.add(worker);
            const check = () => {
              if (worker.state === "redundant") {
                void window.__reportServiceWorkerFailure(
                  `Service worker installation failed: script=${worker.scriptURL}, scope=${registration.scope}, state=${worker.state}`,
                );
              }
            };
            worker.addEventListener("statechange", check);
            check();
          };
          registration.addEventListener("updatefound", observe);
          observe();
        },
        (error: unknown) =>
          window.__reportServiceWorkerFailure(
            `Service worker registration failed: script=${String(args[0])}, error=${String(error)}`,
          ),
      );
      return registration;
    };
  });

  return () =>
    Promise.race([
      page.evaluate(
        async () => (await navigator.serviceWorker.ready).active?.scriptURL,
      ),
      failure.then((message) => {
        throw new Error(message);
      }),
    ]);
}
