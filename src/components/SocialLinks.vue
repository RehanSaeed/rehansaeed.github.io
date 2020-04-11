<template>
  <div class="social">
    <EffectLink class="social__link" to="https://twitter.com/RehanSaeedUK">
      <TwitterIcon :size="30"/>
    </EffectLink>
    <EffectLink class="social__link" to="https://github.com/RehanSaeed">
      <GitHubIcon :size="30"/>
    </EffectLink>
    <EffectLink class="social__link" to="https://stackoverflow.com/users/1212017/muhammad-rehan-saeed">
      <StackOverflowIcon :size="30"/>
    </EffectLink>
    <EffectLink class="social__link" to="https://www.linkedin.com/in/muhammad-rehan-saeed/">
      <LinkedInIcon :size="30"/>
    </EffectLink>
    <EffectLink class="social__link" to="https://www.youtube.com/channel/UC6geox4JkY11093RqecELGA">
      <YoutubeIcon :size="30"/>
    </EffectLink>
    <EffectLink class="social__link" @click.native="OnEmailClick">
      <EmailIcon :size="30"/>
    </EffectLink>
    <EffectLink class="social__link" to="/rss.xml">
      <RssIcon :size="30"/>
    </EffectLink>
  </div>
</template>

<script>
import EffectLink from '~/components/EffectLink.vue';
import EmailIcon from '~/components/icons/EmailIcon.vue';
import GitHubIcon from '~/components/icons/GitHubIcon.vue';
import LinkedInIcon from '~/components/icons/LinkedInIcon.vue';
import RssIcon from '~/components/icons/RssIcon.vue';
import StackOverflowIcon from '~/components/icons/StackOverflowIcon.vue';
import TwitterIcon from '~/components/icons/TwitterIcon.vue';
import YoutubeIcon from '~/components/icons/YoutubeIcon.vue';

export default {
  components: {
    EffectLink,
    EmailIcon,
    GitHubIcon,
    LinkedInIcon,
    RssIcon,
    StackOverflowIcon,
    TwitterIcon,
    YoutubeIcon,
  },
  methods: {
    OnEmailClick: function() {
      const body = encodeURIComponent('If you have an issue with one of my GitHub projects, please raise a GitHub issue. If you need help answering a coding problem, post your question on StackOverflow where you will get quicker and better answers. Otherwise, please do feel free to contact me!')
      window.location.href = ['m', 'a', 'i', 'l', 't', 'o', ':', 'r', 'e', 'h', 'a', 'n', 's', 'a', 'e', 'e', 'd', '@', 'g', 'm', 'a', 'i', 'l', '.', 'c', 'o', 'm'].join('') +
        `?body=${body}`;
    }
  }
}
</script>

<style lang="scss">
.social {
  align-items: center;
  display: grid;
  grid-template-columns: repeat(7, auto);
  grid-gap: 1.8rem;
  justify-content: center;
}
</style>
