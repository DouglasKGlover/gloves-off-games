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

<style lang="scss" scoped>
.region-indicator {
  display: none;

  &.jp {
    display: inline-block;
    width: 20px;
    height: 12px;
    background: white;
    border: 1px solid black;
    position: relative;

    &:after {
      content: "";
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: red;
      display: block;
      position: absolute;
      top: 1px;
      left: 5px;
    }
  }

  &.pal {
    display: inline-block;
    width: 20px;
    height: 12px;
    background: blue;
    border: 1px solid black;
    position: relative;

    &:after {
      content: "";
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: transparent;
      border: 1px solid yellow;
      display: block;
      position: absolute;
      top: 1px;
      left: 5px;
    }
  }
}
</style>
