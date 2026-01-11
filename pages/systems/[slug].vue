<template>
  <div class="container">
    <div>
      <div>
        <h1>{{ system.title }}</h1>
        <p v-if="system.manufacturer">{{ system.manufacturer.title }}</p>

        <hr />

        <div>
          <div>
            <h2>Status Overview</h2>
            <p><b>Total Games:</b> {{ games.length }}</p>
          </div>

          <div>
            <div id="games-status-chart"></div>
          </div>
        </div>

        <hr />

        <GameListWithFilters :games="games" />
      </div>
    </div>
  </div>
</template>

<script setup>
import systemBySlugQuery from "~/graphql/systemBySlug.gql";
import gamesBySystemQuery from "~/graphql/gamesBySystem.gql";

const route = useRoute();

const { $graphql } = useNuxtApp();

// Fetch system data
const { data: systemData } = await useAsyncData(
  () => `system-${route.params.slug}`,
  () =>
    $graphql.request(systemBySlugQuery, {
      slug: route.params.slug,
    }),
);

const system = computed(
  () => systemData.value?.systemCollection?.items?.[0] || {},
);

useHead(() => ({
  title: system.value?.title
    ? `Gloves Off Games - ${system.value.title}`
    : "Gloves Off Games - System",
}));

// Fetch games for system
const { data: gamesData } = await useAsyncData(
  () => `gamesBySystem-${route.params.slug}`,
  () =>
    $graphql.request(gamesBySystemQuery, {
      system: route.params.slug,
    }),
);

const games = computed(() => gamesData.value?.gameCollection?.items || []);

// Calculate game statuses for chart
const gameStatusSeries = computed(() => {
  const gameStatuses = {};
  games.value.forEach((game) => {
    if (gameStatuses[game.playedStatus] == null) {
      gameStatuses[game.playedStatus] = 1;
    } else {
      gameStatuses[game.playedStatus] += 1;
    }
  });

  const series = [];
  for (let gameStatus in gameStatuses) {
    let color = "";
    if (gameStatus == "Untouched") {
      color = "#DB4C40";
    } else if (gameStatus == "Unfinished") {
      color = "#FFB940";
    } else if (gameStatus == "Beaten") {
      color = "#4B8F8C";
    } else if (gameStatus == "Completed") {
      color = "#FCD581";
    }

    series.push({
      name: gameStatus,
      y: gameStatuses[gameStatus],
      color: color,
    });
  }

  return series;
});

// Initialize Highcharts chart on mount
onMounted(async () => {
  if (process.client) {
    const HC = await import("highcharts/highcharts");
    const highcharts = HC.default;

    const Accessibility = await import("highcharts/modules/accessibility");
    Accessibility.default(highcharts);

    highcharts.chart("games-status-chart", {
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
          data: gameStatusSeries.value,
        },
      ],
    });
  }
});
</script>
