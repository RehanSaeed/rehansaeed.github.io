<template>
  <Layout>
    <article class="border" :style="style"></article>
  </Layout>
</template>

<script>
import Layout from "~/layouts/empty.vue";

export default {
  components: {
    Layout,
  },
  computed: {
    borderRadius() {
      return (this.$route.query["border-radius"] ?? "0") + "px";
    },
    borderWidth() {
      return (this.$route.query["border-width"] ?? "20") + "px";
    },
    duration() {
      return (this.$route.query["duration"] ?? "5") + "s";
    },
    hue1() {
      return this.$route.query["hue1"] ?? "0";
    },
    hue2() {
      return this.$route.query["hue2"] ?? "0";
    },
    saturation1() {
      return (this.$route.query["saturation1"] ?? "0") + "%";
    },
    saturation2() {
      return (this.$route.query["saturation2"] ?? "0") + "%";
    },
    lightness1() {
      return (this.$route.query["lightness1"] ?? "100") + "%";
    },
    lightness2() {
      return (this.$route.query["lightness2"] ?? "70") + "%";
    },
    width() {
      return (this.$route.query["width"] ?? "1920") + "px";
    },
    height() {
      return (this.$route.query["height"] ?? "1080") + "px";
    },
    style() {
      return {
        "--border-radius": this.borderRadius,
        "--border-width": this.borderWidth,
        "--duration": this.duration,
        "--hue1": this.hue1,
        "--hue2": this.hue2,
        "--saturation1": this.saturation1,
        "--saturation2": this.saturation2,
        "--lightness1": this.lightness1,
        "--lightness2": this.lightness2,
        "--width": this.width,
        "--height": this.height,
      };
    },
  },
  mounted() {
    document.body.style.backgroundColor = "transparent";
  },
};
</script>

<style lang="scss">
.border {
  color: hsl(0, 0%, 96%);
  --gradient: radial-gradient(
    circle,
    hsl(var(--hue1), var(--saturation1), var(--lightness1)) 0%,
    hsl(var(--hue2), var(--saturation2), var(--lightness2)) 100%
  );

  mask: linear-gradient(#fff, #fff) top, linear-gradient(#fff, #fff) bottom,
    linear-gradient(#fff, #fff) left, linear-gradient(#fff, #fff) right;
  mask-size: 100% var(--border-width), 100% var(--border-width),
    var(--border-width) 100%, var(--border-width) 100%;
  mask-repeat: no-repeat;
  inline-size: var(--width);
  block-size: var(--height);
}

.border::after {
  content: "";
  position: absolute;
  top: calc(-1 * var(--border-width));
  left: calc(-1 * var(--border-width));
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
