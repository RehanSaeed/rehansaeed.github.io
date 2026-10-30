import { createApp, h, Suspense } from "vue";
import icons from "@iconify-json/fa-regular/icons.json";
import "@fontsource/audiowide/latin-400.css";
import "../../app/assets/style/index.scss";
import PostTraffic from "../../app/components/post-traffic.vue";
import UPostTrafficChart from "../../app/components/post-traffic-chart.vue";
import UCard from "../../app/components/shared/card.vue";
import UButton from "../../app/components/shared/button.vue";
import UIcon from "../../app/components/shared/icon.vue";
import UStatistic from "../../app/components/shared/statistic.vue";
import UTooltip from "../../app/components/shared/tooltip.vue";
import { article } from "./data.js";

const app = createApp({
  render: () => h(Suspense, null, { default: () => h(PostTraffic, article) }),
});
app.component("UCard", UCard);
app.component("UButton", UButton);
app.component("UIcon", UIcon);
app.component("UStatistic", UStatistic);
app.component("UTooltip", UTooltip);
app.component("UPostTrafficChart", UPostTrafficChart);
app.component("NuxtIcon", {
  render: () =>
    h("svg", {
      viewBox: `0 0 ${icons.width} ${icons.height}`,
      fill: "currentColor",
      innerHTML: icons.icons["question-circle"].body,
    }),
});
app.mount("#app");

const style = document.createElement("style");
style.textContent = `
html, body { min-height: 0; height: auto; }
body { padding: 16px; margin: 0; background: var(--global-background-color); }
.post-traffic { --card-space: clamp(20px, 4vw, 40px); }
.post-traffic__preview-area { fill: var(--global-accent-color); opacity: var(--preview-opacity, .18); }
.post-traffic__preview-step { fill: none; stroke: var(--global-accent-color); stroke-width: 2; vector-effect: non-scaling-stroke; display: none; }
[data-fill="none"] .post-traffic__preview-area { display: none; }
[data-fill="gradient"] .post-traffic__preview-area { fill: url(#preview-fill); opacity: 1; }
[data-points="false"] .post-traffic__point:not(:focus-visible):not(.post-traffic__point--selected)::after { opacity: 0; }
[data-grid="false"] .post-traffic__gridline { opacity: 0; }
[data-layout="center"] .post-traffic__metrics { justify-content: center; text-align: center; }
[data-layout="split"] .post-traffic__metrics { padding: 12px; border: 1px solid var(--global-border-color); border-radius: var(--global-border-radius); }
[data-layout="inline"] .post-traffic__total,
[data-layout="inline"] .post-traffic__engagement { display: flex; flex-direction: row; flex-wrap: wrap; align-items: baseline; gap: 8px; }
[data-layout="inline"] .post-traffic__total dd,
[data-layout="inline"] .post-traffic__engagement dd { font-size: 2rem; }
[data-layout="footer-stats"] .post-traffic { display: flex; flex-direction: column; }
[data-layout="footer-stats"] .post-traffic__metrics { order: 5; margin-block-start: 16px; }
[data-layout="footer-stats"] .post-traffic__controls { order: 2; }
[data-layout="footer-stats"] .post-traffic__coverage { order: 3; }
[data-layout="footer-stats"] .post-traffic__chart { order: 4; }
[data-layout="footer-stats"] .post-traffic__events { order: 6; }
[data-layout="compact"] .post-traffic__plot { block-size: 8rem; }
[data-layout="compact"] .post-traffic__total dd,
[data-layout="compact"] .post-traffic__engagement dd { font-size: 2rem; }
[data-layout="tall"] .post-traffic__plot { block-size: 17rem; }
[data-layout="tiles"] .post-traffic__metrics { padding: 16px; border: 1px solid var(--global-border-color); border-radius: var(--global-border-radius); }
[data-layout="clean"] .post-traffic__gridline { opacity: 0; }
[data-layout="clean"] .post-traffic__line { stroke-width: 3; }
[data-layout="step"] .post-traffic__line { visibility: hidden; }
[data-layout="step"] .post-traffic__preview-step { display: block; }
[data-annotation="inside"] .post-traffic__events { display: none; }
.post-traffic__preview-event {
  position: absolute; z-index: 1; top: 12px; margin: 0; padding: 6px;
  background: var(--global-content-background-color); border: 1px dotted var(--global-accent-color);
  border-radius: var(--global-border-radius); pointer-events: none; font-size: .8em;
}
`;
document.head.append(style);

