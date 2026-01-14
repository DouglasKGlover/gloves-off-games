<template>
  <div>
    <SiteHero
      :title="glog.title"
      :subtitle="
        'Published on ' + $dateTranslate(glog.sys.firstPublishedAt).long
      "
    />
    <div class="container grid gap-4 md:gap-6 grid-cols-12">
      <div v-if="glog.game?.cover?.thumbnail" class="glog-game-card col-span-12 col-span-md-3"">
        <GameCard :game="glog.game" />
      </div>

      <div
        v-else-if="glog.game"
        class="glog-game-button col-span-12 col-span-md-3"
      >
        <NuxtLink
          :to="`/games/${glog.game.system.slug}/${glog.game.slug}`"
          class="button secondary"
        >
          {{ glog.game.title }}
        </NuxtLink>
      </div>

      <div v-else class="col-span-12 col-span-md-2"></div>

      <div
        id="glog-details"
        class="col-span-12 col-span-md-8 glog-details-bg"
        v-html="$translateRichText(glog.details.json)"
      ></div>
    </div>
  </div>
</template>

<script setup>
import gameLogBySlugQuery from "~/graphql/gameLogBySlug.gql";

const route = useRoute();

const { $graphql } = useNuxtApp();

const { data: glogData } = await useAsyncData(
  () => `glogDetail-${route.params.slug}`,
  () =>
    $graphql.request(gameLogBySlugQuery, {
      slug: route.params.slug,
    }),
);

const glog = computed(
  () => glogData.value?.gameLogCollection?.items?.[0] || {},
);

useHead({
  title: computed(() =>
    glog.value?.title
      ? `Gloves Off Games - ${glog.value.title}`
      : "Gloves Off Games - Glog",
  ),
});
</script>

<style scoped lang="scss">
@use "~/assets/css/breakpoints" as *;
@use "sass:map";

.glog-game-card {
  max-width: 30rem;
  margin: 2rem auto;
  align-self: start;

  @media (min-width: map.get($breakpoints, md)) {
    margin: 2rem 0;
  }
}

.glog-game-button {
  margin: 2rem 0;
}

.glog-details-bg {
  background: rgba(0,0,0,0.5);
  border-radius: 0.8rem;
  padding: 2rem;
  color: #f7f7fa;
}
</style>
