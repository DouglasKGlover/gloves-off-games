<template>
  <div class="system-list-wrapper">
    <div class="systems-column">
      <div
        class="grid grid-cols-sm-3 grid-cols-md-4 grid-cols-lg-6 grid-cols-xl-8 grid-cols-xxl-12 systems-grid"
      >
        <SystemCard
          v-for="(system, index) in systems"
          :key="`system-${index}`"
          :system="system"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  systems: {
    type: Array,
    required: true,
  },
});
</script>

<style scoped lang="scss">
@use "~/assets/css/breakpoints" as *;
@use "sass:map";

.systems-grid {
  grid-template-columns: repeat(2, 1fr);
  margin-top: 1rem;
}

@media (min-width: map.get($breakpoints, sm)) {
  .systems-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: map.get($breakpoints, md)) {
  .systems-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (min-width: map.get($breakpoints, lg)) {
  .systems-grid {
    grid-template-columns: repeat(6, 1fr);
  }
}

@media (min-width: map.get($breakpoints, xl)) {
  .systems-grid {
    grid-template-columns: repeat(8, 1fr);
  }
}

@media (min-width: map.get($breakpoints, xxl)) {
  .systems-grid {
    grid-template-columns: repeat(12, 1fr);
  }
}
</style>
