<template>
  <Layout>
    <div class="about">
      <u-heading id="about" level="1" center :href="relativeUrl"
        >About</u-heading
      >

      <u-arrows class="about__arrows" />

      <u-card class="about__container" tag="article">
        <g-image
          class="about__image"
          alt="Muhammad Rehan Saeed"
          height="480"
          width="320"
          src="~/assets/images/author/Muhammad-Rehan-Saeed/Profile-320x480.jpg"
          quality="100" />
        <u-heading
          :id="$static.metadata.author.name"
          level="2"
          class="about__title"
          >{{ $static.metadata.author.name }}</u-heading
        >
        <u-social-links class="about__social-links" />
        <p class="about__description">
          I am a professional Software Developer at Microsoft. Although I work
          for Microsoft, my opinions are my own. If it’s written in C# or .NET,
          I have probably written something using it in anger!
        </p>
        <p class="about__description">
          I live stream my software development escapades on
          <a :href="youtubeUrl">Youtube</a> and
          <a :href="twitchUrl">Twitch</a> twice a week. Feel free to join me
          live and ask questions.
        </p>
        <div class="about__youtube-images">
          <a :href="youtubeUrl">
            <img
              class="about__youtube-image"
              alt="Youtube views"
              height="58"
              width="208"
              :src="youtubeViewsImageUrl" />
          </a>
          <a :href="youtubeUrl">
            <img
              class="about__youtube-image"
              alt="Youtube subscribers"
              height="58"
              width="208"
              :src="youtubeSubscribersImageUrl" />
          </a>
        </div>
        <p class="about__description">
          You can see some of the open source projects that I have founded and
          maintained in my
          <g-link to="/portfolio/">portfolio</g-link>. There are many others I
          have contributed to which you can see in my
          <a :href="gitHubUrl">GitHub profile</a> and of course there are other
          commercial projects that I cannot disclose.
        </p>
        <div class="about__github-images">
          <a :href="gitHubSponsorsUrl">
            <img
              class="about__github-image"
              alt="GitHub sponsors"
              height="30"
              width="121"
              :src="gitHubSponsorsImageUrl" />
          </a>
          <a :href="gitHubFollowersUrl">
            <img
              class="about__github-image"
              alt="GitHub follower count"
              height="30"
              width="168"
              :src="gitHubFollowersImageUrl" />
          </a>
          <a :href="gitHubUrl">
            <img
              class="about__github-image"
              alt="GitHub stars"
              height="30"
              width="135"
              :src="gitHubStarsImageUrl" />
          </a>
        </div>
        <p class="about__description">
          I have been fairly active on StackOverflow. You can view my
          <a :href="stackOverflowUrl">Stack Overflow profile</a> and see my
          contribution to the community.
        </p>
        <a :href="stackOverflowUrl">
          <img
            class="about__stack-overflow-image"
            alt="Stack Overflow profile statistics"
            height="58"
            width="208"
            :src="stackOverflowProfileUrl" />
        </a>
        <p class="about__description">
          Before I joined Microsoft, I was a
          <a :href="mvpUrl">Microsoft Most Valuable Professional (MVP)</a>. This
          gave me inside information into the work Microsoft was doing. Once I
          joined Microsoft, I had to give up this award but I am still a member
          of <a :href="mvpUrl">MVP Reconnect</a>.
        </p>
        <a :href="mvpUrl">
          <g-image
            class="about__mvp-image"
            alt="Microsoft Most Valuable Professional (MVP)"
            height="84"
            width="208"
            src="~/assets/images/Microsoft-Most-Valuable-Professional-750x303.png"
            quality="100" />
        </a>
        <p class="about__description">
          Do you have questions or comments about my work? Please feel free to
          contact me using any of the links above.
        </p>
      </u-card>
    </div>
  </Layout>
</template>

<script>
import arrows from "~/components/shared/arrows.vue";
import card from "~/components/shared/card.vue";
import heading from "~/components/shared/heading.vue";
import socialLinks from "~/components/social-links.vue";

