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

      <b-row v-if="currentlyPlayingGames.length" class="mb-4">
        <b-col>
          <h2>Currently Playing</h2>
          <ul>
            <li
              v-for="(game, index) in currentlyPlayingGames"
              :key="`new-game-${index}`"
            >
              <nuxt-link :to="`/games/${game.system.slug}/${game.slug}`">
                {{ game.title }}
                <sup>[{{ game.system.shortName }}]</sup>
                <sup v-if="game.digital">[Digital]</sup>
              </nuxt-link>
            </li>
          </ul>
        </b-col>
      </b-row>

      <b-row class="mb-4">
        <b-col>
          <h2>Recently Updated</h2>
          <ul>
            <li
              v-for="(game, index) in recentlyUpdated"
              :key="`updated-game-${index}`"
            >
              <span class="small">{{
                $dateTranslate(game.sys.publishedAt).short
              }}</span>
              -
              <nuxt-link :to="`/games/${game.system.slug}/${game.slug}`">
                {{ game.title }}
                <sup>[{{ game.system.shortName }}]</sup>
                <sup v-if="game.digital">[Digital]</sup>
              </nuxt-link>
            </li>
          </ul>
        </b-col>
      </b-row>

      <b-row class="mb-4">
        <b-col>
          <h2>Latest Additions</h2>
          <ul>
            <li v-for="(game, index) in latestGames" :key="`new-game-${index}`">
              <span class="small">{{
                $dateTranslate(game.sys.firstPublishedAt).short
              }}</span>
              -
              <nuxt-link :to="`/games/${game.system.slug}/${game.slug}`">
                {{ game.title }}
                <sup>[{{ game.system.shortName }}]</sup>
                <sup v-if="game.digital">[Digital]</sup>
              </nuxt-link>
            </li>
          </ul>
        </b-col>
      </b-row>
    </b-container>
  </main>
</template>

<script>
import { recentlyUpdatedQuery } from "~/graphql/recentlyUpdated.gql";
import { latestGamesQuery } from "~/graphql/latestGames.gql";
import { currentlyPlayingGamesQuery } from "~/graphql/currentlyPlayingGames.gql";
export default {
  async asyncData({ $graphql }) {
    let recentlyUpdated = await $graphql.default.request(recentlyUpdatedQuery);
    recentlyUpdated = recentlyUpdated.gameCollection.items;

    let latestGames = await $graphql.default.request(latestGamesQuery);
    latestGames = latestGames.gameCollection.items;

    let currentlyPlayingGames = await $graphql.default.request(
      currentlyPlayingGamesQuery
    );
    currentlyPlayingGames = currentlyPlayingGames.gameCollection.items;

    return {
      recentlyUpdated,
      latestGames,
      currentlyPlayingGames,
    };
  },
};
</script>
