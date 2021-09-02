<template>
  <header>
    <b-container>
      <b-row>
        <b-col>
          <nav>
            <nuxt-link to="/">Home</nuxt-link>
            <nuxt-link to="/systems">Systems</nuxt-link>
            <nuxt-link to="/games">Games</nuxt-link>
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
  border-bottom: 1px solid var(--black);
  box-shadow: 0 1px 0 white;

  nav {
    a {
      margin-right: 1em;
    }
  }
}
</style>
