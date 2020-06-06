<template>
  <u-intersect @enterFirstTime="onEnterFirstTime" root-margin="200px 200px 200px 200px">
    <u-content-box class="webmentions" :class="{ 'webmentions--empty': isEmpty, 'webmentions--loaded': isLoaded }" tag="section">
      <u-heading class="webmentions__title" id="webmentions" center level="2" href="#webmentions">Web Mentions</u-heading>
      <a class="webmentions__help" href="https://en.wikipedia.org/wiki/Webmention"><u-icon-question class="webmentions__icon" :size="18"/> <span>What's this?</span></a>
      <div class="webmentions__container">

        <p class="webmentions__count webmentions__like-count"><u-icon-heart class="webmentions__icon" :size="16" title="Likes"/><span>{{likesDescription}}</span></p>
        <u-webmention-faces class="webmentions__like-faces" :mentions="likes"/>

        <p class="webmentions__count webmentions__repost-count"><u-icon-heart class="webmentions__icon" :size="16" title="Reposts"/><span>{{repostsDescription}}</span></p>
        <u-webmention-faces class="webmentions__repost-faces" :mentions="reposts"/>

        <p class="webmentions__count webmentions__reply-count"><u-icon-comment class="webmentions__icon" :size="16" title="Replies"/><span>{{repliesDescription}}</span></p>
        <div class="webmentions__replies">
          <u-webmention-reply
            v-for="reply in replies"
            :key="reply.id"
            :reply="reply"/>
        </div>

      </div>
    </u-content-box>
  </u-intersect>
</template>

<script>
import contentBox from '~/components/shared/content-box.vue';
import heading from '~/components/shared/heading.vue';
import intersect from '~/components/shared/intersect.vue';
import iconComment from '~/components/shared/icons/icon-comment.vue';
import iconHeart from '~/components/shared/icons/icon-heart.vue';
import iconQuestion from '~/components/shared/icons/icon-question.vue';
import webmentionFaces from '~/components/webmention-faces.vue';
import webmentionReply from '~/components/webmention-reply.vue';

export default {
  name: 'u-webmentions',
  components: {
    'u-content-box': contentBox,
    'u-heading': heading,
    'u-intersect': intersect,
    'u-icon-comment': iconComment,
    'u-icon-heart': iconHeart,
    'u-icon-question': iconQuestion,
    'u-webmention-faces': webmentionFaces,
    'u-webmention-reply': webmentionReply,
  },
  data() {
    return {
      isLoaded: false,
      isEmpty: false,
      likes: [],
      reposts: [],
      replies: [],
    };
  },
  props: {
    url: {
      required: true,
      type: String,
    },
  },
  computed: {
    likesDescription() { return `${this.likes?.length ?? 0} ${this.pluralise(this.likes?.length, 'Like', 'Likes')}`; },
    repostsDescription() { return `${this.reposts?.length ?? 0} ${this.pluralise(this.reposts?.length, 'Repost', 'Reposts')}`; },
    repliesDescription() { return `${this.replies?.length ?? 0} ${this.pluralise(this.replies?.length, 'Reply', 'Replies')}`; },
  },
  methods: {
    pluralise(count, one, many) { return count === 1 ? one : many; },
    async getMentions(page, perPage) {
      const response = await fetch(`https://webmention.io/api/mentions?page=${page}&per-page=${perPage}&target=${this.url}&sort-by=published`);
      const list = await response.json();
      return list.links;
    },
    async onEnterFirstTime() {
      try {
        const mentions = await this.getMentions(0, 999);
        this.likes = mentions.filter(x => x.activity.type === 'like');
        this.reposts = mentions.filter(x => x.activity.type === 'repost');
        this.replies = mentions.filter(x => x.activity.type === 'reply' || x.activity.type === 'link');
        this.isEmpty = mentions.length === 0;
        this.isLoaded = true;
      } catch (error) {
        console.log(error);
      }
    }
  }
}
</script>

<style lang="scss">
.webmentions {
  display: grid;
}

.webmentions--empty {
  display: none;
}
.webmentions--loaded {
  .webmentions__container {
    display: grid;
  }
}

.webmentions__title {
  grid-column: 1;
  grid-row: 1;

  margin-top: 0;
}

.webmentions__help {
  grid-column: 1;
  grid-row: 1;
  align-self: center;
  justify-self: end;
  margin-bottom: var(--global-space-fixed-4);
}

@media screen and (max-width: 576px) { // $global-breakpoint-sm
  .webmentions__help {
    grid-row: 2;
    justify-self: start;
  }
}

.webmentions__container {
  display: none;
  grid-gap: var(--global-space-fixed-3);
  grid-template-areas:
    "likeCount repostCount"
    "likes reposts"
    "replyCount ."
    "replies replies";
  grid-template-columns: 1fr 1fr;
}

.webmentions__count {
  min-width: 0;
  margin-bottom: 0;
}
.webmentions__icon {
  margin-right: var(--global-space-fixed-2);
}

.webmentions__like-count {
  grid-area: likeCount;
}
.webmentions__like-faces {
  grid-area: likes;
}

.webmentions__repost-count {
  grid-area: repostCount;
}
.webmentions__repost-faces {
  grid-area: reposts;
}

.webmentions__reply-count {
  grid-area: replyCount;
}
.webmentions__replies {
  grid-area: replies;

  display: grid;
  grid-gap: var(--global-space-fixed-3);
}
</style>
