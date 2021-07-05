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
      return (this.$route.query["lightness2"] ?? "80") + "%";
    },
    style() {
      return {
        "--border-width": this.borderWidth,
        "--duration": this.duration,
        "--hue1": this.hue1,
        "--hue2": this.hue2,
        "--saturation1": this.saturation1,
        "--saturation2": this.saturation2,
        "--lightness1": this.lightness1,
        "--lightness2": this.lightness2,
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
  width: 1920px;
  height: 1080px;
}

.border::after {
  content: "";
  position: absolute;
  top: calc(-1 * var(--border-width));
  left: calc(-1 * var(--border-width));
  width: calc(100% + var(--border-width) * 2);
  height: calc(100% + var(--border-width) * 2);
  background: var(--gradient);
  animation: animated-gradient var(--duration) ease-in-out infinite;
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
