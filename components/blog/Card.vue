<template>
  <div class="blog-card">
    <div class="blog-card-content">
      <h2 class="blog-title">{{ title }}</h2>
      <div class="blog-meta">
        <span class="meta-date">
          <time :datetime="dateISO">{{ dateFormatted }}</time>
        </span>
      </div>
      <div class="blog-meta">
        <span v-if="gameName" class="meta-game">
          <NuxtLink
            v-if="gameSlug && systemSlug"
            :to="`/games/${systemSlug}/${gameSlug}`"
          >
            {{ gameName }}
          </NuxtLink>
          <template v-else>{{ gameName }}</template>
        </span>
      </div>
    </div>
    <div class="blog-card-cta">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  title: { type: String, required: true },
  gameName: { type: String, default: "" },
  gameSlug: { type: String, default: "" },
  systemSlug: { type: String, default: "" },
  date: { type: [String, Date], required: true },
});

const dateISO = computed(() => {
  if (typeof props.date === "string") {
    return new Date(props.date).toISOString();
  }
  return props.date.toISOString();
});

const dateFormatted = computed(() => {
  const d = typeof props.date === "string" ? new Date(props.date) : props.date;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});
</script>

<style scoped lang="scss">
.blog-card {
  display: grid;
  grid-template-rows: 1fr auto;
  background: var(--card-bg, #181a20);
  border-radius: 0.8rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
  padding: 2rem;
  min-width: 0;
  height: 100%;
  border: 0.2rem solid transparent;
  overflow: hidden;
}

.blog-card-content {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.blog-title {
  margin: 0 0 0.8rem 0;
  font-size: 1.8rem;
  font-weight: 700;
  line-height: 1.2;
  color: #f7f7fa;
}

.blog-meta {
  display: block;
  margin-bottom: 0.4rem;
  font-size: 1.2rem;
}

.meta-game {
  display: inline-block;
  background: rgba(0, 0, 0, 0.2);
  padding: 0.25rem 0.5rem;
  border-radius: 0.2rem;
  font-weight: 500;
  color: #b3b6c2;
}

.meta-date {
  display: inline-block;
  background: rgba(0, 0, 0, 0.2);
  padding: 0.25rem 0.5rem;
  border-radius: 0.2rem;
  color: #a0a3b8;
  font-size: 1.2rem;
}

.blog-card-cta {
  margin-top: 1.2rem;
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
}
</style>
