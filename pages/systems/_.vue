<template>
  <div>
    <b-container>
      <b-row id="system-header">
        <b-col>
          <p>{{ system.manufacturer.title }}</p>
          <h1>{{ system.title }}</h1>
        </b-col>
      </b-row>
      <b-row>
        <b-col>
          <div v-for="(game, index) in games" :key="`game-link-${index}`">
            <nuxt-link :to="`/games/${game.slug}`">{{ game.title }}</nuxt-link>
          </div>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
import { systemBySlug } from "~/graphql/systemBySlug.gql";
import { gamesBySystem } from "~/graphql/gamesBySystem.gql";
export default {
  async asyncData({ $graphql, params }) {
    let system = await $graphql.default.request(systemBySlug, {
      slug: params.pathMatch,
    });
    system = system.systemCollection.items[0];

    let games = await $graphql.default.request(gamesBySystem, {
      system: params.pathMatch,
    });
    games = games.gameCollection.items;

    return {
      system,
      games,
    };
  },
};
</script>

<style lang="scss">
#system-header {
  p {
    margin: 0;
  }
}
</style>
