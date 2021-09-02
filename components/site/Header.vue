<template>
  <header>
    <b-container>
      <b-row>
        <b-col>
          <nav>
            <div>
              <nuxt-link to="/">Home</nuxt-link>
              <nuxt-link to="/systems">Systems</nuxt-link>
              <nuxt-link to="/games">Games</nuxt-link>
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
  border-bottom: 1px solid var(--foreground);
  box-shadow: 0 1px 0 var(--highlight);

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