export default {
  name: "u-about",
  components: {
    "u-arrows": arrows,
    "u-card": card,
    "u-heading": heading,
    "u-social-links": socialLinks,
  },
  data() {
    return {
      theme: "light",
    };
  },
  computed: {
    title() {
      return "About";
    },
    description() {
      return `About ${this.$static.metadata.author.name}. ${this.$static.metadata.description}.`;
    },
    image() {
      return (
        this.$static.metadata.url +
        "/images/hero/Muhammad-Rehan-Saeed-1600x900.jpg"
      );
    },
    relativeUrl() {
      return "/about/";
    },
    url() {
      return this.$static.metadata.url + this.relativeUrl;
    },
    stackOverflowUrl() {
      return this.$static.metadata.author.stackOverflow.url;
    },
    stackOverflowProfileUrl() {
      return `https://stackoverflow.com/users/flair/${this.$static.metadata.author.stackOverflow.user}.png?theme=${this.oppositeTheme}`;
    },
    gitHubUrl() {
      return this.$static.metadata.author.gitHub.url;
    },
    gitHubSponsorsUrl() {
      return `https://github.com/sponsors/${this.$static.metadata.author.gitHub.user}`;
    },
    gitHubSponsorsImageUrl() {
      return `https://img.shields.io/github/sponsors/${this.$static.metadata.author.gitHub.user}?logo=github&style=social`;
    },
    gitHubFollowersUrl() {
      return `https://github.com/${this.$static.metadata.author.gitHub.user}?tab=followers`;
    },
    gitHubFollowersImageUrl() {
      return `https://img.shields.io/github/followers/${this.$static.metadata.author.gitHub.user}?style=social`;
    },
    gitHubStarsImageUrl() {
      return `https://img.shields.io/github/stars/${this.$static.metadata.author.gitHub.user}?style=social`;
    },
    mvpUrl() {
      return "https://mvp.microsoft.com/en-us/PublicProfile/5001654?fullName=Muhammad%20Rehan%20Saeed";
    },
    twitchUrl() {
      return this.$static.metadata.author.twitch.url;
    },
    youtubeUrl() {
      return this.$static.metadata.author.youtube.url;
    },
    youtubeViewsImageUrl() {
      return `https://img.shields.io/youtube/channel/views/${this.$static.metadata.author.youtube.user}?style=social`;
    },
    youtubeSubscribersImageUrl() {
      return `https://img.shields.io/youtube/channel/subscribers/${this.$static.metadata.author.youtube.user}?style=social`;
    },
    oppositeTheme() {
      return this.theme === "light" ? "dark" : "light";
    },
  },
  metaInfo() {
    return {
      title: this.title,
      link: [{ rel: "canonical", href: this.url }],
      meta: [
        { name: "description", content: this.description },
        { name: "author", content: this.$static.metadata.author.name },
        // Twitter card
        { name: "twitter:card", content: "summary_large_image" },
        {
          name: "twitter:site",
          content: this.$static.metadata.author.twitter.user,
        },
        {
          name: "twitter:creator",
          content: this.$static.metadata.author.twitter.user,
        },
        { name: "twitter:title", content: this.title },
        { name: "twitter:description", content: this.description },
        { name: "twitter:image", content: this.image },
        // Open Graph
        { property: "og:title", content: this.title },
        { property: "og:url", content: this.url },
        { property: "og:image", content: this.image },
        {
          property: "og:image:height",
          content: this.image.match(/(\d*)x(\d*)/)[2],
        },
        {
          property: "og:image:width",
          content: this.image.match(/(\d*)x(\d*)/)[1],
        },
        { property: "og:description", content: this.description },
        {
          property: "og:locale",
          content: this.$static.metadata.language.replace("-", "_"),
        },
        { property: "og:site_name", content: this.$static.metadata.name },
        { property: "og:type", content: "profile" },
        {
          property: "profile:first_name",
          content: this.$static.metadata.author.firstName,
        },
        {
          property: "profile:last_name",
          content: this.$static.metadata.author.lastName,
        },
        {
          property: "profile:username",
          content: this.$static.metadata.author.name,
        },
        {
          property: "profile:gender",
          content: this.$static.metadata.author.gender,
        },
        { property: "fb:app_id", content: this.$static.metadata.facebookAppId },
      ],
    };
  },
  methods: {
    setTheme(e) {
      this.theme = e.detail;
    },
  },
  mounted() {
    if (window) {
      this.theme = window.__theme;
      window.addEventListener("__themeChanged", this.setTheme);
    }
  },
  unmounted() {
    if (window) {
      window.removeEventListener("__themeChanged", this.setTheme);
    }
  },
};
</script>

<static-query>
query {
  metadata {
    name
    description
    url
    language
    facebookAppId
    author {
      name
      firstName
      lastName
      gender
      gitHub {
        user
        url
      }
      stackOverflow {
        user
        url
      }
      twitter {
        user
      }
      twitch {
        url
      }
      youtube {
        user
        url
      }
    }
  }
}
</static-query>

<style lang="scss">
.about {
  display: grid;
  gap: var(--global-space-fluid-5);
  justify-items: center;
}

.about__arrows {
  justify-self: normal;
  margin-left: calc(var(--global-space-main) * -1);
  margin-right: calc(var(--global-space-main) * -1);
}

.about__container {
  display: grid;
  justify-items: center;

  &:last-child {
    margin-bottom: 0;
  }
}

.about__image {
  border-radius: var(--global-border-radius);
  display: block;
  max-width: 320px;
}

.about__social-links {
  margin-bottom: var(--global-space-fluid-3);
}

.about__github-images,
.about__youtube-images {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--global-space-fixed-4);

  margin-bottom: var(--global-space-fixed-5);
}
.about__github-image,
.about__youtube-image {
  height: 30px;
}

.about__stack-overflow-image {
  border-radius: var(--global-border-radius);
  display: block;
  margin-bottom: var(--global-space-fixed-5);
  height: 58px;
  width: 208px;
}

.about__mvp-image {
  border-radius: var(--global-border-radius);
  display: block;
  margin-bottom: var(--global-space-fixed-5);
  height: 84px;
  width: 208px;
}
</style>
