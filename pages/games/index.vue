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
  async asyncData({ $graphql }) {
    let allGames = await $graphql.default.request(allGamesQuery, {
      preview: process.env.CTF_PREVIEW,
    });
    allGames = allGames.gameCollection.items;

    return {
      allGames,
    };
  },
};
</script>
