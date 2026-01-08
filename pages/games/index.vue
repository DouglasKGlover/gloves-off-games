<template>
  <main>
    <b-container>
      <b-row>
        <b-col>
          <h1>Games</h1>
          <p>Like, literally all my games.</p>

          <hr />

          <GameListWithFilters :games="allGames" />
        </b-col>
      </b-row>
    </b-container>
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
