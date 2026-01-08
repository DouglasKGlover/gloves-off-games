<template>
  <main>
    <b-container>
      <b-row>
        <b-col>
          <h1>Gloves Off Games</h1>
          <p>My personal collection tracking site.</p>
          <hr />
        </b-col>
      </b-row>

      <b-row v-if="currentlyPlayingGames.length" class="mb-4">
        <b-col>
          <h2>Currently Playing</h2>
          <ul>
            <li
              v-for="(game, index) in currentlyPlayingGames"
              :key="`new-game-${index}`"
            >
              <NuxtLink :to="`/games/${game.system.slug}/${game.slug}`">
                {{ game.title }}
                <sup>[{{ game.system.shortName }}]</sup>
                <sup v-if="game.digital">[Digital]</sup>
              </NuxtLink>
            </li>
          </ul>
        </b-col>
      </b-row>

      <b-row class="mb-4">
        <b-col>
          <h2>Recently Updated</h2>
          <ul>
            <li
              v-for="(game, index) in recentlyUpdated"
              :key="`updated-game-${index}`"
            >
              <span class="small">{{
                $dateTranslate(game.sys.publishedAt).short
              }}</span>
              -
              <NuxtLink :to="`/games/${game.system.slug}/${game.slug}`">
                {{ game.title }}
                <sup>[{{ game.system.shortName }}]</sup>
                <sup v-if="game.digital">[Digital]</sup>
              </NuxtLink>
            </li>
          </ul>
        </b-col>
      </b-row>

      <b-row class="mb-4">
        <b-col>
          <h2>Latest Additions</h2>
          <ul>
            <li v-for="(game, index) in latestGames" :key="`new-game-${index}`">
              <span class="small">{{
                $dateTranslate(game.sys.firstPublishedAt).short
              }}</span>
              -
              <NuxtLink :to="`/games/${game.system.slug}/${game.slug}`">
                {{ game.title }}
                <sup>[{{ game.system.shortName }}]</sup>
                <sup v-if="game.digital">[Digital]</sup>
              </NuxtLink>
            </li>
          </ul>
        </b-col>
      </b-row>
    </b-container>
  </main>
</template>

<script setup>
import recentlyUpdatedQuery from "~/graphql/recentlyUpdated.gql";
import latestGamesQuery from "~/graphql/latestGames.gql";
import currentlyPlayingGamesQuery from "~/graphql/currentlyPlayingGames.gql";

useHead({
  title: "Gloves Off Games",
  meta: [
    {
      hid: "description",
      name: "description",
      content:
        "My personal collection tracking site with game collection management, stats, and gameplay logs.",
    },
  ],
});

const { $graphql } = useNuxtApp();

const { data: recentlyUpdatedData } = await useAsyncData(
  "recentlyUpdated",
  () => $graphql.request(recentlyUpdatedQuery),
);
const recentlyUpdated = computed(
  () => recentlyUpdatedData.value?.gameCollection?.items || [],
);

const { data: latestGamesData } = await useAsyncData("latestGames", () =>
  $graphql.request(latestGamesQuery),
);
const latestGames = computed(
  () => latestGamesData.value?.gameCollection?.items || [],
);

const { data: currentlyPlayingGamesData } = await useAsyncData(
  "currentlyPlayingGames",
  () => $graphql.request(currentlyPlayingGamesQuery),
);
const currentlyPlayingGames = computed(
  () => currentlyPlayingGamesData.value?.gameCollection?.items || [],
);
</script>
