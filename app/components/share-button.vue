<template>
  <div>
    <u-button bordered @click="onClick">
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

<script>
export default {
  name: "u-share-button",
  setup() {
    return {
      metadata: useAppConfig().site,
    };
  },
  data() {
    return {
      isDialogueOpen: false,
      isSupported: false,
    };
  },
  props: {
    title: {
      type: String,
    },
    url: {
      type: String,
    },
    tags: {
      type: Array,
    },
  },
  computed: {
    internalTitle() {
      return this.title || (import.meta.client ? document.title : "");
    },
    internalUrl() {
      // The canonical URL, which is what the page's link[rel=canonical] contains.
      return this.url || `${this.metadata.url}${this.$route.path}`;
    },
    encodedTitle() {
      return encodeURIComponent(this.internalTitle);
    },
    encodedUrl() {
      return encodeURIComponent(this.internalUrl);
    },
    encodedTags() {
      if (this.tags) {
        return encodeURIComponent(
          this.tags.map((x) => x.replace(/[\W_]+/g, "")).join(","),
        );
      }
      return "";
    },
    facebookUrl() {
      // https://developers.facebook.com/docs/sharing/reference/share-dialog
      return `https://www.facebook.com/sharer/sharer.php?u=${this.encodedUrl}&quote=${this.encodedTitle}`;
    },
    twitterUrl() {
      // https://developer.twitter.com/en/docs/twitter-for-websites/tweet-button/overview
      return `https://twitter.com/intent/tweet?text=${this.encodedTitle}&url=${
        this.encodedUrl
      }&hashtags=${this.encodedTags}`;
    },
    redditUrl() {
      return `http://www.reddit.com/submit?url=${this.encodedUrl}&title=${this.encodedTitle}`;
    },
    linkedinUrl() {
      // https://docs.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin
      return `http://www.linkedin.com/shareArticle?mini=true&url=${this.encodedUrl}&title=${this.encodedTitle}`;
    },
    mailUrl() {
      return `mailto:?subject=${this.encodedTitle}&body=${this.encodedUrl}`;
    },
  },
  mounted() {
    this.isSupported = !!navigator.share;
  },
  methods: {
    open() {
      this.isDialogueOpen = true;
    },
    share() {
      navigator.share({
        title: this.internalTitle,
        url: this.internalUrl,
      });
    },
    onClose() {
      this.isDialogueOpen = false;
    },
    onClick() {
      if (this.isSupported) {
        this.share();
      } else {
        this.open();
      }
    },
  },
};
</script>

<style lang="scss">
.share-dialogue__links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--global-space-fixed-3);
}
</style>
