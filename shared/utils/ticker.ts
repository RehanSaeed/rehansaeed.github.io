export interface CounterGrowth {
  observedAt: number | null;
  since: number | null;
  perSecond: number | null;
}

export const maximumProjectionAge = 14 * 24 * 60 * 60 * 1000;

export function measureCounterGrowth(
  count: number,
  observedAt: number,
  previous?: { count: number; observedAt: number },
  allowDecrease = false,
): CounterGrowth {
  const elapsed = observedAt - (previous?.observedAt ?? observedAt);
  const change = count - (previous?.count ?? count);
  const measured =
    observedAt > 0 &&
    previous &&
    previous.observedAt > 0 &&
    elapsed >= 60 * 60 * 1000 &&
    (allowDecrease || change >= 0);
  return {
    observedAt: observedAt > 0 ? observedAt : null,
    since: measured ? previous.observedAt : null,
    perSecond: measured ? change / (elapsed / 1000) : null,
  };
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

export function projectCounter(
  value: number,
  growth: CounterGrowth,
  now: number,
): number {
  if (!canProjectCounter(growth, now)) return value;
  return Math.max(
    0,
    Math.min(
      Number.MAX_SAFE_INTEGER,
      Math.round(
        value + growth.perSecond! * ((now - growth.observedAt!) / 1000),
      ),
    ),
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
