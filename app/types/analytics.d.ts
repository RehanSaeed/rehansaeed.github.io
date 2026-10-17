export {};

declare global {
  interface Window {
    dataLayer: unknown[][];
    gtag: (
      command: string,
      name: string | Date,
      params?: Record<string, string | number>,
    ) => void;
  }
}
