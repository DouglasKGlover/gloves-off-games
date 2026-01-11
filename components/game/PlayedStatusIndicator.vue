<template>
  <div class="played-status-indicator" :class="statusClass"></div>
</template>

<script>
export default {
  props: {
    status: {
      type: String,
      default: "",
    },
  },
  computed: {
    statusClass() {
      return (this.status || "").toLowerCase();
    },
  },
};
</script>
