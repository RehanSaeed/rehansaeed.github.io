<template>
  <div>

    <EffectButton @click.native="onClick" button>
      <svg aria-hidden="true" focusable="false" height="14" width="14" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
        <title>Share</title>
        <path fill="currentColor" d="M352 320c-22.608 0-43.387 7.819-59.79 20.895l-102.486-64.054a96.551 96.551 0 0 0 0-41.683l102.486-64.054C308.613 184.181 329.392 192 352 192c53.019 0 96-42.981 96-96S405.019 0 352 0s-96 42.981-96 96c0 7.158.79 14.13 2.276 20.841L155.79 180.895C139.387 167.819 118.608 160 96 160c-53.019 0-96 42.981-96 96s42.981 96 96 96c22.608 0 43.387-7.819 59.79-20.895l102.486 64.054A96.301 96.301 0 0 0 256 416c0 53.019 42.981 96 96 96s96-42.981 96-96-42.981-96-96-96z"></path>
      </svg>
      Share
    </EffectButton>

    <Dialogue title="Share" :is-open="isDialogueOpen" @close="close" class="share-dialogue">
      <div class="share-dialogue__links">
        <EffectLink button :to="facebookUrl" @click.native="close" class="share-dialogue__link">
          <svg aria-hidden="true" focusable="false" height="14" width="16" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
            <title>Facebook</title>
            <path fill="currentColor" d="M504 256C504 119 393 8 256 8S8 119 8 256c0 123.78 90.69 226.38 209.25 245V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.28c-30.8 0-40.41 19.12-40.41 38.73V256h68.78l-11 71.69h-57.78V501C413.31 482.38 504 379.78 504 256z"></path>
          </svg>
          Facebook
        </EffectLink>
        <EffectLink button :to="twitterUrl" @click.native="close" class="share-dialogue__link">
          <svg aria-hidden="true" focusable="false" height="14" width="16" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
            <title>Twitter</title>
            <path fill="currentColor" d="M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.797-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z"></path>
          </svg>
          Twitter
        </EffectLink>
        <EffectLink button :to="redditUrl" @click.native="close" class="share-dialogue__link">
          <svg aria-hidden="true" focusable="false" height="14" width="16" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
            <title>Reddit</title>
            <path fill="currentColor" d="M201.5 305.5c-13.8 0-24.9-11.1-24.9-24.6 0-13.8 11.1-24.9 24.9-24.9 13.6 0 24.6 11.1 24.6 24.9 0 13.6-11.1 24.6-24.6 24.6zM504 256c0 137-111 248-248 248S8 393 8 256 119 8 256 8s248 111 248 248zm-132.3-41.2c-9.4 0-17.7 3.9-23.8 10-22.4-15.5-52.6-25.5-86.1-26.6l17.4-78.3 55.4 12.5c0 13.6 11.1 24.6 24.6 24.6 13.8 0 24.9-11.3 24.9-24.9s-11.1-24.9-24.9-24.9c-9.7 0-18 5.8-22.1 13.8l-61.2-13.6c-3-.8-6.1 1.4-6.9 4.4l-19.1 86.4c-33.2 1.4-63.1 11.3-85.5 26.8-6.1-6.4-14.7-10.2-24.1-10.2-34.9 0-46.3 46.9-14.4 62.8-1.1 5-1.7 10.2-1.7 15.5 0 52.6 59.2 95.2 132 95.2 73.1 0 132.3-42.6 132.3-95.2 0-5.3-.6-10.8-1.9-15.8 31.3-16 19.8-62.5-14.9-62.5zM302.8 331c-18.2 18.2-76.1 17.9-93.6 0-2.2-2.2-6.1-2.2-8.3 0-2.5 2.5-2.5 6.4 0 8.6 22.8 22.8 87.3 22.8 110.2 0 2.5-2.2 2.5-6.1 0-8.6-2.2-2.2-6.1-2.2-8.3 0zm7.7-75c-13.6 0-24.6 11.1-24.6 24.9 0 13.6 11.1 24.6 24.6 24.6 13.8 0 24.9-11.1 24.9-24.6 0-13.8-11-24.9-24.9-24.9z"></path>
          </svg>
          Reddit
        </EffectLink>
        <EffectLink button :to="linkedinUrl" @click.native="close" class="share-dialogue__link">
          <svg aria-hidden="true" focusable="false" height="14" width="16" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
            <title>LinkedIn</title>
            <path fill="currentColor" d="M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3zM135.4 416H69V202.2h66.5V416zm-33.2-243c-21.3 0-38.5-17.3-38.5-38.5S80.9 96 102.2 96c21.2 0 38.5 17.3 38.5 38.5 0 21.3-17.2 38.5-38.5 38.5zm282.1 243h-66.4V312c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9V416z"></path>
          </svg>
          LinkedIn
        </EffectLink>
        <EffectLink button :to="mailUrl" @click.native="close" class="share-dialogue__link">
          <svg aria-hidden="true" focusable="false" height="14" width="16" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
            <title>Email</title>
            <path fill="currentColor" d="M464 64H48C21.49 64 0 85.49 0 112v288c0 26.51 21.49 48 48 48h416c26.51 0 48-21.49 48-48V112c0-26.51-21.49-48-48-48zm0 48v40.805c-22.422 18.259-58.168 46.651-134.587 106.49-16.841 13.247-50.201 45.072-73.413 44.701-23.208.375-56.579-31.459-73.413-44.701C106.18 199.465 70.425 171.067 48 152.805V112h416zM48 400V214.398c22.914 18.251 55.409 43.862 104.938 82.646 21.857 17.205 60.134 55.186 103.062 54.955 42.717.231 80.509-37.199 103.053-54.947 49.528-38.783 82.032-64.401 104.947-82.653V400H48z"></path>
          </svg>
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

export default {
  components: {
    Dialogue,
    EffectButton,
    EffectLink,
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
