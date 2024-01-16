<template>
  <div>
    <p>RA ID: {{ raId }}</p>
  </div>
</template>

<script>
export default {
  props: {
    raId: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {};
  },
};
</script>

<style scoped></style>
