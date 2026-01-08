<template>
  <header :class="{ active }">
    <b-container>
      <b-row>
        <b-col>
          <nav>
            <div>
              <NuxtLink to="/">Home</NuxtLink>
              <NuxtLink to="/systems/">Systems</NuxtLink>
              <NuxtLink to="/games/">Games</NuxtLink>
              <NuxtLink to="/stats/">Stats</NuxtLink>
              <NuxtLink to="/gallery/">Gallery</NuxtLink>
              <NuxtLink to="/glog/">Glog</NuxtLink>
            </div>
            <SiteSwitchColorScheme />
          </nav>
        </b-col>
      </b-row>
    </b-container>

    <button
      class="d-md-none toggle"
      @click="toggle"
      aria-label="Navigation Toggle"
    ></button>
  </header>
</template>

<script setup>
const active = ref(false);

const toggle = (state) => {
  if (state === "off") {
    active.value = false;
    return;
  }
  active.value = !active.value;
};

const route = useRoute();

watch(
  () => route.path,
  () => {
    toggle("off");
  },
);
</script>

<style lang="scss" scoped>
header {
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 999;
  border-right: 1px solid var(--foreground);
  border-bottom: 1px solid var(--foreground);
  box-shadow: 0 1px 0 var(--highlight);

  .container {
    background: var(--background);
  }

  nav {
    display: flex;
    justify-content: space-between;
    align-items: center;

    a {
      margin-right: 1em;
    }
  }

  @media (max-width: 768px) {
    width: 100vw;
    height: 100vh;
    pointer-events: none;

    &.active {
      pointer-events: all;

      .container {
        opacity: 1;
        pointer-events: all;
      }

      .toggle {
        &:after {
          content: "";
          position: absolute;
          height: 50%;
          width: 50%;
          border-left: 2px solid var(--foreground);
          border-right: 2px solid var(--foreground);
          transform: translate(-50%, -50%) rotate(90deg);
        }

        &:before {
          content: "";
          position: absolute;
          height: 40%;
          width: 2px;
          background: var(--foreground);
          transform: translate(-1px, -50%) rotate(-90deg);
        }
      }
    }

    .toggle {
      pointer-events: all;
      position: fixed;
      top: calc(100vh - 50px - 1em - 100px);
      left: calc(100vw - 50px - 1em);
      width: 50px;
      height: 50px;
      background: white;
      border-radius: 50%;
      border: 2px solid var(--foreground);

      &:after {
        content: "";
        position: absolute;
        height: 40%;
        width: 40%;
        border-left: 2px solid var(--foreground);
        border-right: 2px solid var(--foreground);
        transform: translate(-50%, -50%);
        transition: 0.5s ease;
      }

      &:before {
        content: "";
        position: absolute;
        height: 50%;
        width: 2px;
        background: var(--foreground);
        transform: translate(-1px, -50%);
        transition: 0.5s ease;
      }
    }

    .container {
      height: 100%;
      display: flex;
      justify-content: right;
      align-items: end;
      padding-bottom: calc(2em + 100px);
      opacity: 0;
      transition: 0.5s ease;

      nav {
        text-align: right;
        display: block;
        margin-right: 1em;
        padding-bottom: 3em;

        a {
          display: block;
          font-size: 10vw;
          margin: 0;
        }

        button {
          margin-top: 1em;
          height: 30px;
          width: 30px;

          &:after {
            height: 30px;
            width: 30px;
          }
        }
      }
    }
  }
}
</style>
