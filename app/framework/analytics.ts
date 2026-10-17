function event(
  category: string,
  action: string,
  label?: string,
  value?: number,
) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", action.replaceAll("-", "_"), {
      event_category: category,
      ...(label === undefined ? {} : { event_label: label }),
      ...(value === undefined ? {} : { value }),
    });
  }
}

export const pwaInstallPromoShown = () => event("pwa-install", "promo-shown");
export const pwaInstallPromoClicked = (source: string, accepted: boolean) =>
  event("pwa-install", "promo-clicked", source, accepted ? 1 : 0);
export const pwaInstallAppInstalled = (source?: string) =>
  event("pwa-install", "installed", source || "browser");
export const appLaunchDomContentLoaded = (mode: string) =>
  event("app-launch", "dom-content-loaded", mode);
export const appLaunchDisplayModeChanged = (mode: string) =>
  event("app-launch", "display-mode-changed", mode);
export const appThemeLoaded = (theme: string) =>
  event("app-theme", "theme-loaded", theme);
export const appThemeChanged = (theme: string) =>
  event("app-theme", "theme-changed", theme);
export const searchOpened = () => event("search", "search-opened");
export const searchClosed = () => event("search", "search-closed");
export const searchResultSelected = (query: string) =>
  event("search", "search-result-selected", query);