function decorate() {
  const line = document.querySelector(".post-traffic__line");
  if (!line) {
    return;
  }
  const svg = line.ownerSVGElement;
  if (!svg.querySelector("defs")) {
    const definitions = document.createElementNS(svg.namespaceURI, "defs");
    definitions.innerHTML = `<linearGradient id="preview-fill" x1="0" y1="0" x2="0" y2="1">
      <stop stop-color="var(--global-accent-color)" stop-opacity="var(--preview-opacity, .18)" />
      <stop offset="1" stop-color="var(--global-accent-color)" stop-opacity="0" />
    </linearGradient>`;
    svg.prepend(definitions);
  }
  const original = line.getAttribute("points");
  const segments = original
    ? [original.split(" ").map((point) => point.split(",").map(Number))]
    : line
        .getAttribute("d")
        .split("M ")
        .filter(Boolean)
        .map((segment) =>
          segment
            .trim()
            .split(" L ")
            .map((point) => point.trim().split(/\s+/).map(Number)),
        );
  const path = (points) =>
    points.map(([x, y], index) => `${index ? "L" : "M"} ${x} ${y}`).join(" ");
  const stepped = (points) =>
    points.flatMap(([x, y], index) =>
      index
        ? [
            [x, points[index - 1][1]],
            [x, y],
          ]
        : [[x, y]],
    );
  for (const [className, value] of [
    [
      "post-traffic__preview-step",
      segments.map((points) => path(stepped(points))).join(" "),
    ],
    [
      "post-traffic__preview-area",
      segments
        .map(
          (points) =>
            `M ${points[0][0]} 196 ${path(document.body.dataset.layout === "step" ? stepped(points) : points).replace(/^M/, "L")} L ${points.at(-1)[0]} 196 Z`,
        )
        .join(" "),
    ],
  ]) {
    let polygon = svg.querySelector(`.${className}`);
    if (!polygon) {
      polygon = document.createElementNS(svg.namespaceURI, "path");
      polygon.classList.add(className);
      svg.insertBefore(polygon, line);
    }
    if (polygon.getAttribute("d") !== value) {
      polygon.setAttribute("d", value);
    }
  }
  const source = document.querySelector(".post-traffic__events");
  for (const plot of document.querySelectorAll(".post-traffic__plot")) {
    const path = plot.querySelector(".post-traffic__annotation");
    let label = plot.querySelector(".post-traffic__preview-event");
    if (document.body.dataset.annotation !== "inside" || !source || !path) {
      label?.remove();
      continue;
    }
    if (!label) {
      label = document.createElement("div");
      label.className = "post-traffic__preview-event";
      label.setAttribute("aria-hidden", "true");
      plot.append(label);
    }
    const text = source.textContent.trim();
    if (label.textContent !== text) {
      label.textContent = text;
    }
    const position = Number(path.getAttribute("d").split(" ")[1]) / 6;
    label.style.left = `${position}%`;
    label.style.maxWidth = `calc(${position > 50 ? position : 100 - position}% - 8px)`;
    label.style.translate = position > 50 ? "calc(-100% - 8px) 0" : "8px 0";
  }
}
function reportHeight() {
  const card = document.querySelector(".post-traffic");
  if (card) {
    parent.postMessage(
      {
        type: "traffic-preview-height",
        height: Math.ceil(card.getBoundingClientRect().height) + 32,
      },
      "*",
    );
  }
}
const observer = new MutationObserver(() => {
  decorate();
  reportHeight();
});
observer.observe(document.querySelector("#app"), {
  subtree: true,
  childList: true,
  characterData: true,
  attributes: true,
  attributeFilter: ["points", "d", "aria-pressed"],
});
new ResizeObserver(reportHeight).observe(document.body);
window.addEventListener("message", (event) => {
  if (
    event.source !== parent ||
    event.data?.type !== "traffic-preview-config"
  ) {
    return;
  }
  const { theme, layout, fill, opacity, points, grid, annotation } = event.data;
  if (
    !["light", "dark"].includes(theme) ||
    ![
      "classic",
      "area",
      "fade",
      "center",
      "split",
      "inline",
      "footer-stats",
      "compact",
      "tall",
      "tiles",
      "clean",
      "step",
    ].includes(layout) ||
    !["none", "solid", "gradient"].includes(fill) ||
    !Number.isFinite(opacity) ||
    !["below", "inside"].includes(annotation)
  ) {
    return;
  }
  document.documentElement.dataset.theme = theme;
  Object.assign(document.body.dataset, {
    layout,
    fill,
    points: String(points),
    grid: String(grid),
    annotation,
  });
  document.body.style.setProperty(
    "--preview-opacity",
    String(Math.max(0, Math.min(0.4, opacity))),
  );
  decorate();
  reportHeight();
});
parent.postMessage({ type: "traffic-preview-ready" }, "*");
