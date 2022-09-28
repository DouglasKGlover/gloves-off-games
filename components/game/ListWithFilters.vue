<template>
  <b-container>
    <b-row>
      <b-col
        md="6"
        order-md="2"
        v-if="
          filterStatuses[1].options.length > 1 || filterWtbWts[1].options.length
        "
        class="mobile-no-pad"
      >
        <div id="game-filters">
          <b-container>
            <b-row>
              <b-col lg="3" class="mobile-no-pad">
                <h2>Filter</h2>
              </b-col>
              <b-col lg="2" align-self="end" class="mobile-no-pad">
                <p>{{ filteredGames.length }}/{{ games.length }}</p>
              </b-col>
            </b-row>
          </b-container>

          <b-container>
            <b-row>
              <!-- Filter by status -->
              <b-col v-if="filterStatuses[1].options.length > 1" lg="4">
                <b-form-select
                  v-model="filters.status"
                  :options="filterStatuses"
                  class="mb-4"
                ></b-form-select>
              </b-col>

              <!-- Filter by digital -->
              <b-col v-if="filterDigital[1].options.length > 1" lg="4">
                <b-form-select
                  v-model="filters.digital"
                  :options="filterDigital"
                  class="mb-4"
                ></b-form-select>
              </b-col>

              <!-- Filter by WTB/WTS -->
              <b-col v-if="filterWtbWts[1].options.length" lg="4">
                <b-form-select
                  v-model="filters.wtbWts"
                  :options="filterWtbWts"
                  class="mb-4"
                ></b-form-select>
              </b-col>
            </b-row>

            <!-- Remove filters -->
            <b-row v-if="filteredGames.length < games.length">
              <b-col>
                <button @click="removeFilters">Remove Filters</button>
              </b-col>
            </b-row>
          </b-container>
        </div>
      </b-col>

      <!-- List of games -->
      <b-col md="6" class="mobile-no-pad">
        <div v-for="(game, index) in loadedGames" :key="`game-${index}`">
          <GamePlayedStatusIndicator :status="game.playedStatus" />
          <nuxt-link :to="`/games/${game.system.slug}/${game.slug}`">
            {{ game.title }}
            <GameRegionIndicator :region="game.region" />
            <sup v-if="game.system.shortName">
              [{{ game.system.shortName }}]</sup
            >
            <sup v-if="game.digital"> [Digital]</sup>
          </nuxt-link>
        </div>

        <div class="mt-3">
          <button
            @click="loadMore()"
            v-if="loadedGames.length < filteredGames.length"
          >
            Load More
          </button>
        </div>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
export default {
  props: {
    games: Array,
  },
  data() {
    return {
      totalToShow: 999,
      filterStatuses: [
        {
          value: null,
          text: "By Status",
        },
        {
          label: "Statuses",
          options: [],
        },
      ],
      filterDigital: [
        {
          value: null,
          text: "By Physical/Digital",
        },
        {
          label: "Physical/Digital",
          options: [],
        },
      ],
      filterWtbWts: [
        {
          value: null,
          text: "By WTB/WTS",
        },
        {
          label: "Wanting to:",
          options: [],
        },
      ],
      filters: {
        status: null,
        digital: null,
        wtbWts: null,
      },
    };
  },
  methods: {
    sortArray(array) {
      function compare(a, b) {
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
      }
      return array.sort(compare);
    },
    loadMore() {
      this.totalToShow = this.totalToShow + 25;
    },
    removeFilters() {
      this.filters = {
        status: null,
        digital: null,
        wtbWts: null,
      };
    },
  },
  mounted() {
    const _self = this;

    // Find all existing statuses and add to filter
    let gameArr = [];
    let filterArray = [];
    this.games.filter(function (game) {
      let i = gameArr.findIndex((x) => x.playedStatus == game.playedStatus);
      if (i <= -1) {
        gameArr.push(game);
        filterArray.push(game.playedStatus);
      }
      return null;
    });
    _self.filterStatuses[1].options = filterArray.sort();

    // Find any digital games and add to filter if found
    gameArr = [];
    filterArray = [];
    this.games.filter(function (game) {
      let i = gameArr.findIndex((x) => x.digital == game.digital);
      if (i <= -1 && game.digital) {
        gameArr.push(game);
        filterArray.push({ text: "Digital", value: true });
        filterArray.push({ text: "Physical", value: false });
      }
      return null;
    });
    _self.filterDigital[1].options = filterArray.sort();

    // Find any games set to WTB/WTS and add to a filter if found
    gameArr = [];
    filterArray = [];
    this.games.filter(function (game) {
      let i = gameArr.findIndex((x) => x.wtbWts == game.wtbWts);
      if (i <= -1 && game.wtbWts !== null) {
        gameArr.push(game);
        switch (game.wtbWts) {
          case "WTB":
            filterArray.push({ text: "Buy", value: "WTB" });
            break;
          case "WTS":
            filterArray.push({ text: "Sell", value: "WTS" });
            break;
        }
      }
      return null;
    });
    _self.filterWtbWts[1].options = filterArray.sort();
  },
  computed: {
    filteredGames() {
      let filteredGames = this.games;
      if (this.filters.wtbWts) {
        filteredGames = filteredGames.filter(
          (game) => game.wtbWts == this.filters.wtbWts
        );
      }
      if (this.filters.status) {
        filteredGames = filteredGames.filter(
          (game) => game.playedStatus == this.filters.status
        );
      }
      if (this.filters.digital !== null) {
        filteredGames = filteredGames.filter((game) => {
          if (game.digital && this.filters.digital) {
            return true;
          } else if (!game.digital && !this.filters.digital) {
            return true;
          }
        });
      }
      return filteredGames;
    },
    loadedGames() {
      let loadedGames = [];
      this.filteredGames.slice([0], [this.totalToShow]).map((item, i) => {
        loadedGames.push(item);
      });
      return loadedGames;
    },
  },
};
</script>

<style></style>
