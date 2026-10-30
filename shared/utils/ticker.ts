export interface CounterGrowth {
  observedAt: number | null;
  perSecond: number | null;
}

export const maximumProjectionAge = 14 * 24 * 60 * 60 * 1000;

export function lifetimeCounterGrowth(
  items: { count: number; createdAt?: string }[],
  observedAt: number,
): CounterGrowth {
  const unavailable: CounterGrowth = {
    observedAt: observedAt > 0 ? observedAt : null,
    perSecond: null,
  };
  if (observedAt <= 0) {
    return unavailable;
  }
  let perSecond = 0;
  for (const item of items) {
    const created = Date.parse(item.createdAt ?? "");
    const seconds = (observedAt - created) / 1000;
    if (!Number.isFinite(seconds) || seconds <= 0) {
      return unavailable;
    }
    // Sum each item's own lifetime average, not the total divided by the oldest age.
    perSecond += item.count / seconds;
  }
  return { observedAt, perSecond };
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

export function advanceCounter(
  state: { value: number; remainder: number },
  perSecond: number,
  seconds: number,
  random: number,
) {
  // Half the ticks pause; jumps on the other half preserve a mean-one weight.
  const weight = random < 0.5 ? 0 : 4 * random - 1;
  const movement = state.remainder + perSecond * seconds * weight;
  const change = Math.trunc(movement);
  return {
    value: Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, state.value + change)),
    remainder: movement - change,
  };
}
