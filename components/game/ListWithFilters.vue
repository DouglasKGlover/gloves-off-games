<template>
  <b-container>
    <b-row>
      <b-col
        md="6"
        order-md="2"
        v-if="
          filterStatuses[1].options.length > 1 || filterWtbWts[1].options.length
        "
        class="mobile-no-pad"
      >
        <div id="game-filters">
          <b-container>
            <b-row>
              <b-col lg="3" class="mobile-no-pad">
                <h2>Filter</h2>
              </b-col>
              <b-col lg="2" align-self="end" class="mobile-no-pad">
                <p>{{ filteredGames.length }}/{{ games.length }}</p>
              </b-col>
            </b-row>
          </b-container>

          <b-container>
            <b-row>
              <!-- Filter by status -->
              <b-col v-if="filterStatuses[1].options.length > 1" lg="4">
                <b-form-select
                  v-model="filters.status"
                  :options="filterStatuses"
                  class="mb-4"
                ></b-form-select>
              </b-col>

              <!-- Filter by digital -->
              <b-col v-if="filterDigital[1].options.length > 1" lg="4">
                <b-form-select
                  v-model="filters.digital"
                  :options="filterDigital"
                  class="mb-4"
                ></b-form-select>
              </b-col>

              <!-- Filter by WTB/WTS -->
              <b-col v-if="filterWtbWts[1].options.length" lg="4">
                <b-form-select
                  v-model="filters.wtbWts"
                  :options="filterWtbWts"
                  class="mb-4"
                ></b-form-select>
              </b-col>
            </b-row>

            <!-- Remove filters -->
            <b-row v-if="filteredGames.length < games.length">
              <b-col>
                <button @click="removeFilters">Remove Filters</button>
              </b-col>
            </b-row>
          </b-container>
        </div>
      </b-col>

      <!-- List of games -->
      <b-col md="6" class="mobile-no-pad">
        <div
          v-for="(game, index) in loadedGames"
          :key="`game-${index}`"
          :class="game.playedStatus"
        >
          <GamePlayedStatusIndicator :status="game.playedStatus" />
          <NuxtLink :to="`/games/${game.system.slug}/${game.slug}`">
            {{ game.title }}
            <GameRegionIndicator :region="game.region" />
            <sup v-if="game.system.shortName">
              [{{ game.system.shortName }}]</sup
            >
            <sup v-if="game.digital"> [Digital]</sup>
          </NuxtLink>
        </div>

        <div class="mt-3">
          <button
            @click="loadMore()"
            v-if="loadedGames.length < filteredGames.length"
          >
            Load More
          </button>
        </div>
      </b-col>
    </b-row>
  </b-container>
</template>

<script setup>
const props = defineProps({
  games: {
    type: Array,
    required: true,
  },
});

const totalToShow = ref(999);
const filterStatuses = ref([
  {
    value: null,
    text: "By Status",
  },
  {
    label: "Statuses",
    options: [],
  },
]);
const filterDigital = ref([
  {
    value: null,
    text: "By Physical/Digital",
  },
  {
    label: "Physical/Digital",
    options: [],
  },
]);
const filterWtbWts = ref([
  {
    value: null,
    text: "By WTB/WTS",
  },
  {
    label: "Wanting to:",
    options: [],
  },
]);
const filters = ref({
  status: null,
  digital: null,
  wtbWts: null,
});

const sortArray = (array) => {
  function compare(a, b) {
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
  }
  return array.sort(compare);
};

const loadMore = () => {
  totalToShow.value = totalToShow.value + 25;
};

const removeFilters = () => {
  filters.value = {
    status: null,
    digital: null,
    wtbWts: null,
  };
};

const filteredGames = computed(() => {
  let filtered = props.games;
  if (filters.value.wtbWts) {
    filtered = filtered.filter((game) => game.wtbWts == filters.value.wtbWts);
  }
  if (filters.value.status) {
    filtered = filtered.filter(
      (game) => game.playedStatus == filters.value.status,
    );
  }
  if (filters.value.digital !== null) {
    filtered = filtered.filter((game) => {
      if (game.digital && filters.value.digital) {
        return true;
      } else if (!game.digital && !filters.value.digital) {
        return true;
      }
    });
  }
  return filtered;
});

const loadedGames = computed(() => {
  return filteredGames.value.slice(0, totalToShow.value);
});

onMounted(() => {
  // Find all existing statuses and add to filter
  let gameArr = [];
  let filterArray = [];
  props.games.filter(function (game) {
    let i = gameArr.findIndex((x) => x.playedStatus == game.playedStatus);
    if (i <= -1) {
      gameArr.push(game);
      filterArray.push(game.playedStatus);
    }
    return null;
  });
  filterStatuses.value[1].options = filterArray.sort();

  // Find any digital games and add to filter if found
  gameArr = [];
  filterArray = [];
  props.games.filter(function (game) {
    let i = gameArr.findIndex((x) => x.digital == game.digital);
    if (i <= -1 && game.digital) {
      gameArr.push(game);
      filterArray.push({ text: "Digital", value: true });
      filterArray.push({ text: "Physical", value: false });
    }
    return null;
  });
  filterDigital.value[1].options = filterArray.sort();

  // Find any games set to WTB/WTS and add to a filter if found
  gameArr = [];
  filterArray = [];
  props.games.filter(function (game) {
    let i = gameArr.findIndex((x) => x.wtbWts == game.wtbWts);
    if (i <= -1 && game.wtbWts !== null) {
      gameArr.push(game);
      switch (game.wtbWts) {
        case "WTB":
          filterArray.push({ text: "Buy", value: "WTB" });
          break;
        case "WTS":
          filterArray.push({ text: "Sell", value: "WTS" });
          break;
      }
    }
    return null;
  });
  filterWtbWts.value[1].options = filterArray.sort();
});
</script>

<style lang="scss">
.Abandoned a {
  text-decoration: line-through;
}
</style>
