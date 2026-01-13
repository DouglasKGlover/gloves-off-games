<template>
  <div>
    <SiteHero title="Systems" />
    <div class="container">
      <!-- Chart area -->
      <section class="chart-wrapper chart-panel">
        <div id="systems-totals-chart"></div>
      </section>

      <hr />

      <!-- Systems list -->
      <section>
        <SystemList :systems="allSystems" />
      </section>
    </div>
  </div>
</template>

<script setup>
import allSystemsQuery from "~/graphql/allSystems.gql";
import { ref, onMounted, nextTick } from "vue";

useHead({
  title: "Gloves Off Games - Systems",
});

const { $graphql } = useNuxtApp();
const router = useRouter();

const { data: allSystemsData } = await useAsyncData("allSystems", () =>
  $graphql.request(allSystemsQuery),
);
const allSystems = computed(
  () => allSystemsData.value?.systemCollection?.items || [],
);

// Highcharts instance
const highcharts = ref(null);

function systemTotalGamesChart() {
  if (!highcharts.value || !allSystems.value?.length) return;
  const systemsSeries = allSystems.value
    .map((system) => ({
      name: system.shortName || system.title,
      slug: system.slug,
      y: system.linkedFrom?.gameCollection?.total || 0,
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
    credits: { enabled: false },
    legend: { enabled: false },
    title: { text: null },
    tooltip: {
      pointFormat: "<b>Games</b>: {point.y}",
      backgroundColor: "rgba(0,0,0,0.85)",
      style: { color: "#ffffff", fontSize: "1.2rem" },
    },
    plotOptions: {
      column: {
        allowPointSelect: false,
        cursor: "pointer",
        dataLabels: {
          enabled: true,
          style: { color: "#ffffff", fontSize: "1.1rem", textOutline: "none" },
          format: "{point.y}",
        },
      },
      series: {
        point: {
          events: {
            click: function () {
              if (this.slug) {
                router.push(`/systems/${this.slug}`);
              }
            },
          },
        },
      },
    },
    xAxis: {
      categories: systemsNames,
      labels: { style: { color: "#ffffff", fontSize: "1.1rem" } },
      lineColor: "rgba(255,255,255,0.2)",
      tickColor: "rgba(255,255,255,0.2)",
    },
    yAxis: {
      title: { text: null },
      labels: { style: { color: "#ffffff", fontSize: "1.1rem" } },
      gridLineColor: "rgba(255,255,255,0.1)",
    },
    series: [
      {
        colorByPoint: true,
        animation: false,
        pointWidth: 14,
        data: systemsSeries,
      },
    ],
  });
}

onMounted(async () => {
  const HC = await import("highcharts/highcharts");
  highcharts.value = HC.default;
  const Accessibility = await import("highcharts/modules/accessibility");
  Accessibility.default(highcharts.value);
  await nextTick();
  systemTotalGamesChart();
});
</script>

<style scoped lang="scss">
@use "~/assets/css/breakpoints" as *;
@use "sass:map";

#systems-totals-chart {
  height: 100%;
  width: 100%;
}
</style>
