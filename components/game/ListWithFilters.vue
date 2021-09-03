<template>
  <b-container>
    <b-row>
      <b-col
        md="6"
        order-md="2"
        v-if="
          filterStatuses[1].options.length > 1 || filterWtbWts[1].options.length
        "
      >
        <div id="game-filters">
          <h2>Filter</h2>

          <b-container>
            <b-row>
              <!-- Filter by status -->
              <b-col
                v-if="filterStatuses[1].options.length > 1"
                md="4"
                class="pl-0"
              >
                <b-form-select
                  v-model="filters.status"
                  :options="filterStatuses"
                  class="mb-4"
                ></b-form-select>
              </b-col>

              <!-- Filter by WTB/WTS -->
              <b-col v-if="filterWtbWts[1].options.length" md="4" class="pl-0">
                <b-form-select
                  v-model="filters.wtbWts"
                  :options="filterWtbWts"
                  class="mb-4"
                ></b-form-select>
              </b-col>
            </b-row>
          </b-container>
        </div>
      </b-col>

      <!-- List of games -->
      <b-col md="6">
        <div v-for="(game, index) in filteredGames">
          <GamePlayedStatusIndicator :status="game.playedStatus" />
          <nuxt-link :to="`/games/${game.slug}`">
            {{ game.title }}
            <sup v-if="game.system"> [{{ game.system.shortName }}]</sup>
          </nuxt-link>
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
  },
  mounted() {
    const _self = this;

    // Find all existing statuses and add to filter
    let gameArr = [];
    let filterArray = [];
    this.games.filter(function (game) {
      var i = gameArr.findIndex((x) => x.playedStatus == game.playedStatus);
      if (i <= -1) {
        gameArr.push(game);
        filterArray.push(game.playedStatus);
      }
      return null;
    });
    _self.filterStatuses[1].options = filterArray.sort();

    // Find any games set to WTB/WTS and add to a filter if found
    gameArr = [];
    filterArray = [];
    this.games.filter(function (game) {
      var i = gameArr.findIndex((x) => x.wtbWts == game.wtbWts);
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
      return filteredGames;
    },
  },
};
</script>

<style></style>
