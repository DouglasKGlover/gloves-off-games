<template>
  <NuxtLink :to="`/systems/${system.slug}`" class="system-card">
    <div
      class="system-card-image"
      :class="system.cover?.thumbnail ? 'has-cover' : 'no-cover'"
    >
      <NuxtImg
        v-if="system.cover?.thumbnail"
        :src="system.cover.thumbnail"
        :alt="`${system.title} cover art`"
        class="cover-image"
        loading="lazy"
        sizes="sm:100vw md:50vw lg:33vw"
      />
      <div
        v-else
        class="cover-placeholder"
        aria-label="No cover image available"
      >
        <span>No Cover</span>
      </div>
      <div
        v-if="totalGames > 0"
        class="status-bar"
        role="img"
        :aria-label="statusBarLabel"
      >
        <span
          v-if="unfinishedPercent > 0"
          class="status-segment unfinished"
          :style="{ width: unfinishedPercent + '%' }"
        ></span>
        <span
          v-if="beatenPercent > 0"
          class="status-segment beaten"
          :style="{ width: beatenPercent + '%' }"
        ></span>
        <span
          v-if="completedPercent > 0"
          class="status-segment completed"
          :style="{ width: completedPercent + '%' }"
        ></span>
      </div>
    </div>

    <div class="system-card-content">
      <h3 class="system-title">{{ system.title }}</h3>

      <div class="system-meta">
        <span class="meta-count">
          {{ system.linkedFrom.gameCollection.total }}
          {{ system.linkedFrom.gameCollection.total === 1 ? "game" : "games" }}
        </span>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  system: {
    type: Object,
    required: true,
    validator: (system) => {
      return system.title && system.slug;
    },
  },
});

const totalGames = computed(
  () => props.system.linkedFrom?.gameCollection?.total || 0,
);

const games = computed(
  () => props.system.linkedFrom?.gameCollection?.items || [],
);

const unfinishedCount = computed(
  () => games.value.filter((g) => g.playedStatus === "Unfinished").length,
);
const beatenCount = computed(
  () => games.value.filter((g) => g.playedStatus === "Beaten").length,
);
const completedCount = computed(
  () => games.value.filter((g) => g.playedStatus === "Completed").length,
);

const unfinishedPercent = computed(() =>
  totalGames.value > 0 ? (unfinishedCount.value / totalGames.value) * 100 : 0,
);
const beatenPercent = computed(() =>
  totalGames.value > 0 ? (beatenCount.value / totalGames.value) * 100 : 0,
);
const completedPercent = computed(() =>
  totalGames.value > 0 ? (completedCount.value / totalGames.value) * 100 : 0,
);

const statusBarLabel = computed(() => {
  return `Game status: ${unfinishedCount.value} unfinished, ${beatenCount.value} beaten, ${completedCount.value} completed out of ${totalGames.value} total`;
});
</script>

<style scoped lang="scss">
.system-card {
  display: grid;
  grid-template-rows: auto 1fr;
  text-decoration: none;
  color: inherit;
  border-radius: 0.5rem;
  transition: 0.2s ease;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  height: 100%;
  border: 0.2rem solid transparent;
  overflow: hidden;

  &:hover {
    border: 0.2rem solid var(--pink);
    box-shadow:
      0 0.8rem 1.8rem rgba(0, 0, 0, 0.25),
      0 0 1.4rem var(--pink);
  }

  &:focus {
    outline: none;
  }

  &:focus-visible {
    outline: 0.2rem solid var(--pink);
    outline-offset: 0.2rem;
    box-shadow: 0 0 0.8rem var(--pink);
  }
}

.system-card-image {
  position: relative;
  width: 100%;
  aspect-ratio: 10 / 3;
  overflow: hidden;
  background: linear-gradient(135deg, #0f0f0f, #1a1a1a);
}

.status-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 0.3rem;
  display: flex;
}

.status-segment {
  height: 100%;

  &.unfinished {
    background-color: #6b6b6b;
  }

  &.beaten {
    background-color: rgb(var(--beaten));
  }

  &.completed {
    background-color: rgb(var(--completed));
  }
}

.cover-image,
.cover-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  padding: 1rem;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f0f0f, #1a1a1a);
  color: #666;
  font-size: 1.2rem;
  font-weight: 500;
}

.system-card-content {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.system-title {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 600;
  line-height: 1.3;
  color: inherit;
}

.system-meta {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  font-size: 0.95rem;

  span {
    display: inline-block;
    background: rgba(0, 0, 0, 0.2);
    padding: 0.25rem 0.5rem;
    border-radius: 0.2rem;
    color: rgba(255, 255, 255, 0.8);
  }
}
</style>
