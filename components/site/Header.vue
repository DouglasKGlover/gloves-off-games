<template>
  <header>
    <b-container>
      <b-row>
        <b-col>
          <nav>
            <div>
              <nuxt-link to="/">Home</nuxt-link>
              <nuxt-link to="/systems/">Systems</nuxt-link>
              <nuxt-link to="/games/">Games</nuxt-link>
              <nuxt-link to="/stats/">Stats</nuxt-link>
              <nuxt-link to="/glog/">Glog</nuxt-link>
            </div>
            <SiteSwitchColorScheme />
          </nav>
        </b-col>
      </b-row>
    </b-container>
  </header>
</template>

<script>
export default {};
</script>

<style lang="scss" scoped>
header {
  position: fixed;
  top: 0;
  width: 100%;
  border-right: 1px solid var(--foreground);
  border-bottom: 1px solid var(--foreground);
  box-shadow: 0 1px 0 var(--highlight);
  background: var(--background);
  z-index: 999;

  nav {
    display: flex;
    justify-content: space-between;
    align-items: center;

    a {
      margin-right: 1em;
    }
  }
}
</style>
