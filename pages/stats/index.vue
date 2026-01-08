<template>
  <div>
    <div class="container">
      <div>
        <div>
          <h1>Stats</h1>
        </div>
      </div>

      <div>
        <div>
          <h2>Games</h2>
          <p><b>Total:</b> {{ stats.games.total }}</p>
          <div id="games-played-status-chart"></div>
        </div>

        <div>
          <h2>Systems</h2>
          <p><b>Total:</b> {{ stats.systems.total }}</p>
          <div id="systems-totals-chart"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from "vue";
import statistics from "~/graphql/statistics.gql";

useHead({ title: "Gloves Off Games - Stats" });

const highcharts = ref(null);

// GraphQL client from custom plugin
const { $graphql } = useNuxtApp();

// Fetch stats at build/runtime
const { data: stats } = await useAsyncData("stats", () =>
  $graphql.request(statistics),
);

function gameStatusChart() {
  if (!highcharts.value || !stats?.value) return;
  highcharts.value.chart("games-played-status-chart", {
    chart: {
      backgroundColor: "transparent",
      plotBackgroundColor: null,
      plotBorderWidth: null,
      plotShadow: false,
      type: "pie",
    },
    title: { text: null },
    tooltip: { pointFormat: "{series.name}: <b>{point.y}</b>" },
    accessibility: { point: { valueSuffix: "%" } },
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
            y: stats.value.gamesUntouched.total,
            color: "#AAAAAA",
          },
          {
            name: "Unfinished",
            y: stats.value.gamesUnfinished.total,
            color: "#FFB940",
          },
          {
            name: "Beaten",
            y: stats.value.gamesBeaten.total,
            color: "#4B8F8C",
          },
          {
            name: "Completed",
            y: stats.value.gamesCompleted.total,
            color: "#FCD581",
          },
          {
            name: "Abandoned",
            y: stats.value.gamesAbandoned.total,
            color: "#DB4C40",
          },
        ],
      },
    ],
  });
}

function systemTotalGamesChart() {
  if (!highcharts.value || !stats?.value) return;
  const systemsSeries = stats.value.systems.items
    .map((system) => ({
      name: system.shortName,
      y: system.linkedFrom.gameCollection.total,
    }))
    .sort((a, b) => b.y - a.y);

  const systemsNames = systemsSeries.map((s) => s.name);

  highcharts.value.chart("systems-totals-chart", {
    chart: {
      backgroundColor: "transparent",
      plotBackgroundColor: null,
      plotBorderWidth: null,
      plotShadow: false,
      type: "column",
    },
    title: { text: null },
    tooltip: { pointFormat: "<b>Games</b>: {point.y}" },
    plotOptions: {
      bar: {
        allowPointSelect: false,
        cursor: "pointer",
        dataLabels: { enabled: true, format: "<b>{point.name}</b>: {point.y}" },
      },
    },
    xAxis: { categories: systemsNames },
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
}

onMounted(async () => {
  // Client-only Highcharts
  const HC = await import("highcharts/highcharts");
  highcharts.value = HC.default;
  const Accessibility = await import("highcharts/modules/accessibility");
  Accessibility.default(highcharts.value);

  await nextTick();
  gameStatusChart();
  systemTotalGamesChart();
});
</script>
