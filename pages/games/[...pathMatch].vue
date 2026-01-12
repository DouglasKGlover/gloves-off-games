<template>
  <div>
    <SiteHero :title="game.title" :background-image="game.cover?.full">
      <template #subtitle>
        <NuxtLink :to="`/systems/${game.system.slug}`">
          {{ game.system.title }}
        </NuxtLink>
      </template>
    </SiteHero>
    <div class="container" v-if="game.title">
      <div>
        <div>
          <!-- Overview -->
          <div class="section">
            <h3>Overview</h3>

            <ul>
              <li>
                <GameRegionIndicator :region="game.region" />
              </li>
              <li v-if="game.requirementsForCompletion">
                <strong>Requirements for Completion:</strong>
                <div
                  v-html="$translateLongText(game.requirementsForCompletion)"
                />
              </li>

              <li>
                <strong>Played Status: </strong>
                <GamePlayedStatusIndicator :status="game.playedStatus" />{{
                  game.playedStatus
                }}
              </li>

              <li v-if="game.highScore">
                <strong>High Score: </strong>
                {{ game.highScore }}
              </li>

              <li>
                <strong>Added: </strong>
                {{ $dateTranslate(game.sys.firstPublishedAt).long }}
              </li>

              <li>
                <strong>Updated: </strong>
                {{ $dateTranslate(game.sys.publishedAt).long }}
              </li>

              <li>
                <a :href="ebayLink" target="_blank">&#128184; Price Check</a>
              </li>
            </ul>

            <p></p>
          </div>

          <!-- Photos -->
          <div v-if="photosList.length" class="section">
            <h3>Photos</h3>

            <div>
              <div
                v-for="(photo, index) in photosList"
                :key="`game-photo-${index}`"
              >
                <button
                  @click="openModal(`photo-modal-${index}`)"
                  class="image-button"
                >
                  <img :src="photo.thumbnail" width="300" height="200" />
                </button>

                <dialog :id="`photo-modal-${index}`">
                  <img :src="photo.url" />
                </dialog>
              </div>
            </div>
          </div>

          <!-- Game Logs -->
          <div v-if="glogs.length" class="section">
            <h3>Game Log<span v-if="glogs.length > 1">s</span></h3>
            <div
              class="game-log-link"
              v-for="(glog, index) in glogs"
              :key="`game-log-${index}`"
            >
              {{ $dateTranslate(glog.sys.firstPublishedAt).short }} -
              <NuxtLink :to="`/blog/${glog.slug}`">
                {{ glog.title }}
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import gameBySlugAndSystemQuery from "~/graphql/gameBySlugAndSystem.gql";

const route = useRoute();
const { $graphql } = useNuxtApp();
// const parsePathMatch = (pathArray) => {
//   // pathArray is [system, slug] from [system]/[slug]
//   return {
//     slug: pathArray[1],
//     system: pathArray[0],
//   };
// };

// Normalize catch-all param to segments [system, slug]
const pathParam = route.params.pathMatch;
const segments = Array.isArray(pathParam)
  ? pathParam
  : String(pathParam || "").split("/");
const systemParam = segments[0];
const slugParam = segments[1];

const { data: gameData } = await useAsyncData(
  () => `gameDetail-${systemParam}-${slugParam}`,
  () =>
    $graphql.request(gameBySlugAndSystemQuery, {
      slug: slugParam,
      system: systemParam,
    }),
);

const game = computed(() => gameData.value?.gameCollection?.items?.[0] || {});
const glogs = computed(() => gameData.value?.gameLogCollection?.items || []);
const photosList = computed(() => game.value?.photosCollection?.items || []);

const ebayLink = computed(() => {
  if (!game.value.title) return "#";
  const concat = `${game.value.title}+${game.value.system.title}`;
  const searchTerm = concat
    .replaceAll("&", "&")
    .replaceAll(" ", "+")
    .replaceAll(":", "");
  return `https://www.ebay.ca/sch/i.html?_nkw=${searchTerm}&_in_kw=1&_ex_kw=&_sacat=0&LH_Sold=1&_udlo=&_udhi=&_samilow=&_samihi=&_sadis=15&_stpos=M4V+2E9&_sargn=-1&saslc=1&_salic=2&_sop=12&_dmd=1&_ipg=60&LH_Complete=1&_fosrp=1`;
});

useHead({
  title: computed(
    () =>
      `Gloves Off Games - ${game.value.title} (${game.value.system?.title || ""})`,
  ),
});
</script>

<style scoped lang="scss">
@use "~/assets/css/breakpoints" as *;
</style>
