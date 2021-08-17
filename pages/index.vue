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

          <div v-for="(game, index) in pageData.allGames.items">
            {{ game.title }} ({{ game.system.title }})
          </div>
        </b-col>
      </b-row>
    </b-container>
  </main>
</template>

<script>
import { gameCollectionQuery } from "~/graphql/allGames.gql";
export default {
  async asyncData({ $graphql }) {
    const queryVariables = {
      preview: process.env.CTF_PREVIEW,
    };
    const pageData = await $graphql.default.request(
      gameCollectionQuery,
      queryVariables
    );

    return {
      pageData,
    };
  },
};
</script>
