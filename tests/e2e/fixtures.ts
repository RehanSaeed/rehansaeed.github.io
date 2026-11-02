import {
  test as base,
  expect,
  type Page,
  type Route,
  type PlaywrightTestArgs,
  type PlaywrightTestOptions,
  type PlaywrightWorkerArgs,
  type PlaywrightWorkerOptions,
} from "@playwright/test";

export type E2EFixtures = PlaywrightTestArgs &
  PlaywrightTestOptions &
  PlaywrightWorkerArgs &
  PlaywrightWorkerOptions;

export async function delayClientScripts(page: Page) {
  let resume!: () => void;
  const blocked = new Promise<void>((resolve) => {
    resume = resolve;
  });
  const requests: Promise<void>[] = [];
  const pattern = "**/_nuxt/*.js";
  const handler = (route: Route) => {
    const request = (async () => {
      // Buffer before delaying delivery, without retaining API response handles.
      const response = await route.fetch();
      const body = await response.body();
      const status = response.status();
      const headers = response.headers();
      await response.dispose();
      await blocked;
      await route.fulfill({ status, headers, body });
    })();
    requests.push(request);
    return request;
  };
  await page.route(pattern, handler);
  return {
    resume,
    async dispose() {
      resume();
      await page.unroute(pattern, handler);
      await Promise.all(requests);
    },
  };
}

export type AnalyticsEvent = {
  /** Analytics event category shared by Universal Analytics and GA4. */
  category: string;
  /** Historical hyphenated action name. */
  action: string;
  /** Optional context recorded with the event. */
  label?: string;
};

// Stands in for Universal Analytics (analytics.js) so the ga() queue is captured locally.
const universalAnalyticsStub = `(function () {
  var queue = (window.ga && window.ga.q) || [];
  window.__gaCalls = [];
  window.ga = function () { window.__gaCalls.push(Array.from(arguments)); };
  queue.forEach(function (args) { window.ga.apply(null, args); });
})();`;

/**
 * Normalises Universal Analytics `ga('send', 'event', ...)` calls and GA4 `gtag('event', ...)`
 * dataLayer entries into the same shape so the specs pass against both the Gridsome and Nuxt sites.
 */
export const getAnalyticsEvents = (page: Page): Promise<AnalyticsEvent[]> =>
  page.evaluate(() => {
    const events: AnalyticsEvent[] = [];
    const w = window as unknown as {
      __gaCalls?: unknown[][];
      dataLayer?: ArrayLike<unknown>[];
    };

    for (const call of w.__gaCalls ?? []) {
      if (call[0] !== "send" || call[1] !== "event") {
        continue;
      }
      if (typeof call[2] === "object" && call[2] !== null) {
        const fields = call[2] as Record<string, string | undefined>;
        events.push({
          category: fields.eventCategory!,
          action: fields.eventAction!,
          label: fields.eventLabel,
        });
      } else {
        events.push({
          category: call[2] as string,
          action: call[3] as string,
          label: call[4] as string | undefined,
        });
      }
    }

    for (const entry of w.dataLayer ?? []) {
      const args = Array.from(entry);
      if (args[0] !== "event") {
        continue;
      }
      const params = (args[2] ?? {}) as Record<string, string | undefined>;
      events.push({
        category: params.event_category!,
        // GA4 event names require underscores; the historical event contract uses hyphens.
        action: (args[1] as string).replaceAll("_", "-"),
        label: params.event_label,
      });
    }

    return events.map((e) =>
      e.label === undefined ? { category: e.category, action: e.action } : e,
    );
  });

export const test = base.extend<{ analytics: void }>({
  analytics: [
    async ({ page }, use) => {
      await page.route(
        (url) => url.protocol === "https:" && url.hostname !== "rehansaeed.com",
        (route) =>
          route.request().resourceType() === "image" ||
          route.request().resourceType() === "document"
            ? route.fulfill({ contentType: "text/plain", body: "" })
            : route.continue(),
      );
      await page.route("**/www.google-analytics.com/analytics.js", (route) =>
        route.fulfill({
          contentType: "text/javascript",
          body: universalAnalyticsStub,
        }),
      );
      await page.route("**/www.googletagmanager.com/**", (route) =>
        route.fulfill({ contentType: "text/javascript", body: "" }),
      );
      await page.route(
        /(google-analytics\.com|analytics\.google\.com)\/(g\/)?collect/,
        (route) => route.fulfill({ status: 204 }),
      );
      await use();
    },
    { auto: true },
  ],
});

export { expect };
