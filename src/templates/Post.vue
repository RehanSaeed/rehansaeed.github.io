<template>
  <Layout>
    <div class="post-title">
      <h1 class="post-title__text">
        {{ $page.post.title }}
      </h1>

      <Meta :meta="$page.post" />

    </div>

    <ContentBox class="post">
      <div class="post__header">
        <g-image alt="Cover image" v-if="$page.post.cover_image" :src="$page.post.cover_image" />
      </div>

      <div class="post__content" v-html="$page.post.content" />

      <div class="post__footer">
        <div class="post__footer-first-row">
          <EditOnGitHubButton :post="$page.post" class="post__edit" />
          <ShareButton :title="$page.post.title" :tags="$page.post.tags.map(x => x.title)" class="post__share" />
        </div>
        <Tags :tags="$page.post.tags"  class="post__tags" />
      </div>

    </ContentBox>

    <div class="post-comments">
      <!-- Add comment widgets here -->

    </div>

    <Author class="post-author" />
  </Layout>
</template>

<script>
import Author from '~/components/Author.vue';
import ContentBox from '~/components/ContentBox.vue';
import EditOnGitHubButton from '~/components/EditOnGitHubButton.vue';
import Meta from '~/components/Meta';
import ShareButton from '~/components/ShareButton.vue';
import Tags from '~/components/Tags';

export default {
  components: {
    Author,
    ContentBox,
    EditOnGitHubButton,
    Meta,
    ShareButton,
    Tags,
  },
  metaInfo () {
    return {
      title: this.$page.post.title,
      meta: [
        {
          name: 'description',
          content: this.$page.post.description
        },
        {
          name: 'author',
          content: this.$page.post.author.name
        },
        {
          name: 'keywords',
          content: this.$page.post.tags.map(x => x.title).join(",")
        },

        // Twitter card
        {
          name: 'twitter:card',
          content: 'summary_large_image'
        },
        {
          name: 'twitter:site',
          content: this.$static.metadata.author.twitter
        },
        {
          name: 'twitter:creator',
          content: this.$static.metadata.author.twitter
        },
        {
          name: 'twitter:title',
          content: this.$page.post.title
        },
        {
          name: 'twitter:description',
          content: this.$page.post.description
        },
        {
          name: 'twitter:image',
          content: this.$static.metadata.url + this.$page.post.cover_image
        }
      ]
    }
  }
}
</script>

<static-query>
query {
  metadata {
    url
    author {
      name
      twitter
    }
  }
}
</static-query>

<page-query>
query Post ($id: ID!) {
  post: post (id: $id) {
    title
    path
    date (format: "DD MMMM YYYY")
    timeToRead
    author
    tags {
      id
      title
      path
    }
    description
    content
    cover_image (width: 860, blur: 10)
  }
}
</page-query>

<style lang="scss">
.post-title {
  padding: calc(var(--space) / 2) 0 calc(var(--space) / 2);
  text-align: center;
}

.post__header {
  width: calc(100% + var(--space) * 2);
  margin-left: calc(var(--space) * -1);
  margin-top: calc(var(--space) * -1);
  margin-bottom: calc(var(--space) / 2);
  overflow: hidden;
  border-radius: var(--radius) var(--radius) 0 0;

  img {
    width: 100%;
  }

  &:empty {
    display: none;
  }
}

.post__content {
  > h2:first-child {
    margin-top: 0;
  }

  > p:first-of-type {
    font-size: 1.2em;
    color: var(--title-color);
  }

  img {
    width: calc(100% + var(--space) * 2);
    margin-left: calc(var(--space) * -1);
    display: block;
    max-width: none;
  }
}

.post__footer {
  display: grid;
  justify-items: start;
}

.post__footer-first-row {
  display: grid;
  grid-template-columns: auto auto 1fr;
  grid-gap: .6rem;
}

.post__edit,
.post__share {
  margin-bottom: 1.5rem;
}

.post-comments {
  padding: calc(var(--space) / 2);

  &:empty {
    display: none;
  }
}

.post-author {
  margin-top: calc(var(--space) / 2);
}
</style>
