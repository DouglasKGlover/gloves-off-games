<template>
  <main>
    <section class="container grid">
      <div
        class="col-span-12 col-span-md-6 col-start-md-4 col-end-md-10 text-center"
      >
        <img class="" :src="logoImage" alt="Gloves Off Games Logo" />
      </div>
    </section>

    <section class="container" v-if="currentlyPlayingGames.length">
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
    </section>

    <section class="container">
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
    </section>

    <section class="container">
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
    </section>
  </main>
</template>

<script setup>
import logoImage from "~/assets/images/logo.png";
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
