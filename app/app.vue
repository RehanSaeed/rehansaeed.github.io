<template>
  <NuxtRouteAnnouncer />
  <NuxtAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <ClientOnly>
    <SiteUpdate />
  </ClientOnly>
</template>

<script setup lang="ts">
import SiteUpdate from "~/components/site-update.vue";

const site = useAppConfig().site;
useSchemaOrg([
  defineWebSite({
    "@id": `${site.url}/#website`,
    author: { "@id": `${site.url}/#identity` },
    publisher: { "@id": `${site.url}/#publisher` },
    potentialAction: {
      "@type": "SearchAction",
      target: `${site.url}/?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  }),
  defineOrganization({
    "@id": `${site.url}/#publisher`,
    name: site.name,
    url: site.url,
    logo: `${site.url}/images/schema/Publisher-600x60.png`,
  }),
]);
</script>
