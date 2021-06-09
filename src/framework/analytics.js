export function pwaInstallPromoShown() {
  if (ga) {
    ga("send", "event", {
      eventCategory: "pwa-install",
      eventAction: "promo-shown",
      nonInteraction: true,
    });
  }
}

export function pwaInstallPromoClicked(installSource, accepted) {
  if (ga) {
    ga("send", "event", {
      eventCategory: "pwa-install",
      eventAction: "promo-clicked",
      eventLabel: installSource,
      eventValue: accepted ? 1 : 0,
    });
  }
}

export function pwaInstallAppInstalled(installSource) {
  if (ga) {
    ga("send", "event", "pwa-install", "installed", installSource || "browser");
  }
}

export function appLaunchDomContentLoaded(displayMode) {
  if (ga) {
    ga("send", "event", "app-launch", "dom-content-loaded", displayMode);
  }
}

export function appLaunchDisplayModeChanged(displayMode) {
  if (ga) {
    ga("send", "event", "app-launch", "display-mode-changed", displayMode);
  }
}

export function appThemeLoaded(theme) {
  if (ga) {
    ga("send", "event", "app-theme", "theme-loaded", theme);
  }
}

export function appThemeChanged(theme) {
  if (ga) {
    ga("send", "event", "app-theme", "theme-changed", theme);
  }
}
