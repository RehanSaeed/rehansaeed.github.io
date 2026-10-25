import type { LocationQueryValue } from "vue-router";

// CSS query parameters historically use JavaScript's comma-separated array coercion.
export function queryString(
  value: LocationQueryValue | LocationQueryValue[] | undefined,
) {
  return value == null ? undefined : String(value);
}
