<template>
  <div>
    <SiteHero :title="game.title" :background-image="game.cover?.full">
      <template #subtitle>
        <NuxtLink :to="`/systems/${game.system.slug}`">
          <img
            v-if="game.system.cover?.thumbnail"
            :src="game.system.cover.thumbnail"
            :alt="game.system.title"
            class="system-cover-link"
          />
          <span v-else>{{ game.system.title }}</span>
        </NuxtLink>
      </template>
    </SiteHero>
    <div class="container" v-if="game.title">
      <!-- Overview -->
      <section class="game-overview">
        <div v-if="game.requirementsForCompletion" class="overview-row">
          <div class="overview-label">Requirements for Completion:</div>
          <div
            class="overview-value"
            v-html="$translateLongText(game.requirementsForCompletion)"
          />
        </div>

        <div class="overview-row">
          <div class="overview-label">Status:</div>
          <div class="overview-value">{{ game.playedStatus }}</div>
        </div>

        <div v-if="game.highScore" class="overview-row">
          <div class="overview-label">High Score:</div>
          <div class="overview-value">{{ game.highScore }}</div>
        </div>

        <div class="overview-row">
          <div class="overview-label">Added:</div>
          <div class="overview-value">
            {{ $dateTranslate(game.sys.firstPublishedAt).long }}
          </div>
        </div>

        <div class="overview-row">
          <div class="overview-label">Updated:</div>
          <div class="overview-value">
            {{ $dateTranslate(game.sys.publishedAt).long }}
          </div>
        </div>

        <div class="overview-row">
          <!-- <div class="overview-label">Price Check:</div> -->
          <div class="overview-value">
            <a :href="ebayLink" target="_blank">&#128184; Price Check</a>
          </div>
        </div>
      </section>

      <!-- Photos -->
      <section v-if="photosList.length" class="section">
        <hr />
        <h3>Photos</h3>
        <div class="grid grid-cols-2 grid-cols-md-4 grid-cols-lg-6">
          <div
            v-for="(photo, index) in photosList"
            :key="`game-photo-${index}`"
            class="game-photo-item"
          >
            <img
              :src="photo.thumbnail"
              :alt="`Photo ${index + 1}`"
              class="game-photo-img"
              width="300"
              height="200"
            />
          </div>
        </div>
      </section>

      <!-- Blog -->
      <section v-if="glogs.length" class="section">
        <hr />

        <h3>Blog</h3>
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
      </section>
    </div>
  </div>
</template>

<script setup>
import gameBySlugAndSystemQuery from "~/graphql/gameBySlugAndSystem.gql";

const route = useRoute();
const { $graphql } = useNuxtApp();

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

.game-overview {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  background: #181a20;
  border-radius: 0.8rem;
  padding: 2rem;
  margin-bottom: 2rem;
}
.overview-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-start;
}
.overview-label {
  min-width: 140px;
  font-weight: 600;
  color: #b3b6c2;
}
.overview-value {
  flex: 1 1 0;
  color: #f7f7fa;
}
.game-photo-item {
  width: 100%;
  aspect-ratio: 3/2;
  overflow: hidden;
  border-radius: 0.5rem;
  background: #181a20;
  display: flex;
  align-items: center;
  justify-content: center;
}
.game-photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.system-cover-link {
  max-height: 9rem;
  width: auto;
  transition: 0.2s ease;

  &:hover {
    opacity: 0.8;
  }
}
</style>
