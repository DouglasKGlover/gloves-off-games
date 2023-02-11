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

<script>
import { allGamesQuery } from "~/graphql/allGames.gql";
export default {
  head() {
    return {
      title: "Gloves Off Games - Games",
    };
  },
  async asyncData({ $graphql }) {
    let allGames = await $graphql.default.request(allGamesQuery);
    allGames = allGames.gameCollection.items;

    return {
      allGames,
    };
  },
};
</script>
