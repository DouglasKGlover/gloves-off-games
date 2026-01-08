<template>
  <div class="region-indicator" :class="regionClass"></div>
</template>

<script>
export default {
  props: {
    region: String,
  },
  computed: {
    regionClass() {
      return this.region.toLowerCase();
    },
  },
};
</script>
