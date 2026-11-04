const extent = 6;
const resolution = 100;
const levels = 32;

const heightAt = (x: number, z: number) => {
  const peak = (cx: number, cz: number, spread: number, height: number) =>
    height * Math.exp(-((x - cx) ** 2 + (z - cz) ** 2) / spread);
  const edge = Math.max(
    0,
    1 - (Math.max(Math.abs(x), Math.abs(z)) / extent) ** 6,
  );
  return (
    (peak(-2.2, -0.5, 3.8, 2.8) +
      peak(1.7, 0.9, 2.7, 3.5) +
      peak(0.6, -2.6, 2, 1.8) +
      0.12 * (1 + Math.sin(x * 2.1 + z) * Math.cos(z * 1.7))) *
    edge
  );
};

/** Builds an invented height field and its triangle-interpolated contour lines. */
export const buildTopography = () => {
  const surface: number[] = [];
  const contours: number[] = [];
  type Point = readonly [number, number, number];
  const point = (column: number, row: number): Point => {
    const x = (column / resolution) * extent * 2 - extent;
    const z = (row / resolution) * extent * 2 - extent;
    return [x, heightAt(x, z), z];
  };
  const triangle = (a: Point, b: Point, c: Point) => {
    surface.push(...a, ...b, ...c);
    for (let level = 1; level <= levels; level++) {
      const height = level * 0.12;
      const intersections: number[] = [];
      for (const [start, end] of [
        [a, b],
        [b, c],
        [c, a],
      ] as const) {
        if (start[1] < height === end[1] < height) {
          continue;
        }
        const ratio = (height - start[1]) / (end[1] - start[1]);
        intersections.push(
          start[0] + (end[0] - start[0]) * ratio,
          height + 0.008,
          start[2] + (end[2] - start[2]) * ratio,
        );
      }
      if (intersections.length === 6) {
        contours.push(...intersections);
      }
    }
  };
  for (let row = 0; row < resolution; row++) {
    for (let column = 0; column < resolution; column++) {
      const a = point(column, row);
      const b = point(column + 1, row);
      const c = point(column, row + 1);
      const d = point(column + 1, row + 1);
      triangle(a, c, b);
      triangle(b, c, d);
    }
  }
  return {
    surface: new Float32Array(surface),
    contours: new Float32Array(contours),
  };
};
