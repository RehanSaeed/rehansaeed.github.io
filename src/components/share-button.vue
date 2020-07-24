<template>
  <div>
    <u-button bordered @click.native="onClick">
      <u-icon-share />
      Share
    </u-button>

    <u-dialogue
      title="Share"
      :is-open="isDialogueOpen"
      @close="onClose"
      class="share-dialogue"
    >
      <div class="share-dialogue__links">
        <u-link
          bordered
          :href="facebookUrl"
          @click.native="onClose"
          class="share-dialogue__link"
        >
          <u-icon-facebook />
          Facebook
        </u-link>
        <u-link
          bordered
          :href="twitterUrl"
          @click.native="onClose"
          class="share-dialogue__link"
        >
          <u-icon-twitter />
          Twitter
        </u-link>
        <u-link
          bordered
          :href="redditUrl"
          @click.native="onClose"
          class="share-dialogue__link"
        >
          <u-icon-reddit />
          Reddit
        </u-link>
        <u-link
          bordered
          :href="linkedinUrl"
          @click.native="onClose"
          class="share-dialogue__link"
        >
          <u-icon-linkedin />
          LinkedIn
        </u-link>
        <u-link
          bordered
          :href="mailUrl"
          @click.native="onClose"
          class="share-dialogue__link"
        >
          <u-icon-email />
          Email
        </u-link>
      </div>
    </u-dialogue>
  </div>
</template>

<script>
import button from "~/components/shared/button.vue";
import dialogue from "~/components/shared/dialogue.vue";
import link from "~/components/shared/link.vue";
import iconEmail from "~/components/shared/icons/icon-email.vue";
import iconFacebook from "~/components/shared/icons/icon-facebook.vue";
import iconLinkedIn from "~/components/shared/icons/icon-linkedin.vue";
import iconReddit from "~/components/shared/icons/icon-reddit.vue";
import iconShare from "~/components/shared/icons/icon-share.vue";
import iconTwitter from "~/components/shared/icons/icon-twitter.vue";

export default {
  name: "u-share-button",
  components: {
    "u-button": button,
    "u-dialogue": dialogue,
    "u-link": link,
    "u-icon-email": iconEmail,
    "u-icon-facebook": iconFacebook,
    "u-icon-linkedin": iconLinkedIn,
    "u-icon-reddit": iconReddit,
    "u-icon-share": iconShare,
    "u-icon-twitter": iconTwitter,
  },
  data() {
    return {
      isDialogueOpen: false,
      isSupported: process.isClient && navigator.share,
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
      return this.title || document.title;
    },
    internalUrl() {
      let url = this.url;
      if (!url && process.isClient) {
        const canonicalElement = document.querySelector("link[rel=canonical]");
        if (canonicalElement !== null) {
          url = canonicalElement.href;
        } else {
          url = document.location.href;
        }
      }
      return url;
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
          this.tags.map((x) => x.replace(/[\W_]+/g, "")).join(",")
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
      }&hashtags=${
        this.encodedTags
      }&via=${this.$static.metadata.author.twitter.user.replace("@", "")}`;
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

<static-query>
query {
  metadata {
    author {
      twitter {
        user
      }
    }
  }
}
</static-query>

<style lang="scss">
.share-dialogue__links {
  --gap: var(--global-space-fixed-3);

  display: flex;
  flex-wrap: wrap;
  margin-right: calc(-1 * var(--gap));
  margin-bottom: calc(-1 * var(--gap));
}

.share-dialogue__link {
  margin-right: var(--gap);
  margin-bottom: var(--gap);
}
</style>
