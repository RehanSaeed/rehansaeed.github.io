<template>
  <article
    ref="article"
    class="about"
    :class="{ 'about--motion': motionEnabled }"
    aria-labelledby="about">
    <header id="the-person" class="about__hero">
      <div class="about__intro">
        <div>
          <p class="about__eyebrow">Muhammad Rehan Saeed</p>
          <h1 id="about">Software is<br />a <em>human</em><br />endeavour.</h1>
          <p class="about__standfirst">
            A little about my professional career, open source projects and the
            things I share along the way.
          </p>
          <div class="about__prose">
            <p><strong>Hello, I'm Rehan.</strong></p>
            <p>
              I am a professional Software Developer at Microsoft. Although I
              work for Microsoft, my opinions are my own.
            </p>
            <blockquote class="about__quote">
              <p>
                If it’s written in HTML/CSS/JS, C# or .NET, I have probably
                written something using it in anger!
              </p>
              <footer>— Muhammad Rehan Saeed</footer>
            </blockquote>
            <p class="about__source-note">
              In my own words:
              <a :href="metadata.author.gitHub.url">GitHub biography</a> and
              <a :href="credlyUrl">Credly profile</a>.
            </p>
          </div>
          <a class="about__text-link" href="#youtube">
            Explore the work <span aria-hidden="true">&darr;</span>
          </a>
        </div>
        <figure class="about__portrait">
          <NuxtPicture
            format="avif"
            legacy-format="jpg"
            :img-attrs="{ class: 'about__portrait-image' }"
            alt="Muhammad Rehan Saeed"
            height="480"
            width="320"
            sizes="320px"
            loading="eager"
            fetchpriority="high"
            src="/images/author/Muhammad-Rehan-Saeed/Profile-320x480.jpg" />
          <figcaption>
            The person behind the code.<br />
            Software developer, open source contributor and blogger.
          </figcaption>
        </figure>
      </div>
      <div class="about__hero-footer">
        <p>Scroll to explore. Read at your own pace.</p>
      </div>
    </header>

    <section
      class="about__location about__section"
      aria-label="London, United Kingdom"
      data-reveal>
      <u-location-map />
    </section>

    <section
      id="youtube"
      class="about__youtube about__section"
      aria-labelledby="youtube-title">
      <div class="about__feature-copy" data-reveal>
        <h2 id="youtube-title">YouTube</h2>
        <p class="about__standfirst">
          I occasionally appear on YouTube and Twitch where you can watch my
          software development escapades.
        </p>
        <a class="about__text-link" :href="metadata.author.youtube.url"
          >Watch on YouTube &rarr;</a
        >
        <a class="about__text-link" :href="metadata.author.twitch.url"
          >Find me on Twitch &rarr;</a
        >
        <div class="about__youtube-images">
          <a :href="metadata.author.youtube.url">
            <img
              class="about__youtube-badge"
              alt="Youtube views"
              width="104"
              height="20"
              loading="lazy"
              :src="youtubeBadgeImageUrl('viewCount', 'Views')" />
          </a>
          <a :href="metadata.author.youtube.url">
            <img
              class="about__youtube-badge"
              alt="Youtube subscribers"
              width="124"
              height="20"
              loading="lazy"
              :src="youtubeBadgeImageUrl('subscriberCount', 'Subscribers')" />
          </a>
        </div>
      </div>
      <figure class="about__youtube-feature" data-reveal>
        <a :href="metadata.author.youtube.url">
          <NuxtPicture
            format="avif"
            legacy-format="jpg"
            :img-attrs="{ class: 'about__youtube-image' }"
            alt="Muhammad Rehan Saeed pointing at the .NET logo on his YouTube channel artwork"
            width="1920"
            height="1080"
            sizes="sm:640px md:960px lg:1280px"
            loading="lazy"
            src="/images/hero/My-YouTube-1920x1080.jpg" />
        </a>
        <figcaption>
          My YouTube channel. Follow the image to browse my videos; no video
          player loads until you visit the channel.
        </figcaption>
      </figure>
    </section>

    <section
      id="github"
      class="about__work about__section"
      aria-labelledby="work-title">
      <header class="about__work-header" data-reveal>
        <h2 id="work-title">GitHub</h2>
        <p class="about__standfirst">
          You can see some of the open source projects that I have founded and
          maintained in my
          <NuxtLink to="/portfolio/">portfolio</NuxtLink>.
        </p>
        <p>
          There are many others I have contributed to which you can see in my
          <a :href="metadata.author.gitHub.url">GitHub profile</a>, and of
          course there are other commercial projects that I cannot disclose.
        </p>
        <a class="about__text-link" :href="metadata.author.gitHub.sponsorsUrl">
          Sponsor my open source work &rarr;
        </a>
        <div class="about__github-images">
          <a :href="metadata.author.gitHub.url">
            <img
              class="about__github-image"
              alt="GitHub stars"
              width="135"
              height="30"
              loading="lazy"
              :src="`https://img.shields.io/github/stars/${metadata.author.gitHub.user}?style=social`" />
          </a>
          <a :href="`${metadata.author.gitHub.url}?tab=followers`">
            <img
              class="about__github-image"
              alt="GitHub follower count"
              width="168"
              height="30"
              loading="lazy"
              :src="`https://img.shields.io/github/followers/${metadata.author.gitHub.user}?style=social`" />
          </a>
          <a :href="metadata.author.gitHub.sponsorsUrl">
            <img
              class="about__github-image"
              alt="GitHub sponsors"
              width="121"
              height="30"
              loading="lazy"
              :src="`https://img.shields.io/github/sponsors/${metadata.author.gitHub.user}?logo=github&style=social`" />
          </a>
        </div>
      </header>

      <figure class="about__github-statistics" data-reveal>
        <a :href="metadata.author.gitHub.url">
          <picture>
            <source
              media="(prefers-reduced-motion: reduce)"
              srcset="
                https://raw.githubusercontent.com/RehanSaeed/RehanSaeed/main/profile-3d-contrib/profile-green.svg
              " />
            <img
              class="about__github-statistics-image"
              alt="GitHub contribution graphic; open my profile for the contribution calendar and current details"
              width="1280"
              height="850"
              loading="lazy"
              :src="gitHubStatisticsImageUrl" />
          </picture>
        </a>
        <figcaption>
          My GitHub contribution graphic, generated by my profile repository.
          <a :href="metadata.author.gitHub.url"
            >View current activity on GitHub</a
          >.
        </figcaption>
      </figure>
    </section>

    <section
      id="awards"
      class="about__recognition about__section"
      aria-labelledby="recognition-title">
      <header class="about__recognition-header" data-reveal>
        <h2 id="recognition-title">Awards</h2>
        <p class="about__standfirst">
          Community recognition, participation and credentials. Different
          things, with different meanings.
        </p>
      </header>
      <figure class="about__honour" data-reveal>
        <a href="/open-uk-honouree/">
          <NuxtPicture
            format="avif"
            legacy-format="jpg"
            :img-attrs="{ class: 'about__honour-image' }"
            alt="Open UK Honours 2022"
            height="396"
            width="1288"
            sizes="sm:322px md:644px"
            loading="lazy"
            src="/images/about/Open-UK-Honours-2022-1288x396.jpg" />
        </a>
        <figcaption>
          <span class="about__eyebrow">2022 / OpenUK</span>
          <h3>Recognition from the open technology community.</h3>
          <p>
            I was included in OpenUK's 2022 Honours List for open source
            software. This is OpenUK's community recognition, not a UK state
            honour.
          </p>
          <p class="about__source-note">
            <a href="/open-uk-honouree/">My account of the award</a> ·
            <a
              href="https://openuk.uk/community/openuk-honours-lists/2022honourslist/">
              OpenUK's 2022 list
            </a>
          </p>
        </figcaption>
      </figure>
      <div class="about__credential-intro" data-reveal>
        <h3>Participation is part of the story, too.</h3>
        <p>
          Here are some of my hackathon participation and security recognition
          badges. Participant badges show participation, not competition wins.
          The years belong to the badges; they are not a career timeline.
        </p>
      </div>
      <section
        v-for="group in credentialGroups"
        :key="group.year"
        class="about__credential-group"
        :aria-labelledby="`credentials-${group.year}`">
        <h4
          :id="`credentials-${group.year}`"
          class="about__credential-year"
          data-reveal>
          {{ group.year }}
        </h4>
        <ul
          class="about__credentials"
          :aria-label="`${group.year} credentials and participation`">
          <li
            v-for="credential in group.credentials"
            :key="credential.filename"
            data-reveal>
            <a :href="credlyUrl">
              <NuxtPicture
                format="avif"
                legacy-format="png"
                :img-attrs="{ class: 'about__badge-image' }"
                :alt="credential.label"
                height="300"
                :width="credential.width"
                sizes="150px"
                densities="x1 x2"
                loading="lazy"
                :src="`/images/about/${credential.filename}`" />
              <span>{{ credential.title }}</span>
              <span class="about__source-note"
                >{{ credential.kind }} · Credly &rarr;</span
              >
            </a>
          </li>
        </ul>
      </section>
      <p class="about__source-note">
        Badge artwork and labels are also shown on my
        <a :href="metadata.author.gitHub.url">GitHub profile</a>.
        <a :href="credlyUrl">Consult Credly for issuer records</a>; this gallery
        is not a complete or live credential record.
      </p>
    </section>

    <section
      id="stackoverflow"
      class="about__answers about__section"
      aria-labelledby="answers-title"
      data-reveal>
      <h2 id="answers-title">Stack Overflow</h2>
      <p class="about__standfirst">
        I have been fairly active on Stack Overflow. You can view my
        <a :href="metadata.author.stackOverflow.url">Stack Overflow profile</a>
        and see my contribution to the community.
      </p>
      <a class="about__text-link" :href="metadata.author.stackOverflow.url">
        Browse my questions and answers &rarr;
      </a>
      <figure class="about__stack-overflow">
        <a :href="metadata.author.stackOverflow.url">
          <img
            class="about__stack-overflow-image"
            alt="Stack Overflow profile statistics"
            width="208"
            height="58"
            loading="lazy"
            :src="stackOverflowProfileUrl" />
        </a>
        <figcaption>
          My profile image is supplied by Stack Overflow. Follow it to see my
          questions, answers and current reputation.
        </figcaption>
      </figure>
    </section>

    <section
      id="microsoft-mvp"
      class="about__mvp about__section"
      aria-labelledby="alumni-title"
      data-reveal>
      <h2 id="alumni-title">Microsoft MVP</h2>
      <div class="about__alumni">
        <a
          href="https://mvp.microsoft.com/en-us/PublicProfile/5001654?fullName=Muhammad%20Rehan%20Saeed">
          <NuxtPicture
            format="avif"
            legacy-format="png"
            :img-attrs="{ class: 'about__mvp-image' }"
            alt="Microsoft Most Valuable Professional (MVP)"
            height="303"
            width="750"
            sizes="208px"
            loading="lazy"
            src="/images/about/Microsoft-Most-Valuable-Professional-750x303.png" />
        </a>
        <div>
          <h3>Before Microsoft: the MVP years.</h3>
          <p>
            Before I joined Microsoft, I was a Microsoft Most Valuable
            Professional (MVP). Once I joined Microsoft, I had to give up this
            award. The alumni badge below is not a current MVP award.
          </p>
          <p class="about__source-note">
            My
            <a :href="metadata.author.gitHub.url">self-reported biography</a>
            and <a href="/open-uk-honouree/">2022 account</a> describe this
            earlier chapter.
          </p>
          <figure class="about__alumni-badge">
            <a :href="credlyUrl">
              <NuxtPicture
                format="avif"
                legacy-format="png"
                :img-attrs="{ class: 'about__badge-image' }"
                alt="Microsoft Most Valuable Professional (MVP) Alumni"
                width="300"
                height="300"
                sizes="150px"
                densities="x1 x2"
                loading="lazy"
                src="/images/about/Microsoft-Most-Valuable-Professional-Alumni-2023-300x300.png" />
            </a>
            <figcaption>
              MVP alumni status — not a current MVP award.
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  </article>
</template>

