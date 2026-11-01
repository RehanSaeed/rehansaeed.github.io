export {};

declare global {
  interface Window {
    /** Queued analytics commands, initialised by the analytics plugin. */
    dataLayer?: unknown[][];
    /** Sends a command to the analytics queue. */
    gtag: (
      command: string,
      name: string | Date,
      params?: Record<string, string | number>,
    ) => void;
  }
}
