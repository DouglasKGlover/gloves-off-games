<template>
  <main>
    <b-container>
      <b-row>
        <b-col>
          <h1>Glog</h1>
          <p>Game log. <em>Eh?</em></p>

          <hr />

          <div
            class="game-log-link"
            v-for="(glog, index) in allGameLogs"
            :key="`game-log-${index}`"
          >
            {{ $dateTranslate(glog.sys.firstPublishedAt) }} -
            <nuxt-link :to="`/games/${glog.game.slug}`">
              {{ glog.game.title }}
            </nuxt-link>
            <br />
            <nuxt-link :to="`/glog/${glog.slug}`">{{ glog.title }}</nuxt-link>
          </div>
        </b-col>
      </b-row>
    </b-container>
  </main>
</template>

<script>
import { allGameLogsQuery } from "~/graphql/allGameLogs.gql";
export default {
  async asyncData({ $graphql }) {
    let allGameLogs = await $graphql.default.request(allGameLogsQuery);
    allGameLogs = allGameLogs.gameLogCollection.items;

    return {
      allGameLogs,
    };
  },
};
</script>
