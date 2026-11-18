import type { Page } from "@playwright/test";

type HistoryObservation = {
  kind: string;
  time: number;
  path: string;
  scrollY: number;
  savedTop: number | null;
};

declare global {
  interface Window {
    /** Bounded native history/scroll observations for restoration diagnostics. */
    historyRestorationProbe?: {
      /** Ordered observations, including the router's saved outgoing position. */
      events: HistoryObservation[];
      /** Observations omitted after reaching the diagnostic limit. */
      dropped: number;
    };
  }
}

export const instrumentHistory = (page: Page) =>
  page.addInitScript(() => {
    const probe = { events: [] as HistoryObservation[], dropped: 0 };
    window.historyRestorationProbe = probe;
    const record = (kind: string, value: unknown = history.state) => {
      if (probe.events.length >= 512) {
        probe.dropped++;
        return;
      }
      const scroll =
        value && typeof value === "object" && "scroll" in value
          ? value.scroll
          : undefined;
      const top =
        scroll && typeof scroll === "object" && "top" in scroll
          ? scroll.top
          : undefined;
      probe.events.push({
        kind,
        time: performance.now(),
        path: location.pathname,
        scrollY,
        savedTop: typeof top === "number" ? top : null,
      });
    };
    const replace = history.replaceState.bind(history);
    history.replaceState = (data: unknown, unused, url) => {
      record("replace:before", data);
      replace(data, unused, url);
      record("replace:after");
    };
    const push = history.pushState.bind(history);
    history.pushState = (data: unknown, unused, url) => {
      record("push:before", data);
      push(data, unused, url);
      record("push:after");
    };
    window.addEventListener("popstate", () => {
      record("popstate");
    });
    window.addEventListener(
      "scroll",
      () => {
        record("scroll");
      },
      {
        passive: true,
      },
    );
  });
