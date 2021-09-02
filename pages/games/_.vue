<template>
  <div>
    <b-container>
      <b-row>
        <b-col>
          <h1>{{ game.title }}</h1>
          <ul>
            <li>
              <nuxt-link :to="`/systems/${game.system.slug}`">{{
                game.system.title
              }}</nuxt-link>
            </li>
            <li><strong>Status: </strong> {{ game.playedStatus }}</li>
            <li v-if="game.wtbWts" :class="game.wtbWts.toLowerCase()">
              <strong v-if="game.wtbWts == 'WTS'">For sale!</strong>
            </li>
          </ul>
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

<style lang="scss" scoped>
.wts {
  strong {
    border-bottom: 2px solid var(--primary);
  }
}
</style>
