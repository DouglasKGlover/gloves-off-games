<template>
  <div>
    <div class="container">
      <div>
        <div>
          <h1>{{ glog.title }}</h1>
          <p>
            Published on {{ $dateTranslate(glog.sys.firstPublishedAt).long }}
          </p>
        </div>
      </div>

      <div v-if="glog.game?.cover?.url" class="glog-game-card">
        <GameCard :game="glog.game" />
      </div>

      <div v-else-if="glog.game" class="glog-game-button">
        <NuxtLink
          :to="`/games/${glog.game.system.slug}/${glog.game.slug}`"
          class="button primary"
        >
          {{ glog.game.title }}
        </NuxtLink>
      </div>

      <div>
        <div>
          <div
            id="glog-details"
            v-html="$translateRichText(glog.details.json)"
          ></div>
        </div>
      </div>
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
.glog-game-card {
  max-width: 30rem;
  margin: 2rem 0;
}

.glog-game-button {
  margin: 2rem 0;
}
</style>
