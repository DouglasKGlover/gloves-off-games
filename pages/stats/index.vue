<template>
  <div>
    <b-container>
      <b-row>
        <b-col>
          <h1>Stats</h1>
        </b-col>
      </b-row>

      <b-row>
        <b-col md="6">
          <h2>Games</h2>
          <p><b>Total:</b> {{ stats.games.total }}</p>
          <div id="games-played-status-chart"></div>
        </b-col>

        <b-col md="6">
          <h2>Systems</h2>
          <p><b>Total:</b> {{ stats.systems.total }}</p>
          <div id="systems-totals-chart"></div>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
import Highcharts from "highcharts";
import { statistics } from "~/graphql/statistics.gql";
export default {
  async asyncData({ $graphql, params }) {
    let stats = await $graphql.default.request(statistics);

    return {
      stats,
    };
  },
  methods: {
    gameStatusPieChart() {
      Highcharts.chart("games-played-status-chart", {
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
          pointFormat: "{series.name}: <b>{point.percentage:.1f}%</b>",
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
            name: "Games",
            colorByPoint: true,
            animation: false,
            data: [
              {
                name: "Untouched",
                y: this.stats.gamesUntouched.total,
                color: "#DB4C40",
              },
              {
                name: "Unfinished",
                y: this.stats.gamesUnfinished.total,
                color: "#FCD581",
              },
              {
                name: "Beaten",
                y: this.stats.gamesBeaten.total,
                color: "#4B8F8C",
              },
              {
                name: "Completed",
                y: this.stats.gamesCompleted.total,
                color: "#FFB940",
              },
            ],
          },
        ],
      });
    },
    systemTotalGamesPieChart() {
      // Get all the systems and their total games
      let systemsSeries = [];
      this.stats.systems.items.forEach((system) => {
        systemsSeries.push({
          name: system.shortName,
          y: system.linkedFrom.gameCollection.total,
        });
      });
      // Sort the systems by total games
      systemsSeries.sort((a, b) => {
        return b.y - a.y;
      });

      // Create an array of just the names of the systems
      let systemsNames = [];
      systemsSeries.forEach((system) => {
        systemsNames.push(system.name);
      });

      // Create the chart
      Highcharts.chart("systems-totals-chart", {
        chart: {
          backgroundColor: "transparent",
          plotBackgroundColor: null,
          plotBorderWidth: null,
          plotShadow: false,
          type: "column",
        },
        title: {
          text: null,
        },
        tooltip: {
          pointFormat: "<b>{point.name}</b>: {point.y}",
          valueSuffix: " games",
        },
        plotOptions: {
          bar: {
            allowPointSelect: false,
            cursor: "pointer",
            dataLabels: {
              enabled: true,
              format: "<b>{point.name}</b>: {point.y}",
            },
          },
        },
        xAxis: {
          categories: systemsNames,
        },
        series: [
          {
            name: "Systems by total games",
            colorByPoint: true,
            animation: false,
            pointWidth: 14,
            data: systemsSeries,
          },
        ],
      });
    },
  },
  mounted() {
    this.gameStatusPieChart();
    this.systemTotalGamesPieChart();
  },
};
</script>

<style>
.highcharts-credits {
  display: none;
}
</style>
