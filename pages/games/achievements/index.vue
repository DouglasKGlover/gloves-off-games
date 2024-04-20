<template>
  <div>
    <h1>This is a test</h1>
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
    return {
      game: null,
    };
  },
  methods: {
    async raFunc() {
      const response = await fetch(`/.netlify/functions/retroAchievements`);
      const data = await response.json();
      console.log(data);
    },
  },
  mounted() {
    // Get game data from netlify function
    this.raFunc();
  },
};
</script>

<style scoped></style>
