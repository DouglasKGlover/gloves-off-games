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

<style lang="scss" scoped>
.played-status-indicator {
  position: relative;
  display: inline-block;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  vertical-align: text-top;
  margin-top: 0.55em;
  margin-right: 3px;
  box-shadow: -1px -1px 0 var(--highlight);

  &::after {
    content: "";
    pointer-events: none;
    opacity: 0;
    display: block;
    position: absolute;
    bottom: 150%;
    left: 0;
    padding: 0.1em 1em 0.2em;
    background: var(--highlight);
    border: 1px solid var(--foreground);
    font-size: 0.6em;
  }

  &:hover {
    cursor: pointer;

    &::after {
      opacity: 1;
    }
  }

  &.untouched {
    background: red;

    &::after {
      content: "Status: Untouched";
    }
  }

  &.unfinished {
    background: orange;

    &::after {
      content: "Status: Unfinished";
    }
  }

  &.beaten {
    background: green;

    &::after {
      content: "Status: Beaten";
    }
  }

  &.completed {
    background: gold;

    &::after {
      content: "Status: Completed";
    }
  }
}
</style>
