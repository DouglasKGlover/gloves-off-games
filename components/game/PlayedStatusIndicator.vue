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
    padding: 0.2em 0.5em 0.4em;
    background: var(--highlight);
    border: 1px solid var(--foreground);
    font-size: 0.6em;
    width: 200px;
  }

  &:hover {
    cursor: pointer;

    &::after {
      opacity: 1;
    }
  }

  &.untouched {
    background: grey;

    &::after {
      content: "I've never played this game, or at least not this specific copy of this game.";
    }
  }

  &.unfinished {
    background: orange;

    &::after {
      content: "I've started playing this game, but I haven't finished it yet.";
    }
  }

  &.beaten {
    background: green;

    &::after {
      content: "I've beaten this game, but I haven't 100% completed it yet.";
    }
  }

  &.completed {
    background: gold;

    &::after {
      content: "I've beaten this game and 100% completed it. The requirements for this are listed on the game page.";
    }
  }

  &.abandoned {
    background: red;

    &::after {
      content: "I've started playing this game, but I've abandoned it for one reason or another, and I don't plan on finishing it.";
    }
  }
}
</style>
