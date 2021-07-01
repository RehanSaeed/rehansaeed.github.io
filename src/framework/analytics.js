export function pwaInstallPromoShown() {
  if (typeof ga === "function") {
    ga("send", "event", {
      eventCategory: "pwa-install",
      eventAction: "promo-shown",
      nonInteraction: true,
    });
  }
}

export function pwaInstallPromoClicked(installSource, accepted) {
  if (typeof ga === "function") {
    ga("send", "event", {
      eventCategory: "pwa-install",
      eventAction: "promo-clicked",
      eventLabel: installSource,
      eventValue: accepted ? 1 : 0,
    });
  }
}

export function pwaInstallAppInstalled(installSource) {
  if (typeof ga === "function") {
    ga("send", "event", "pwa-install", "installed", installSource || "browser");
  }
}

export function appLaunchDomContentLoaded(displayMode) {
  if (typeof ga === "function") {
    ga("send", "event", "app-launch", "dom-content-loaded", displayMode);
  }
}

export function appLaunchDisplayModeChanged(displayMode) {
  if (typeof ga === "function") {
    ga("send", "event", "app-launch", "display-mode-changed", displayMode);
  }
}

export function appThemeLoaded(theme) {
  if (typeof ga === "function") {
    ga("send", "event", "app-theme", "theme-loaded", theme);
  }
}

export function appThemeChanged(theme) {
  if (typeof ga === "function") {
    ga("send", "event", "app-theme", "theme-changed", theme);
  }
}

export function searchOpened() {
  if (typeof ga === "function") {
    ga("send", "event", "search", "search-opened");
  }
}

export function searchClosed() {
  if (typeof ga === "function") {
    ga("send", "event", "search", "search-closed");
  }
}

export function searchResultSelected(query) {
  if (typeof ga === "function") {
    ga("send", "event", "search", "search-result-selected", query);
  }
}
