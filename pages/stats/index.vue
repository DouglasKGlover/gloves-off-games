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

      <b-row>
        <b-col>
          <h2>Genres</h2>
          <div id="genres-chart"></div>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
import Highcharts from "highcharts";
import { statistics } from "~/graphql/statistics.gql";
import { statisticsGenres } from "~/graphql/statistics-genres.gql";
export default {
  head() {
    return {
      title: "Gloves Off Games - Stats",
    };
  },
  async asyncData({ $graphql, params }) {
    let stats = await $graphql.default.request(statistics);
    let statsGenres = await $graphql.default.request(statisticsGenres);
    let genresCollection = [];
    let genreCount = {};

    statsGenres.genres.items.forEach((genreCollection) => {
      if (genreCollection.igdbGenres) {
        genreCollection.igdbGenres.forEach((genre) => {
          genresCollection.push(genre);
        });
      }
    });

    // Count the total number of instances of each genre
    genresCollection.forEach((genre) => {
      genreCount[genre] = (genreCount[genre] || 0) + 1;
    });

    // Create a series for HighCharts using the genre data
    let genresSeries = [];
    for (let genre in genreCount) {
      genresSeries.push({
        name: genre,
        y: genreCount[genre],
      });
    }

    return {
      stats,
      genresSeries,
    };
  },
  methods: {
    gameStatusChart() {
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
          pointFormat: "{series.name}: <b>{point.y}</b>",
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
                color: "#FFB940",
              },
              {
                name: "Beaten",
                y: this.stats.gamesBeaten.total,
                color: "#4B8F8C",
              },
              {
                name: "Completed",
                y: this.stats.gamesCompleted.total,
                color: "#FCD581",
              },
            ],
          },
        ],
      });
    },
    systemTotalGamesChart() {
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
          pointFormat: "<b>Games</b>: {point.y}",
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
    genresChart() {
      Highcharts.chart("genres-chart", {
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
            name: "Genres",
            colorByPoint: true,
            animation: false,
            data: this.genresSeries,
          },
        ],
      });
    },
  },
  mounted() {
    this.gameStatusChart();
    this.systemTotalGamesChart();
    this.genresChart();
  },
};
</script>

<style>
.highcharts-credits {
  display: none;
}
</style>
