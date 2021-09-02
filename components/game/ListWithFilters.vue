<template>
  <b-container>
    <b-row>
      <b-col md="6" order-md="2" v-if="filterStatuses[1].options.length > 1">
        <div id="game-filters">
          <h2>Filter</h2>

          <!-- Filter by status -->
          <b-container v-if="filterStatuses[1].options.length > 1">
            <b-row>
              <b-col md="4" class="pl-0">
                <b-form-select
                  v-model="filters.status"
                  :options="filterStatuses"
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
      filters: {
        status: null,
      },
    };
  },
  mounted() {
    const _self = this;
    var gameArr = [];
    this.games.filter(function (item) {
      var i = gameArr.findIndex((x) => x.playedStatus == item.playedStatus);
      if (i <= -1) {
        gameArr.push(item);
        _self.filterStatuses[1].options.push(item.playedStatus);
      }
      return null;
    });
  },
  computed: {
    filteredGames() {
      let filteredGames = this.games;
      if (this.filters.status == null) {
        return filteredGames;
      } else {
        return filteredGames.filter(
          (game) => game.playedStatus == this.filters.status
        );
      }
    },
  },
};
</script>

<style></style>
