<template>
  <main class="error-page">
    <SiteHero title="Page Not Found" />
    <div class="container">
      <div class="error-content">
        <p class="error-message">
          Sorry, the page you're looking for doesn't exist or may have been
          moved.
        </p>
        <NuxtLink to="/" class="btn btn-primary"> Go to Homepage </NuxtLink>
      </div>
    </div>
  </main>
</template>

<script setup>
const props = defineProps({
  error: {
    type: Object,
    default: () => ({}),
  },
});

useHead({
  title: "Page Not Found - Gloves Off Games",
});
</script>

<style scoped lang="scss">
.error-page {
  min-height: 100vh;
}

.error-content {
  text-align: center;
  padding: 4rem 0;
}

.error-message {
  font-size: 1.8rem;
  margin-bottom: 3rem;
  color: #ccc;
}
</style>
