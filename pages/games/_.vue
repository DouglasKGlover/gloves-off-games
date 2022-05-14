<template>
  <div>
    <b-container>
      <b-row>
        <b-col>
          <h1>{{ game.title }}</h1>
          <ul>
            <li>
              <nuxt-link :to="`/systems/${game.system.slug}`">
                {{ game.system.title }}
              </nuxt-link>
            </li>

            <li>
              <strong>Status: </strong>
              <GamePlayedStatusIndicator :status="game.playedStatus" />
              {{ game.playedStatus }}
            </li>

            <li v-if="game.wtbWts" :class="game.wtbWts.toLowerCase()">
              <strong v-if="game.wtbWts == 'WTS'">For sale!</strong>
            </li>

            <li v-if="game.requirementsForCompletion">
              <strong>Requirements for Completion:</strong>
              {{ game.requirementsForCompletion }}
            </li>
          </ul>
        </b-col>
      </b-row>

      <div v-if="game.photosCollection.items.length" class="mt-5">
        <b-row>
          <b-col>
            <h2>Photos</h2>
          </b-col>
        </b-row>

        <b-row>
          <b-col
            cols="4"
            md="2"
            v-for="(photo, index) in game.photosCollection.items"
            :key="`game-photo-${index}`"
            class="mb-2"
          >
            <b-button v-b-modal="`photo-modal-${index}`" class="image-button">
              <b-img fluid :src="photo.thumbnail" width="300" height="200" />
            </b-button>

            <b-modal :id="`photo-modal-${index}`" hide-footer size="xl">
              <b-img :src="photo.url" fluid />
            </b-modal>
          </b-col>
        </b-row>
      </div>

      <b-row v-if="glogs.length" class="mt-4">
        <b-col>
          <h2>Game Log<span v-if="glogs.length > 1">s</span></h2>
          <div
            class="game-log-link"
            v-for="(glog, index) in glogs"
            :key="`game-log-${index}`"
          >
            {{ $dateTranslate(glog.sys.firstPublishedAt) }} -
            <nuxt-link :to="`/glog/${glog.slug}`">
              {{ glog.title }}
            </nuxt-link>
          </div>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
import Axios from "axios";
import { gameBySlugAndSystemQuery } from "~/graphql/gameBySlugAndSystem.gql";
export default {
  async asyncData({ $graphql, params }) {
    const path = (fullPath) => {
      return {
        slug: fullPath.substring(fullPath.lastIndexOf("/") + 1),
        system: fullPath.substring(0, fullPath.lastIndexOf("/")),
      };
    };
    let game = await $graphql.default.request(gameBySlugAndSystemQuery, {
      slug: path(params.pathMatch).slug,
      system: path(params.pathMatch).system,
    });
    let glogs = game.gameLogCollection.items;
    game = game.gameCollection.items[0];

    return {
      game,
      glogs,
    };
  },
  mounted() {
    const result = await Axios.post("/.netlify/functions/query-igdb", request, {
      data: "naught",
    }).then((res) => {
      console.log(res);
    });
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
