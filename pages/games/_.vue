<template>
  <div>
    <b-container v-if="game">
      <b-row>
        <b-col>
          <h1>{{ game.title }}</h1>
          <ul>
            <li>
              <nuxt-link :to="`/systems/${game.system.slug}`">
                {{ game.system.title }}
              </nuxt-link>

              <GameRegionIndicator :region="game.region" />
            </li>

            <li>
              <strong>Added: </strong>
              {{ $dateTranslate(game.sys.firstPublishedAt).long }}
            </li>

            <li>
              <strong>Updated: </strong>
              {{ $dateTranslate(game.sys.publishedAt).long }}
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

            <li>
              <a :href="ebayLink" target="_blank">&#128184; Price Check</a>
            </li>
          </ul>
        </b-col>
      </b-row>

      <!-- <b-row v-if="gameData">
        <b-col>
          <div v-for="(game, index) in gameData" :key="`game-data-${index}`">
            <img v-if="game.cover" :src="game.cover" class="mt-3" />
            <p v-if="game.summary" v-html="game.summary" class="mt-3"></p>
          </div>
        </b-col>
      </b-row> -->

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
            {{ $dateTranslate(glog.sys.firstPublishedAt).short }} -
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
import { gameBySlugAndSystemQuery } from "~/graphql/gameBySlugAndSystem.gql";
export default {
  head() {
    return {
      title: `Gloves Off Games - ${this.game.title}`,
    };
  },
  data() {
    return {
      gameData: null,
    };
  },
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
    // let xhr = new XMLHttpRequest();
    // xhr.open(
    //   "POST",
    //   `/.netlify/functions/query-igdb?title=${encodeURI(
    //     JSON.stringify(this.game.title)
    //   )}&platform=${encodeURI(JSON.stringify(this.game.system.title))}`
    // );
    // xhr.onload = () => {
    //   this.gameData = JSON.parse(xhr.response);
    // };
    // xhr.send();
  },
  computed: {
    ebayLink() {
      const concat = `${this.game.title}+${this.game.system.title}`;
      const searchTerm = concat
        .replaceAll("&", "%26")
        .replaceAll(" ", "+")
        .replaceAll(":", "");
      let ebayUrl = `https://www.ebay.ca/sch/i.html?_nkw=${searchTerm}&_in_kw=1&_ex_kw=&_sacat=0&LH_Sold=1&_udlo=&_udhi=&_samilow=&_samihi=&_sadis=15&_stpos=M4V+2E9&_sargn=-1%26saslc%3D1&_salic=2&_sop=12&_dmd=1&_ipg=60&LH_Complete=1&_fosrp=1`;
      return ebayUrl;
    },
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
