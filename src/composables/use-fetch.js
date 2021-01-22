import { ref, watchEffect } from "@vue/composition-api";

/*
 * Makes a HTTP GET request.
 * @example
 * import useFetch from "./use-fetch";
 * const { data, error, isLoading } = useFetch("https://example.com");
 */
export default function useFetch(options) {
  const data = ref(null);
  const error = ref(null);
  const isLoading = ref(true);

  watchEffect(async () => {
    data.value = null;
    error.value = null;
    isLoading = true;
    try {
      const response = await fetch(options());
      data.value = response.json();
    } catch (error) {
      error.value = error;
    }
    isLoading.value = false;
  });

  return {
    data,
    error,
    isLoading,
  };
}
