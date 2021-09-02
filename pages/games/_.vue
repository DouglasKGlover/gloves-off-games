<template>
  <div>
    <b-container>
      <b-row>
        <b-col>
          <h1>{{ game.title }}</h1>
          <nuxt-link :to="`/systems/${game.system.slug}`">{{
            game.system.title
          }}</nuxt-link>
          <p><strong>Status: </strong> {{ game.playedStatus }}</p>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
import { gameBySlug } from "~/graphql/gameBySlug.gql";
export default {
  async asyncData({ $graphql, params }) {
    let game = await $graphql.default.request(gameBySlug, {
      slug: params.pathMatch,
    });
    game = game.gameCollection.items[0];

    return {
      game,
    };
  },
};
</script>

<style></style>
