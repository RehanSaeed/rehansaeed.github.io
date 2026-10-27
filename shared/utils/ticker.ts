export interface CounterGrowth {
  observedAt: number | null;
  since: number | null;
  perSecond: number | null;
}

export const maximumProjectionAge = 14 * 24 * 60 * 60 * 1000;

export function lifetimeCounterGrowth(
  items: { count: number; createdAt?: string }[],
  observedAt: number,
): CounterGrowth {
  const unavailable: CounterGrowth = {
    observedAt: observedAt > 0 ? observedAt : null,
    since: null,
    perSecond: null,
  };
  if (observedAt <= 0) return unavailable;
  let perSecond = 0;
  let since = observedAt;
  for (const item of items) {
    const created = Date.parse(item.createdAt ?? "");
    const seconds = (observedAt - created) / 1000;
    if (!Number.isFinite(seconds) || seconds <= 0) return unavailable;
    // Sum each item's own lifetime average, not the total divided by the oldest age.
    perSecond += item.count / seconds;
    since = Math.min(since, created);
  }
  return { observedAt, since: items.length ? since : null, perSecond };
}

export function canProjectCounter(growth: CounterGrowth, now: number): boolean {
  return (
    growth.perSecond !== null &&
    growth.perSecond !== 0 &&
    growth.observedAt !== null &&
    now >= growth.observedAt &&
    now - growth.observedAt <= maximumProjectionAge
  );
}

export function counterStep(
  perSecond: number,
  seconds: number,
  random: number,
): number {
  // A bounded, mean-one weight varies the cadence without inflating the trend.
  return perSecond * seconds * (0.5 + random);
}

export function advanceCounter(
  state: { value: number; remainder: number },
  perSecond: number,
  seconds: number,
  random: number,
) {
  const movement = state.remainder + counterStep(perSecond, seconds, random);
  const change = Math.trunc(movement);
  return {
    value: Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, state.value + change)),
    remainder: movement - change,
  };
}
