<template>
  <div class="container">
    <h1>{{ system.title }}</h1>
    <p v-if="system.manufacturer">{{ system.manufacturer.title }}</p>

    <hr />

    <section class="chart-wrapper chart-panel">
      <div id="games-status-chart"></div>
    </section>

    <hr />

    <GameListWithFilters :games="games" ref="gameListRef" />
  </div>
</template>

<script setup>
import systemBySlugQuery from "~/graphql/systemBySlug.gql";
import gamesBySystemQuery from "~/graphql/gamesBySystem.gql";

const route = useRoute();
const gameListRef = ref(null);

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

const chartInstance = ref(null);

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

    chartInstance.value = highcharts.chart("games-status-chart", {
      chart: {
        backgroundColor: "transparent",
        plotBackgroundColor: null,
        plotBorderWidth: null,
        plotShadow: false,
        type: "pie",
      },
      credits: { enabled: false },
      title: {
        text: null,
      },
      tooltip: {
        pointFormat: "Games: <b>{point.y}</b>",
        backgroundColor: "rgba(0,0,0,0.85)",
        style: { color: "#ffffff", fontSize: "1.2rem" },
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
            style: {
              color: "#ffffff",
              fontSize: "1.1rem",
              textOutline: "none",
            },
            format: "<b>{point.name}</b>: {point.percentage:.1f} %",
          },
        },
        series: {
          point: {
            events: {
              click: function () {
                if (gameListRef.value) {
                  gameListRef.value.filters.status = this.name;
                }
              },
            },
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

// Watch for filter changes and update chart highlighting
watch(
  () => gameListRef.value?.filters.status,
  (newStatus) => {
    if (!chartInstance.value) return;

    const chart = chartInstance.value;
    const points = chart.series[0].points;

    if (newStatus) {
      // Dim all points except the selected one
      points.forEach((point) => {
        if (point.name === newStatus) {
          point.update({ opacity: 1 }, false);
        } else {
          point.update({ opacity: 0.3 }, false);
        }
      });
    } else {
      // Reset all points to full opacity
      points.forEach((point) => {
        point.update({ opacity: 1 }, false);
      });
    }

    chart.redraw();
  },
);
</script>

<style scoped>
#games-status-chart {
  height: 100%;
  width: 100%;
}
</style>
