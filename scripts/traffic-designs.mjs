import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vue from "@vitejs/plugin-vue";
import { build } from "vite";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const directory = join(root, "scripts", "traffic-designs");
const component = join(root, "app", "components", "post-traffic.vue");
const chart = join(root, "app", "components", "post-traffic-chart.vue");
const tooltip = join(root, "app", "components", "shared", "tooltip.vue");
const result = await build({
  configFile: false,
  root,
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  resolve: {
    alias: {
      "~": join(root, "app"),
      "#shared": join(root, "shared"),
      "traffic-preview-data": join(directory, "data.js"),
    },
  },
  plugins: [
    {
      name: "traffic-preview-auto-imports",
      enforce: "pre",
      transform(code, id) {
        if (
          ![component, chart, tooltip].some(
            (file) => id.replaceAll("/", "\\") === file.replaceAll("/", "\\"),
          )
        ) {
          return;
        }
        return code.replace(
          '<script setup lang="ts">',
          `<script setup lang="ts">
import { computed, ref, shallowRef, watch, watchEffect, useSlots, useId, useTemplateRef, onMounted, onBeforeUnmount } from "vue";
import { useFetch } from "traffic-preview-data";`,
        );
      },
    },
    vue(),
  ],
  build: {
    write: false,
    cssCodeSplit: false,
    assetsInlineLimit: Infinity,
    lib: {
      entry: join(directory, "preview.js"),
      formats: ["es"],
      fileName: "traffic-preview",
    },
  },
});
const files = (Array.isArray(result) ? result : [result]).flatMap(
  (entry) => entry.output,
);
const preview = {
  js: files
    .filter((file) => file.type === "chunk")
    .map((file) => file.code)
    .join("\n"),
  css: files
    .filter((file) => file.type === "asset" && file.fileName.endsWith(".css"))
    .map((file) => String(file.source))
    .join("\n"),
};
if (!preview.js || !preview.css) {
  throw new Error("Traffic preview did not produce its JavaScript and styles.");
}
const html = (await readFile(join(directory, "index.html"), "utf8")).replace(
  "__TRAFFIC_PREVIEW__",
  () => JSON.stringify(preview).replaceAll("<", "\\u003c"),
);
await mkdir(join(root, ".data"), { recursive: true });
await writeFile(join(root, ".data", "traffic-designs.html"), html);
const port = Number(process.env.PORT ?? 8084);
createServer((request, response) => {
  if (request.url?.split("?")[0] !== "/") {
    response.writeHead(404).end("Not found");
    return;
  }
  response.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(html);
}).listen(port, "127.0.0.1", () => {
  console.log(`Traffic designs: http://127.0.0.1:${port}`);
  console.log(
    "Synthetic data only. Experimental styles do not change the site.",
  );
});