<script setup lang="ts">
import { aboutCredentials } from "~/data/about";

const metadata = useAppConfig().site;
const title = "About";
const description = `About ${metadata.author.name}. ${metadata.description}.`;
const url = `${metadata.url}/about/`;
const credlyUrl = "https://www.credly.com/users/muhammad_rehan_saeed/badges";
const awardCredentials = aboutCredentials.filter(
  (credential) => credential.kind !== "Alumni",
);
const credentialGroups = [...new Set(awardCredentials.map(({ year }) => year))]
  .sort((a, b) => Number(b) - Number(a))
  .map((year) => ({
    year,
    credentials: awardCredentials.filter(
      (credential) => credential.year === year,
    ),
  }));

useBlogOgImage(title);
useSchemaOrg([
  defineWebPage({
    "@type": "ProfilePage",
    mainEntity: { "@id": `${metadata.url}/#identity` },
  }),
  defineBreadcrumb({
    itemListElement: [
      { name: "Blog", item: `${metadata.url}/` },
      { name: title, item: url },
    ],
  }),
]);
useHead({
  title,
  link: [{ rel: "canonical", href: url }],
  meta: [
    { name: "description", content: description },
    { name: "author", content: metadata.author.name },
    { property: "og:title", content: title },
    { property: "og:url", content: url },
    { property: "og:description", content: description },
    { property: "og:locale", content: metadata.language.replace("-", "_") },
    { property: "og:site_name", content: metadata.name },
    { property: "og:type", content: "profile" },
    { property: "profile:first_name", content: metadata.author.firstName },
    { property: "profile:last_name", content: metadata.author.lastName },
    { property: "profile:username", content: metadata.author.name },
    { property: "profile:gender", content: metadata.author.gender },
    { property: "fb:app_id", content: metadata.facebookAppId },
  ],
});

