<template>
  <article class="border" :style="style"></article>
</template>

<script setup lang="ts">
definePageMeta({ layout: "empty" });
useHead({ meta: [{ name: "robots", content: "noindex, follow" }] });
const route = useRoute();
const queryValue = (name: string, fallback: string) =>
  String(route.query[name] ?? fallback);
const style = computed(() => ({
  "--border-radius": `${queryValue("border-radius", "0")}px`,
  "--border-width": `${queryValue("border-width", "20")}px`,
  "--duration": `${queryValue("duration", "5")}s`,
  "--hue1": queryValue("hue1", "0"),
  "--hue2": queryValue("hue2", "0"),
  "--saturation1": `${queryValue("saturation1", "0")}%`,
  "--saturation2": `${queryValue("saturation2", "0")}%`,
  "--lightness1": `${queryValue("lightness1", "100")}%`,
  "--lightness2": `${queryValue("lightness2", "70")}%`,
  "--width": `${queryValue("width", "1920")}px`,
  "--height": `${queryValue("height", "1080")}px`,
}));
onMounted(() => {
  document.body.style.backgroundColor = "transparent";
});
</script>

<style lang="scss">
.border {
  color: hsl(0 0% 96%);
  --gradient: radial-gradient(
    circle,
    hsl(var(--hue1) var(--saturation1) var(--lightness1)) 0%,
    hsl(var(--hue2) var(--saturation2) var(--lightness2)) 100%
  );

  mask:
    linear-gradient(#fff, #fff) top,
    linear-gradient(#fff, #fff) bottom,
    linear-gradient(#fff, #fff) left,
    linear-gradient(#fff, #fff) right;
  mask-size:
    100% var(--border-width),
    100% var(--border-width),
    var(--border-width) 100%,
    var(--border-width) 100%;
  mask-repeat: no-repeat;
  inline-size: var(--width);
  block-size: var(--height);
}

.border::after {
  content: "";

  position: absolute;
  inset-inline-start: calc(-1 * var(--border-width));
  inset-block-start: calc(-1 * var(--border-width));

  inline-size: calc(100% + var(--border-width) * 2);
  block-size: calc(100% + var(--border-width) * 2);

  animation: animated-gradient var(--duration) ease-in-out infinite;
  background: var(--gradient);
  background-size: 200% 200%;
}

@keyframes animated-gradient {
  0% {
    background-position: 0% 0%;
  }
  25% {
    background-position: 100% 0%;
  }
  50% {
    background-position: 100% 100%;
  }
  75% {
    background-position: 0% 100%;
  }
  100% {
    background-position: 0% 0%;
  }
}
</style>
