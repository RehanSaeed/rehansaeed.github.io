/** Shares the cheat-sheet spacing comparison without changing article markup. */
export const useCarouselSpacing = () =>
  useState<"standard" | "none">("carousel-spacing", () => "standard");
