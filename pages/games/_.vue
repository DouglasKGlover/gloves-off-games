<template>
  <div>
    <b-container v-if="game">
      <b-row>
        <b-col>
          <!-- Title -->
          <h1>{{ game.title }}</h1>

          <!-- Platform -->
          <h2>
            <nuxt-link :to="`/systems/${game.system.slug}`">
              {{ game.system.title }}
            </nuxt-link>
          </h2>

          <!-- Overview -->
          <div class="mt-4">
            <h3>Overview</h3>

            <ul>
              <li>
                <GameRegionIndicator :region="game.region" />
              </li>
              <li>
                <strong>Requirements for Completion:</strong>
                {{ game.requirementsForCompletion }}
              </li>

              <li>
                <strong>Played Status: </strong>
                <GamePlayedStatusIndicator :status="game.playedStatus" />{{
                  game.playedStatus
                }}
              </li>

              <li>
                <a :href="ebayLink" target="_blank">&#128184; Price Check</a>
              </li>

              <li v-if="game.wtbWts" :class="game.wtbWts.toLowerCase()">
                <strong v-if="game.wtbWts == 'WTS'">For sale!</strong>
              </li>
            </ul>

            <p></p>
          </div>

          <!-- Photos -->
          <div v-if="game.photosCollection.items.length" class="mt-4">
            <h3>Photos</h3>

            <b-row>
              <b-col
                cols="4"
                md="2"
                v-for="(photo, index) in game.photosCollection.items"
                :key="`game-photo-${index}`"
                class="mb-2"
              >
                <b-button
                  v-b-modal="`photo-modal-${index}`"
                  class="image-button"
                >
                  <b-img
                    fluid
                    :src="photo.thumbnail"
                    width="300"
                    height="200"
                  />
                </b-button>

                <b-modal :id="`photo-modal-${index}`" hide-footer size="xl">
                  <b-img :src="photo.url" fluid />
                </b-modal>
              </b-col>
            </b-row>
          </div>

          <!-- Game Logs -->
          <div v-if="glogs.length" class="mt-4">
            <h3>Game Log<span v-if="glogs.length > 1">s</span></h3>
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
          </div>

          <!-- Details -->
          <div class="mt-4">
            <h3>Details</h3>

            <ul>
              <li v-if="game.igdbReleaseDate">
                <strong>Released: </strong>
                {{ $dateTranslate(game.igdbReleaseDate).long }}
              </li>

              <li>
                <strong>Added: </strong>
                {{ $dateTranslate(game.sys.firstPublishedAt).long }}
              </li>

              <li>
                <strong>Updated: </strong>
                {{ $dateTranslate(game.sys.publishedAt).long }}
              </li>

              <li v-if="game.igdbGenres">
                <strong>Genres: </strong>
                <span
                  v-for="(genre, index) in game.igdbGenres"
                  :key="`genre-${index}`"
                >
                  {{ genre
                  }}<span v-if="index < game.igdbGenres.length - 1">, </span>
                </span>
              </li>

              <li v-if="game.igdbThemes">
                <strong>Themes: </strong>
                <span
                  v-for="(theme, index) in game.igdbThemes"
                  :key="`theme-${index}`"
                >
                  {{ theme
                  }}<span v-if="index < game.igdbThemes.length - 1">, </span>
                </span>
              </li>

              <li v-if="game.igdbDevelopers">
                <strong>Companies Involved: </strong>
                <span
                  v-for="(developer, index) in game.igdbDevelopers"
                  :key="`developer-${index}`"
                >
                  {{ developer
                  }}<span v-if="index < game.igdbDevelopers.length - 1"
                    >,
                  </span>
                </span>
              </li>

              <li class="mt-4" v-if="game.igdbSummary">
                <h4>Summary:</h4>
                <p>
                  {{ game.igdbSummary }}
                </p>
              </li>

              <li class="mt-2" v-if="game.igdbStoryline">
                <h4>Storyline:</h4>
                <p>
                  {{ game.igdbStoryline }}
                </p>
              </li>
            </ul>
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
      title: `Gloves Off Games - ${this.game.title} (${this.game.system.title})`,
    };
  },
  data() {
    return {
      gameData: null,
    };
  },
  mounted() {
    console.log(game.igdbStoryline);
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
