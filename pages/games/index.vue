<template>
  <main>
    <b-container>
      <b-row>
        <b-col>
          <h1>Gloves Off Games</h1>
        </b-col>
      </b-row>

      <b-row>
        <b-col>
          <h2>Games</h2>

          <div v-for="(game, index) in allGames">
            <nuxt-link :to="`/games/${game.slug}`">{{ game.title }}</nuxt-link>
          </div>
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
