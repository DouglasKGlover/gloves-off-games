<template>
  <div class="layout-wrapper">
    <SiteAnimatedBackground />
    <SiteHeader />
    <NuxtPage
      :transition="{
        name: 'page',
        mode: 'out-in',
      }"
    />
  </div>
</template>

<style>
.layout-wrapper {
  position: relative;
}

.page-enter-active,
.page-leave-active {
  transition: opacity 0.3s ease;
}

.page-enter-from {
  opacity: 0;
}

.page-leave-to {
  opacity: 0;
}
</style>
