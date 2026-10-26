import { ref } from "vue";
import {
  trafficDays,
  trafficDailyStart,
  trafficMonths,
} from "../../shared/utils/traffic.ts";

export const article = {
  permalink: "/traffic-design-sample/",
  published: "2022-02-03",
  modified: "2025-06-12",
};
const months = trafficMonths(article.published, "2026-10-22").map(
  (month, index) => {
    const views = Math.round(
      320 +
        index * 24 +
        Math.sin(index * 0.6) * 160 +
        (index === 30 ? 1200 : 0),
    );
    return { month, views, engagementSeconds: views * (35 + (index % 8) * 5) };
  },
);
const days = trafficDays(
  trafficDailyStart(article.published, "2026-10-22"),
  "2026-10-22",
).map((date) => {
  const month = months.find((item) => item.month === date.slice(0, 7));
  const length = date.startsWith("2026-10") ? 22 : 30;
  const views =
    Math.floor(month.views / length) +
    (Number(date.slice(8)) <= month.views % length ? 1 : 0);
  return {
    date,
    views,
    engagementSeconds: (views * month.engagementSeconds) / month.views,
  };
});
const snapshot = {
  updated: "2026-10-26T06:00:00Z",
  timeZone: "Europe/London",
  posts: {
    [article.permalink]: {
      startDate: article.published,
      endDate: "2026-10-22",
      months,
      days,
    },
  },
};

export function useFetch(_url, options) {
  return { data: ref(options.transform(snapshot)), error: ref(null) };
}
