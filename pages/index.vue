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

      <b-row>
        <b-col>
          <h2>Latest Additions</h2>
          <ul>
            <li v-for="(game, index) in newGames" :key="`new-game-${index}`">
              <nuxt-link :to="`/games/${game.slug}`">
                {{ game.title }}
                <sup>[{{ game.system.shortName }}]</sup>
              </nuxt-link>
            </li>
          </ul>
        </b-col>
      </b-row>
    </b-container>
  </main>
</template>

<script>
import { latestGames } from "~/graphql/latestGames.gql";
export default {
  async asyncData({ $graphql }) {
    let newGames = await $graphql.default.request(latestGames);
    newGames = newGames.gameCollection.items;

    return {
      newGames,
    };
  },
};
</script>
