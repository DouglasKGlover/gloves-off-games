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
    return {
      game: null,
    };
  },
  methods: {
    async getGame() {
      const response = await fetch(
        `/.netlify/functions/retroAchievements?raId=${this.raId}`
      );
      const data = await response.json();
      console.log(data);
      this.game = data;
    },
  },
  mounted() {
    // Get game data from netlify function
    this.getGame();
  },
};
</script>

<style scoped></style>
