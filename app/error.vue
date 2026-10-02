<template>
  <NuxtLayout>
    <div class="not-found">
      <u-heading id="not-found" level="1" center>404 Not Found</u-heading>

      <u-arrows class="not-found__arrows" />

      <u-card class="not-found__content">
        <p>Didn't find what you were looking for?</p>
        <u-link-button bordered to="/">Go Home</u-link-button>
      </u-card>
    </div>
  </NuxtLayout>
</template>

<script setup>
import UArrows from "~/components/shared/arrows.vue";
import UCard from "~/components/shared/card.vue";
import ULinkButton from "~/components/shared/link-button.vue";
import UHeading from "~/components/shared/heading.vue";

defineProps({
  error: {
    type: Object,
    required: true,
  },
});

useHead({
  title: "Not Found",
});
</script>

<style lang="scss">
.not-found {
  display: grid;
  gap: var(--global-space-fluid-5);
}

.not-found__arrows {
  margin-inline: calc(var(--global-space-main) * -1);
}

.not-found__content {
  justify-self: center;

  display: grid;
  justify-items: center;
  text-align: center;
}
</style>
