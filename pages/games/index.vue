<template>
  <main>
    <div class="container">
      <div>
        <div>
          <h1>Games</h1>
          <p>Like, literally all my games.</p>

          <hr />

          <GameListWithFilters :games="allGames" />
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import allGamesQuery from "~/graphql/allGames.gql";

useHead({ title: "Gloves Off Games - Games" });

const { $graphql } = useNuxtApp();

const { data: allGamesData } = await useAsyncData("allGames", () =>
  $graphql.request(allGamesQuery),
);
const allGames = computed(
  () => allGamesData.value?.gameCollection?.items || [],
);
</script>
