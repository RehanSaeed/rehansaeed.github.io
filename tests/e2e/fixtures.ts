import { test as base, expect, type Page } from "@playwright/test";

export type AnalyticsEvent = {
  category: string;
  action: string;
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
    const events: { category: string; action: string; label?: string }[] = [];
    const w = window as unknown as {
      __gaCalls?: unknown[][];
      dataLayer?: ArrayLike<unknown>[];
    };

    for (const call of w.__gaCalls ?? []) {
      if (call[0] !== "send" || call[1] !== "event") continue;
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
      const args = Array.from(entry ?? []);
      if (args[0] !== "event") continue;
      const params = (args[2] ?? {}) as Record<string, string | undefined>;
      events.push({
        category: params.event_category!,
        action: args[1] as string,
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
