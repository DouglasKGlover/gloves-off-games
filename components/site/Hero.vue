<template>
  <div
    class="hero"
    :style="
      backgroundImage ? { backgroundImage: `url('${backgroundImage}')` } : {}
    "
  >
    <div
      class="hero-overlay"
      :style="{
        background: backgroundImage
          ? 'rgba(0, 0, 0, 0.7)'
          : 'rgba(0, 0, 0, 0.2)',
      }"
    ></div>
    <div class="hero-content">
      <h1>{{ title }}</h1>
      <h2 v-if="subtitle || $slots.subtitle">
        <slot name="subtitle">{{ subtitle }}</slot>
      </h2>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: "",
  },
  backgroundImage: {
    type: String,
    default: "",
  },
});
</script>

<style scoped lang="scss">
@use "~/assets/css/breakpoints" as *;

.hero {
  position: relative;
  width: 100%;
  min-height: 20rem;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: $spacing-large;
  padding-top: $spacing-large;
  z-index: var(--z-default);
}

.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.2);
  z-index: 1;
}

.hero-content {
  position: relative;
  z-index: 2;
  color: white;
  text-align: center;
  padding: 2rem;

  h1 {
    margin: 0;
    font-size: 6rem;
    text-shadow:
      0 0.2rem 0.8rem rgba(0, 0, 0, 0.8),
      0 0.4rem 1.6rem rgba(0, 0, 0, 0.6);
  }

  h2 {
    margin: 1rem 0 0 0;
    font-size: 2rem;
    font-weight: 400;
    text-shadow:
      0 0.2rem 0.8rem rgba(0, 0, 0, 0.8),
      0 0.4rem 1.6rem rgba(0, 0, 0, 0.6);

    a {
      color: white;
      text-decoration: none;
      transition: opacity 0.2s ease;

      &:hover {
        opacity: 0.8;
      }
    }
  }
}
</style>
