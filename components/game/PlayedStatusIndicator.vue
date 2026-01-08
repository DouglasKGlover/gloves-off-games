<template>
  <div class="played-status-indicator" :class="statusClass"></div>
</template>

<script>
export default {
  props: {
    status: String,
  },
  computed: {
    statusClass() {
      return this.status.toLowerCase();
    },
  },
};
</script>
