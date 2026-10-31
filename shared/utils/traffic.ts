import { z } from "zod";

export const trafficDateSchema = z.iso.date();
const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
const totalsSchema = z.object({
  views: z.number().int().nonnegative().safe(),
  engagementSeconds: z
    .number()
    .nonnegative()
    .max(Number.MAX_SAFE_INTEGER)
    .optional(),
});
const daySchema = totalsSchema.extend({ date: trafficDateSchema });

export const trafficHistorySchema = z
  .object({
    startDate: trafficDateSchema,
    endDate: trafficDateSchema,
    months: z.array(totalsSchema.extend({ month: monthSchema })).min(1),
    days: z.array(daySchema).min(1).max(30).optional(),
  })
  .superRefine((history, context) => {
    const expected = trafficMonths(history.startDate, history.endDate);
    if (
      history.startDate > history.endDate ||
      expected.length !== history.months.length ||
      expected.some((month, index) => month !== history.months[index]?.month)
    ) {
      context.addIssue({
        code: "custom",
        message: "Traffic history must contain every month in its date range.",
      });
    }
    const buckets = [...history.months, ...(history.days ?? [])];
    if (
      buckets.some((item) => item.engagementSeconds !== undefined) &&
      buckets.some((item) => item.engagementSeconds === undefined)
    ) {
      context.addIssue({
        code: "custom",
        message: "Engagement totals must cover every reporting bucket.",
      });
    }
    if (
      !Number.isSafeInteger(
        history.months.reduce((sum, month) => sum + month.views, 0),
      ) ||
      history.months.reduce(
        (sum, month) => sum + (month.engagementSeconds ?? 0),
        0,
      ) > Number.MAX_SAFE_INTEGER
    ) {
      context.addIssue({
        code: "custom",
        message: "Traffic totals exceed the safe numeric range.",
      });
    }
    if (history.days) {
      const dates = trafficDays(
        trafficDailyStart(history.startDate, history.endDate),
        history.endDate,
      );
      if (
        dates.length !== history.days.length ||
        dates.some((date, index) => date !== history.days![index]?.date)
      ) {
        context.addIssue({
          code: "custom",
          message:
            "Daily traffic must cover the last 30 calendar days or the shorter tracking interval.",
        });
      }
      for (const month of history.months) {
        const days = history.days.filter((day) =>
          day.date.startsWith(month.month),
        );
        const views = days.reduce((sum, day) => sum + day.views, 0);
        const seconds = days.reduce(
          (sum, day) => sum + (day.engagementSeconds ?? 0),
          0,
        );
        const wholeBucket =
          days[0]?.date ===
            (month.month === history.startDate.slice(0, 7)
              ? history.startDate
              : `${month.month}-01`) &&
          days.at(-1)?.date ===
            (month.month === history.endDate.slice(0, 7)
              ? history.endDate
              : new Date(
                  Date.UTC(
                    Number(month.month.slice(0, 4)),
                    Number(month.month.slice(5, 7)),
                    0,
                  ),
                )
                  .toISOString()
                  .slice(0, 10));
        if (
          views > month.views ||
          seconds > (month.engagementSeconds ?? 0) + 0.001 ||
          (wholeBucket &&
            (views !== month.views ||
              Math.abs(seconds - (month.engagementSeconds ?? 0)) > 0.001))
        ) {
          context.addIssue({
            code: "custom",
            message: "Daily and monthly traffic totals are inconsistent.",
          });
          break;
        }
      }
    }
  });

export const trafficSnapshotSchema = z.object({
  updated: z.iso.datetime(),
  timeZone: z.string().min(1),
  posts: z.record(z.string().regex(/^\/[^?#]*\/$/), trafficHistorySchema),
});

export type TrafficHistory = z.infer<typeof trafficHistorySchema>;
export type TrafficSnapshot = z.infer<typeof trafficSnapshotSchema>;
export type TrafficSeries = {
  startDate: string;
  endDate: string;
  interval: "day" | "month";
  points: z.infer<typeof daySchema>[];
};

export function formatTrafficDuration(value: number): string {
  const seconds = Math.round(value);
  return seconds < 60
    ? `${seconds}s`
    : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export function selectTrafficRange(
  history: TrafficHistory,
  range: 0 | 12 | 30,
): TrafficSeries {
  if (range === 30) {
    if (!history.days) {
      throw new Error("Daily traffic is unavailable in this snapshot.");
    }
    return {
      startDate: history.days[0]!.date,
      endDate: history.endDate,
      interval: "day",
      points: history.days,
    };
  }
  const months = range ? history.months.slice(-range) : history.months;
  return {
    startDate:
      months[0]!.month === history.startDate.slice(0, 7)
        ? history.startDate
        : `${months[0]!.month}-01`,
    endDate: history.endDate,
    interval: "month",
    points: months.map(({ month, ...totals }) => ({
      date: `${month}-01`,
      ...totals,
    })),
  };
}

export function parseTrafficSnapshot(value: unknown): TrafficSnapshot | null {
  return trafficSnapshotSchema.nullable().parse(value);
}

export function trafficMonths(startDate: string, endDate: string): string[] {
  const months: string[] = [];
  const index = (value: string) =>
    Number(value.slice(0, 4)) * 12 + Number(value.slice(5, 7)) - 1;
  for (let current = index(startDate); current <= index(endDate); current++) {
    months.push(
      `${String(Math.floor(current / 12)).padStart(4, "0")}-${String((current % 12) + 1).padStart(2, "0")}`,
    );
  }

  return months;
}

export function trafficDailyStart(startDate: string, endDate: string): string {
  const cutoff = new Date(Date.parse(endDate) - 29 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  return startDate > cutoff ? startDate : cutoff;
}

export function trafficDays(startDate: string, endDate: string): string[] {
  const days: string[] = [];
  for (
    let time = Date.parse(startDate);
    time <= Date.parse(endDate);
    time += 86_400_000
  ) {
    days.push(new Date(time).toISOString().slice(0, 10));
  }
  return days;
}
