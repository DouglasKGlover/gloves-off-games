<template>
  <div class="container">
    <div class="game-list-wrapper">
      <div
        v-if="
          filterStatuses[1].options.length > 1 || filterWtbWts[1].options.length
        "
        class="mobile-no-pad filters-column"
      >
        <div id="game-filters">
          <div class="container">
            <div class="filter-header">
              <div class="mobile-no-pad">
                <h2>Filter</h2>
              </div>
              <div class="mobile-no-pad filter-count">
                <p>{{ filteredGames.length }}/{{ games.length }}</p>
              </div>
            </div>
          </div>

          <div class="container">
            <div class="filter-options">
              <!-- Filter by status -->
              <div
                v-if="filterStatuses[1].options.length > 1"
                class="filter-item"
              >
                <select v-model="filters.status" class="filter-select">
                  <optgroup
                    v-for="(group, index) in filterStatuses"
                    :key="index"
                    :label="group.label"
                  >
                    <option v-if="!group.label" :value="group.value">
                      {{ group.text }}
                    </option>
                    <option
                      v-for="(option, optIndex) in group.options"
                      :key="optIndex"
                      :value="option"
                    >
                      {{ option }}
                    </option>
                  </optgroup>
                </select>
              </div>

              <!-- Filter by digital -->
              <div
                v-if="filterDigital[1].options.length > 1"
                class="filter-item"
              >
                <select v-model="filters.digital" class="filter-select">
                  <optgroup
                    v-for="(group, index) in filterDigital"
                    :key="index"
                    :label="group.label"
                  >
                    <option v-if="!group.label" :value="group.value">
                      {{ group.text }}
                    </option>
                    <option
                      v-for="(option, optIndex) in group.options"
                      :key="optIndex"
                      :value="option.value"
                    >
                      {{ option.text }}
                    </option>
                  </optgroup>
                </select>
              </div>

              <!-- Filter by WTB/WTS -->
              <div v-if="filterWtbWts[1].options.length" class="filter-item">
                <select v-model="filters.wtbWts" class="filter-select">
                  <optgroup
                    v-for="(group, index) in filterWtbWts"
                    :key="index"
                    :label="group.label"
                  >
                    <option v-if="!group.label" :value="group.value">
                      {{ group.text }}
                    </option>
                    <option
                      v-for="(option, optIndex) in group.options"
                      :key="optIndex"
                      :value="option.value"
                    >
                      {{ option.text }}
                    </option>
                  </optgroup>
                </select>
              </div>
            </div>

            <!-- Remove filters -->
            <div
              v-if="filteredGames.length < games.length"
              class="filter-reset"
            >
              <div>
                <button @click="removeFilters">Remove Filters</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- List of games -->
      <div class="mobile-no-pad games-column">
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

        <div class="load-more">
          <button
            @click="loadMore()"
            v-if="loadedGames.length < filteredGames.length"
          >
            Load More
          </button>
        </div>
      </div>
    </div>
  </div>
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
