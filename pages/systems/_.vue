<template>
  <b-container>
    <b-row>
      <b-col>
        <h1>{{ system.title }}</h1>
        <p v-if="system.manufacturer">{{ system.manufacturer.title }}</p>

        <hr />

        <b-row>
          <b-col md="3">
            <h2>Status Overview</h2>
            <p><b>Total Games:</b> 123</p>
          </b-col>

          <b-col md="6">
            <div id="games-status-chart"></div>
          </b-col>
        </b-row>

        <hr />

        <GameListWithFilters :games="games" />
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import Highcharts from "highcharts";
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

    // iterate over the games and add their statuses to the gameStatuses object
    let gameStatuses = {};
    games.forEach((game) => {
      if (gameStatuses[game.playedStatus] == null) {
        gameStatuses[game.playedStatus] = 1;
      } else {
        gameStatuses[game.playedStatus] += 1;
      }
    });

    let gameStatusSeries = [];
    for (let gameStatus in gameStatuses) {
      let color = "";
      if (gameStatus == "Untouched") {
        color = "#DB4C40";
      } else if (gameStatus == "Unfinished") {
        color = "#FCD581";
      } else if (gameStatus == "Beaten") {
        color = "#4B8F8C";
      } else if (gameStatus == "Completed") {
        color = "#FFB940";
      }

      gameStatusSeries.push({
        name: gameStatus,
        y: gameStatuses[gameStatus],
        color: color,
      });
    }

    return {
      system,
      games,
      gameStatusSeries,
    };
  },
  methods: {
    statusChart() {
      Highcharts.chart("games-status-chart", {
        chart: {
          backgroundColor: "transparent",
          plotBackgroundColor: null,
          plotBorderWidth: null,
          plotShadow: false,
          type: "pie",
        },
        title: {
          text: null,
        },
        tooltip: {
          pointFormat: "Games: <b>{point.y}</b>",
        },
        accessibility: {
          point: {
            valueSuffix: "%",
          },
        },
        plotOptions: {
          pie: {
            allowPointSelect: true,
            cursor: "pointer",
            dataLabels: {
              enabled: true,
              format: "<b>{point.name}</b>: {point.percentage:.1f} %",
            },
          },
        },
        series: [
          {
            name: "Statuses",
            colorByPoint: true,
            animation: false,
            data: this.gameStatusSeries,
          },
        ],
      });
    },
  },
  mounted() {
    this.statusChart();
  },
};
</script>

<style lang="scss">
#system-header {
  p {
    margin: 0;
  }
}

#games-status-chart {
  height: 150px;
}
</style>
