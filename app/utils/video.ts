/** Formats a media timestamp without exposing non-finite or negative values. */
export const formatVideoTime = (seconds: number): string => {
  const total = Math.floor(Number.isFinite(seconds) ? Math.max(0, seconds) : 0);
  const minutes = Math.floor(total / 60);
  const time = `${minutes % 60}:${String(total % 60).padStart(2, "0")}`;
  return minutes >= 60
    ? `${Math.floor(minutes / 60)}:${time.padStart(5, "0")}`
    : time;
};
