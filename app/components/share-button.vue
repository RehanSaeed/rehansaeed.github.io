<template>
  <div>
    <u-button variant="secondary" @click="onClick">
      <u-icon name="fa-solid:share-alt" inline />
      Share
    </u-button>

    <u-dialogue
      title="Share"
      :is-open="isDialogueOpen"
      @close="onClose"
      class="share-dialogue">
      <div class="share-dialogue__links">
        <u-link-button bordered :href="facebookUrl" @click="onClose">
          <u-icon name="fa-brands:facebook" inline />
          Facebook
        </u-link-button>
        <u-link-button bordered :href="twitterUrl" @click="onClose">
          <u-icon name="fa-brands:twitter" inline />
          Twitter
        </u-link-button>
        <u-link-button bordered :href="redditUrl" @click="onClose">
          <u-icon name="fa-brands:reddit" inline />
          Reddit
        </u-link-button>
        <u-link-button bordered :href="linkedinUrl" @click="onClose">
          <u-icon name="fa-brands:linkedin" inline />
          LinkedIn
        </u-link-button>
        <u-link-button bordered :href="mailUrl" @click="onClose">
          <u-icon name="fa-regular:envelope" inline />
          Email
        </u-link-button>
      </div>
    </u-dialogue>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, type PropType } from "vue";

defineOptions({ name: "u-share-button" });
const metadata = useAppConfig().site;
const route = useRoute();
const isDialogueOpen = ref(false);
const isSupported = useSupported(() => import.meta.client && !!navigator.share);
const props = defineProps({
  /** Title displayed for this content. */ title: {
    type: String,
  },
  /** Canonical URL associated with this component. */ url: {
    type: String,
  },
  /** Tags associated with the content. */ tags: {
    type: Array as PropType<string[]>,
  },
});
const internalTitle = computed(
  () => props.title || (import.meta.client ? document.title : ""),
);
// Match the page's canonical URL rather than a URL containing query parameters.
const internalUrl = computed(() => props.url || `${metadata.url}${route.path}`);
const encodedTitle = computed(() => encodeURIComponent(internalTitle.value));
const encodedUrl = computed(() => encodeURIComponent(internalUrl.value));
const encodedTags = computed(() =>
  props.tags
    ? encodeURIComponent(
        props.tags.map((x) => x.replace(/[\W_]+/g, "")).join(","),
      )
    : "",
);
const facebookUrl = computed(
  () =>
    `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl.value}&quote=${encodedTitle.value}`,
);
const twitterUrl = computed(
  () =>
    `https://twitter.com/intent/tweet?text=${encodedTitle.value}&url=${encodedUrl.value}&hashtags=${encodedTags.value}`,
);
const redditUrl = computed(
  () =>
    `http://www.reddit.com/submit?url=${encodedUrl.value}&title=${encodedTitle.value}`,
);
const linkedinUrl = computed(
  () =>
    `http://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl.value}&title=${encodedTitle.value}`,
);
const mailUrl = computed(
  () => `mailto:?subject=${encodedTitle.value}&body=${encodedUrl.value}`,
);

const open = () => {
  isDialogueOpen.value = true;
};
const share = async () => {
  try {
    await navigator.share({
      title: internalTitle.value,
      url: internalUrl.value,
    });
  } catch (error) {
    if (!(error instanceof DOMException && error.name === "AbortError")) {
      console.error("Unable to share the page", error);
      open();
    }
  }
};
const onClose = () => {
  isDialogueOpen.value = false;
};
const onClick = () => {
  if (isSupported.value) {
    void share();
  } else {
    open();
  }
};
</script>

<style lang="scss">
.share-dialogue__links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--global-space-fixed-3);
}
</style>
