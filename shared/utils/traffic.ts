import { z } from "zod";

export const trafficDateSchema = z.iso.date();
const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);

export const trafficHistorySchema = z
  .object({
    startDate: trafficDateSchema,
    endDate: trafficDateSchema,
    months: z
      .array(
        z.object({
          month: monthSchema,
          views: z.number().int().nonnegative().safe(),
        }),
      )
      .min(1),
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
  });

export const trafficSnapshotSchema = z.object({
  updated: z.iso.datetime(),
  timeZone: z.string().min(1),
  posts: z.record(z.string().regex(/^\/[^?#]*\/$/), trafficHistorySchema),
});

export type TrafficHistory = z.infer<typeof trafficHistorySchema>;
export type TrafficSnapshot = z.infer<typeof trafficSnapshotSchema>;

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
