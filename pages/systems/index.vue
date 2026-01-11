<template>
  <div class="container">
    <h1>Systems</h1>
    <p>Every single one of them.</p>

    <hr />

    <div class="grid">
      <!-- Systems list -->
      <div class="col-span-12 col-span-md-6">
        <ul>
          <li
            v-for="(system, index) in allSystems"
            :key="`systems-list-item-${index}`"
          >
            <NuxtLink :to="`/systems/${system.slug}`">
              {{ system.title }}
              <sup> [{{ system.linkedFrom.gameCollection.total }}]</sup>
            </NuxtLink>
          </li>
        </ul>
      </div>

      <!-- Chart area -->
      <div
        class="col-span-12 col-span-md-6"
        aria-labelledby="systems-chart-heading"
      >
        <h2 id="systems-chart-heading">Systems by total games</h2>
        <div id="systems-totals-chart" class="chart-panel"></div>
      </div>
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

.chart-panel {
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(8px);
  border-radius: 0.5rem;
  border: 0.2rem solid rgba(255, 255, 255, 0.08);
  padding: $spacing-default;
  box-shadow: 0 0.8rem 1.8rem rgba(0, 0, 0, 0.25);
}
</style>
