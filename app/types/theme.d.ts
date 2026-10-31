export {};

declare global {
  interface Window {
    /** Current theme applied by the pre-paint theme script. */
    __theme: "light" | "dark";
    /** Applies and saves the user's preferred colour theme. */
    __setPreferredTheme: (theme: "light" | "dark") => void;
  }
}
