<template>
  <NuxtLink :to="`/games/${game.system.slug}/${game.slug}`" class="game-card">
    <div
      class="game-card-image"
      :class="game.cover?.thumbnail ? 'has-cover' : 'no-cover'"
    >
      <NuxtImg
        v-if="game.cover?.thumbnail"
        :src="game.cover.thumbnail"
        :alt="`${game.title} cover art`"
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
    </div>

    <div class="game-card-content">
      <h3 class="game-title">{{ game.title }}</h3>

      <div class="game-meta">
        <span class="system-badge" v-if="game.system.shortName">
          {{ game.system.shortName }}
        </span>
        <GamePlayedStatusIndicator :status="game.playedStatus" />
      </div>

      <div
        v-if="showRegion && game.region && game.region !== 'NA'"
        class="game-region"
      >
        <GameRegionIndicator :region="game.region" />
      </div>

      <div v-if="false" class="game-flags">
        <span v-if="false" class="flag digital-flag">Digital</span>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup>
defineProps({
  game: {
    type: Object,
    required: true,
    validator: (game) => {
      return game.title && game.slug && game.system?.slug;
    },
  },
  showRegion: {
    type: Boolean,
    default: false,
  },
});
</script>

<style scoped lang="scss">
.game-card {
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

.game-card-image {
  position: relative;
  width: 100%;
  aspect-ratio: 5 / 3;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;

  &.has-cover {
    background: transparent;
  }

  &.no-cover {
    background: linear-gradient(135deg, #0f0f0f, #1a1a1a);
  }
}

.cover-image,
.cover-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
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

.game-card-content {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-height: 0;
}

.game-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.3;
  color: inherit;
}

.game-meta {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
  font-size: 0.85rem;
}

.system-badge {
  display: inline-block;
  background: rgba(0, 0, 0, 0.08);
  padding: 0.25rem 0.5rem;
  border-radius: 0.2rem;
  font-weight: 500;
  font-size: 0.8rem;
}

.game-region {
  font-size: 0.9rem;
}

.game-flags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}

.flag {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 0.2rem;

  &.digital-flag {
    background: rgba(100, 150, 200, 0.2);
    color: #2c5aa0;
  }
}
</style>
