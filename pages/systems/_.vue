<template>
  <b-container>
    <b-row>
      <b-col>
        <h1>{{ system.title }}</h1>
        <p v-if="system.manufacturer">{{ system.manufacturer.title }}</p>

        <hr />

        <GameListWithFilters :games="games" />
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import { systemBySlugQuery } from "~/graphql/systemBySlug.gql";
import { gamesBySystemQuery } from "~/graphql/gamesBySystem.gql";
export default {
  head() {
    return {
      title: `Gloves Off Games - ${this.system.title}`,
    };
  },
  async asyncData({ $graphql, params }) {
    let system = await $graphql.default.request(systemBySlugQuery, {
      slug: params.pathMatch,
    });
    system = system.systemCollection.items[0];

    let games = await $graphql.default.request(gamesBySystemQuery, {
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
