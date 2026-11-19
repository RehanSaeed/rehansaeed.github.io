import { installPrompt } from "virtual:nuxt-pwa-configuration";

export default defineNuxtPlugin({
  name: "pwa-install-storage-guard",
  order: -21,
  setup() {
    if (!installPrompt) {
      return;
    }

    const getItemDescriptor = Object.getOwnPropertyDescriptor(
      Storage.prototype,
      "getItem",
    );
    const setItemDescriptor = Object.getOwnPropertyDescriptor(
      Storage.prototype,
      "setItem",
    );
    if (
      typeof getItemDescriptor?.value !== "function" ||
      typeof setItemDescriptor?.value !== "function"
    ) {
      throw new Error("Storage methods are unavailable");
    }

    const getItem: (this: Storage, key: string) => string | null =
      getItemDescriptor.value as (this: Storage, key: string) => string | null;
    const setItem: (this: Storage, key: string, value: string) => void =
      setItemDescriptor.value as (
        this: Storage,
        key: string,
        value: string,
      ) => void;

    // The PWA module reads this key without handling browsers that block storage.
    Storage.prototype.getItem = function (key) {
      try {
        return Reflect.apply(getItem, this, [key]);
      } catch (error) {
        if (
          key === installPrompt &&
          error instanceof DOMException &&
          error.name === "SecurityError"
        ) {
          return null;
        }

        throw error;
      }
    };

    Storage.prototype.setItem = function (key, value) {
      try {
        Reflect.apply(setItem, this, [key, value]);
      } catch (error) {
        if (
          key === installPrompt &&
          error instanceof DOMException &&
          error.name === "SecurityError"
        ) {
          return;
        }

        throw error;
      }
    };
  },
});
