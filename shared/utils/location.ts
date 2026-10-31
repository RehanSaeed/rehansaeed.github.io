export const distanceInMiles = (
  from: [number, number],
  to: [number, number],
): number => {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(to[1] - from[1]);
  const longitudeDelta = radians(to[0] - from[0]);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(from[1])) *
      Math.cos(radians(to[1])) *
      Math.sin(longitudeDelta / 2) ** 2;
  const earthRadiusMiles = 3958.7613;
  return (
    2 *
    earthRadiusMiles *
    Math.asin(Math.sqrt(Math.min(1, Math.max(0, haversine))))
  );
};
