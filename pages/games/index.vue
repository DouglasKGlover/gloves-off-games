<template>
  <main>
    <SiteHero title="Games" />
    <div class="container">
      <div>
        <div>
          <section class="chart-wrapper chart-panel">
            <div id="games-status-chart"></div>
          </section>

          <hr />

          <GameListWithFilters :games="allGames" ref="gameListRef" />
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import allGamesQuery from "~/graphql/allGames.gql";

useHead({ title: "Gloves Off Games - Games" });

const { $graphql } = useNuxtApp();
const gameListRef = ref(null);
const chartInstance = ref(null);

const { data: allGamesData } = await useAsyncData("allGames", () =>
  $graphql.request(allGamesQuery),
);
const allGames = computed(
  () => allGamesData.value?.gameCollection?.items || [],
);

// Calculate game statuses for chart
const gameStatusSeries = computed(() => {
  const gameStatuses = {};
  allGames.value.forEach((game) => {
    if (gameStatuses[game.playedStatus] == null) {
      gameStatuses[game.playedStatus] = 1;
    } else {
      gameStatuses[game.playedStatus] += 1;
    }
  });

  const series = [];
  for (let gameStatus in gameStatuses) {
    let color = "";
    if (gameStatus == "Unfinished") {
      color = "#f24862"; // Red for Unfinished
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
