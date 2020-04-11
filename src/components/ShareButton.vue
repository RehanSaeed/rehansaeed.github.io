<template>
  <div>

    <EffectButton @click.native="onClick" button>
      <ShareIcon/>
      Share
    </EffectButton>

    <Dialogue title="Share" :is-open="isDialogueOpen" @close="close" class="share-dialogue">
      <div class="share-dialogue__links">
        <EffectLink button :to="facebookUrl" @click.native="close" class="share-dialogue__link">
          <FacebookIcon/>
          Facebook
        </EffectLink>
        <EffectLink button :to="twitterUrl" @click.native="close" class="share-dialogue__link">
          <TwitterIcon/>
          Twitter
        </EffectLink>
        <EffectLink button :to="redditUrl" @click.native="close" class="share-dialogue__link">
          <RedditIcon/>
          Reddit
        </EffectLink>
        <EffectLink button :to="linkedinUrl" @click.native="close" class="share-dialogue__link">
          <LinkedInIcon/>
          LinkedIn
        </EffectLink>
        <EffectLink button :to="mailUrl" @click.native="close" class="share-dialogue__link">
          <EmailIcon/>
          Email
        </EffectLink>
      </div>
    </Dialogue>

  </div>
</template>

<script>
import Dialogue from '~/components/Dialogue.vue';
import EffectButton from '~/components/EffectButton.vue';
import EffectLink from '~/components/EffectLink.vue';
import EmailIcon from '~/components/icons/EmailIcon.vue';
import FacebookIcon from '~/components/icons/FacebookIcon.vue';
import LinkedInIcon from '~/components/icons/LinkedInIcon.vue';
import RedditIcon from '~/components/icons/RedditIcon.vue';
import ShareIcon from '~/components/icons/ShareIcon.vue';
import TwitterIcon from '~/components/icons/TwitterIcon.vue';

export default {
  components: {
    Dialogue,
    EffectButton,
    EffectLink,
    EmailIcon,
    FacebookIcon,
    LinkedInIcon,
    RedditIcon,
    ShareIcon,
    TwitterIcon,
  },
  data() {
    return {
      isDialogueOpen: false,
      isSupported: process.isClient && navigator.share
    }
  },
  props: {
    title: {
      type: String
    },
    url: {
      type: String
    },
    tags: {
      type: Array
    }
  },
  computed: {
    internalTitle: function() {
      return this.title || document.title;
    },
    internalUrl: function() {
      let url = this.url;
      if (!url && process.isClient) {
        const canonicalElement = document.querySelector('link[rel=canonical]');
        if (canonicalElement !== null) {
          url = canonicalElement.href;
        } else {
          url = document.location.href;
        }
      }
      return url;
    },
    encodedTitle: function() { return encodeURIComponent(this.internalTitle); },
    encodedUrl: function() { return encodeURIComponent(this.internalUrl); },
    encodedTags: function() {
      if (this.tags) {
        return encodeURIComponent(this.tags.map(x => x.replace(/[\W_]+/g, '')).join(','));
      }
      return '';
    },
    facebookUrl: function() {
      // https://developers.facebook.com/docs/sharing/reference/share-dialog
      return `https://www.facebook.com/sharer/sharer.php?u=${this.encodedUrl}&quote=${this.encodedTitle}`;
    },
    twitterUrl: function() {
      // https://developer.twitter.com/en/docs/twitter-for-websites/tweet-button/overview
      return `https://twitter.com/intent/tweet?text=${this.encodedTitle}&url=${this.encodedUrl}&hashtags=${this.encodedTags}&via=${this.$static.metadata.author.twitter.replace('@', '')}`;
    },
    redditUrl: function() {
      return `http://www.reddit.com/submit?url=${this.encodedUrl}&title=${this.encodedTitle}`;
    },
    linkedinUrl: function() {
      // https://docs.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin
      return `http://www.linkedin.com/shareArticle?mini=true&url=${this.encodedUrl}&title=${this.encodedTitle}`;
    },
    mailUrl: function() {
      return `mailto:?subject=${this.encodedTitle}&body=${this.encodedUrl}`;
    }
  },
  methods: {
    open() {
      this.isDialogueOpen = true;
    },
    close() {
      this.isDialogueOpen = false;
    },
    share() {
      navigator.share({
        title: this.internalTitle,
        url: this.internalUrl
      });
    },
    onClick: function() {
      if (this.isSupported) {
        this.share();
      } else {
        this.open();
      }
    }
  }
}
</script>

<static-query>
query {
  metadata {
    author {
      twitter
    }
  }
}
</static-query>

<style lang="scss">
.share-dialogue__links {
  --gap: .6rem;

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
