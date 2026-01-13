<template>
  <div class="game-list-wrapper">
    <div v-if="filterStatuses[1].options.length > 1" class="filters-column">
      <div id="game-filters" class="d-flex items-center gap-4">
        <!-- Header -->
        <div class="filter-header">
          <h2>Filter</h2>
        </div>

        <!-- Filter by status -->
        <div v-if="filterStatuses[1].options.length > 1">
          <select v-model="filters.status" class="filter-select">
            <option :value="filterStatuses[0].value">
              {{ filterStatuses[0].text }}
            </option>
            <option
              v-for="(option, optIndex) in filterStatuses[1].options"
              :key="optIndex"
              :value="option"
            >
              {{ option }}
            </option>
          </select>
        </div>

        <!-- Games shown -->
        <p>{{ filteredGames.length }}/{{ games.length }}</p>

        <!-- Remove filters -->
        <div v-if="filteredGames.length < games.length" class="filter-reset">
          <div>
            <button class="secondary" @click="removeFilters">
              Remove Filter
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- List of games -->
    <div class="mobile-no-pad games-column">
      <div
        class="grid grid-cols-sm-3 grid-cols-md-4 grid-cols-lg-6 grid-cols-xl-8 grid-cols-xxl-12 games-grid"
      >
        <GameCard
          v-for="(game, index) in loadedGames"
          :key="`game-${index}`"
          :game="game"
          :show-region="true"
        />
      </div>

      <div
        ref="loadMoreSentinel"
        class="load-more-sentinel"
        aria-hidden="true"
      ></div>

      <div class="load-more">
        <button
          class="primary"
          @click="loadMore()"
          v-if="loadedGames.length < filteredGames.length"
        >
          Load More
        </button>
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

const batchSize = 20;
const totalToShow = ref(batchSize);
const loadMoreSentinel = ref(null);
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
const filters = ref({
  status: null,
  digital: null,
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
  totalToShow.value = Math.min(
    totalToShow.value + batchSize,
    filteredGames.value.length,
  );
};

const removeFilters = () => {
  filters.value = {
    status: null,
    digital: null,
  };
};

const filteredGames = computed(() => {
  let filtered = props.games;
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

watch(filteredGames, () => {
  totalToShow.value = batchSize;
});

const loadedGames = computed(() => {
  return filteredGames.value.slice(0, totalToShow.value);
});

let observer = null;

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

  if (process.client && loadMoreSentinel.value) {
    observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadMore();
        }
      },
      {
        root: null,
        rootMargin: "200px 0px",
        threshold: 0,
      },
    );
    observer.observe(loadMoreSentinel.value);
  }
});

defineExpose({
  filters,
});

onBeforeUnmount(() => {
  if (observer && loadMoreSentinel.value) {
    observer.unobserve(loadMoreSentinel.value);
  }
  if (observer) {
    observer.disconnect();
  }
});
</script>
<style scoped lang="scss">
@use "~/assets/css/breakpoints" as *;
@use "sass:map";

#game-filters {
  flex-wrap: wrap;
  column-gap: $spacing-default;
  row-gap: 0;
}

.filter-reset {
  width: 100%;
  margin-top: $spacing-small;
  margin-bottom: $spacing-large;
}

@media (min-width: map.get($breakpoints, md)) {
  #game-filters {
    flex-wrap: nowrap;
  }

  .filter-reset {
    width: auto;
    margin-top: 0;
    margin-bottom: 0;
  }
}

.games-grid {
  grid-template-columns: repeat(2, 1fr);
  margin-top: 1rem;
}

@media (min-width: map.get($breakpoints, sm)) {
  .games-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: map.get($breakpoints, md)) {
  .games-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (min-width: map.get($breakpoints, lg)) {
  .games-grid {
    grid-template-columns: repeat(6, 1fr);
  }
}

@media (min-width: map.get($breakpoints, xl)) {
  .games-grid {
    grid-template-columns: repeat(8, 1fr);
  }
}

@media (min-width: map.get($breakpoints, xxl)) {
  .games-grid {
    grid-template-columns: repeat(12, 1fr);
  }
}

.load-more-sentinel {
  width: 100%;
  height: 1px;
}

.load-more {
  margin-top: $spacing-large;
}
</style>
