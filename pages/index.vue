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
      <div class="games-grid">
        <GameCard
          v-for="(game, index) in currentlyPlayingGames"
          :key="`new-game-${index}`"
          :game="game"
        />
      </div>
    </section>

    <section class="container">
      <h2>Recently Updated</h2>
      <div class="games-grid games-grid-single-row">
        <GameCard
          v-for="(game, index) in recentlyUpdated"
          :key="`updated-game-${index}`"
          :game="game"
        />
      </div>
    </section>

    <section class="container">
      <h2>Latest Additions</h2>
      <div class="games-grid games-grid-single-row">
        <GameCard
          v-for="(game, index) in latestGames"
          :key="`new-game-${index}`"
          :game="game"
        />
      </div>
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
<style scoped lang="scss">
@use "~/assets/css/breakpoints" as *;

img {
  padding-top: $spacing-large;
}

.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
  max-width: 100%;
}

.games-grid-single-row {
  grid-template-rows: 1fr;

  > * {
    min-height: 0;
  }

  // Hide items beyond what fits in one row at each breakpoint
  // These act as a base layer to prevent layout shift during hydration
  > *:nth-child(n + 3) {
    display: none;
  }

  @media (min-width: 57.6rem) {
    > *:nth-child(n + 3) {
      display: block;
    }
    > *:nth-child(n + 4) {
      display: none;
    }
  }

  @media (min-width: 76.8rem) {
    > *:nth-child(n + 4) {
      display: block;
    }
    > *:nth-child(n + 5) {
      display: none;
    }
  }

  @media (min-width: 99.2rem) {
    > *:nth-child(n + 5) {
      display: block;
    }
    > *:nth-child(n + 7) {
      display: none;
    }
  }

  @media (min-width: 120rem) {
    > *:nth-child(n + 7) {
      display: block;
    }
    > *:nth-child(n + 9) {
      display: none;
    }
  }
}
</style>
