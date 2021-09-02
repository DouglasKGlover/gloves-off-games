<template>
  <main>
    <b-container>
      <b-row>
        <b-col>
          <h1>Games</h1>
          <p>Like, literally all my games.</p>

          <hr />

          <div v-for="(game, index) in allGames">
            <nuxt-link :to="`/games/${game.slug}`"
              >{{ game.title }}
              <sup v-if="game.system.shortName">
                [{{ game.system.shortName }}]</sup
              ></nuxt-link
            >
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
