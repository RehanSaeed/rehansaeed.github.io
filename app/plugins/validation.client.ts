import { z } from "zod";

export default defineNuxtPlugin({
  name: "validation",
  enforce: "pre",
  setup() {
    // Avoid Zod's eval capability probe under the hosting CSP.
    z.config({ jitless: true });
  },
});