const article = useTemplateRef("article");
const reducedMotion = ref(true);
const motionEnabled = computed(() => !reducedMotion.value);
const theme = ref<"light" | "dark">("light");
const gitHubStatisticsImageUrl = computed(() => {
  const file =
    theme.value === "light"
      ? "profile-green-animate.svg"
      : "profile-night-green.svg";
  return `https://raw.githubusercontent.com/RehanSaeed/RehanSaeed/main/profile-3d-contrib/${file}`;
});
const stackOverflowProfileUrl = computed(
  () =>
    `https://stackoverflow.com/users/flair/${metadata.author.stackOverflow.user}.png?theme=${theme.value === "light" ? "dark" : "light"}`,
);
let revealObserver: IntersectionObserver | undefined;
let motionPreference: MediaQueryList | undefined;

function updateMotionPreference() {
  reducedMotion.value = motionPreference?.matches ?? true;
}

function updateTheme() {
  theme.value =
    document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function youtubeBadgeImageUrl(
  statistic: "viewCount" | "subscriberCount",
  label: string,
) {
  const query = new URLSearchParams({
    url: `https://api.socialcounts.org/youtube-live-subscriber-count/${metadata.author.youtube.user}`,
    query: `$.counters.api.${statistic}`,
    label,
    logo: "youtube",
    style: "social",
  });
  return `https://img.shields.io/badge/dynamic/json?${query}`;
}

watch(motionEnabled, (enabled) => {
  if (!enabled) {
    article.value?.getAnimations({ subtree: true }).forEach((animation) => {
      animation.cancel();
    });
  }
});

onMounted(() => {
  updateTheme();
  window.addEventListener("__themeChanged", updateTheme);
  motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  updateMotionPreference();
  motionPreference.addEventListener("change", updateMotionPreference);

  // Content stays visible if JavaScript or IntersectionObserver is unavailable.
  if (!("IntersectionObserver" in window)) return;
  revealObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.setAttribute("data-revealed", "");
          revealObserver?.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.1 },
  );
  article.value?.querySelectorAll("[data-reveal]").forEach((element) => {
    revealObserver?.observe(element);
  });
});

onBeforeUnmount(() => {
  window.removeEventListener("__themeChanged", updateTheme);
  revealObserver?.disconnect();
  motionPreference?.removeEventListener("change", updateMotionPreference);
});
</script>

<style lang="scss" src="~/assets/style/about.scss"></style>
