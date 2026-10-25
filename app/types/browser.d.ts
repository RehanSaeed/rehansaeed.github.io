export {};

type Theme = "light" | "dark";

export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

declare global {
  interface Window {
    __theme: Theme;
    __setPreferredTheme(theme: Theme): void;
  }

  interface WindowEventMap {
    __themeChanged: CustomEvent<Theme>;
    beforeinstallprompt: BeforeInstallPromptEvent;
  }

  interface Navigator {
    standalone?: boolean;
  }
}
