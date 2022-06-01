<template>
  <div>
    <b-container>
      <b-row>
        <b-col>
          <h1>{{ glog.title }}</h1>
          <p>
            Game:
            <nuxt-link
              :to="`/games/${glog.game.system.slug}/${glog.game.slug}`"
            >
              {{ glog.game.title }}
            </nuxt-link>
            <br />
            Published on {{ $dateTranslate(glog.sys.firstPublishedAt).long }}
          </p>
        </b-col>
      </b-row>

      <b-row>
        <b-col>
          <div
            id="glog-details"
            v-html="$translateRichText(glog.details.json)"
          ></div>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
import { gameLogBySlugQuery } from "~/graphql/gameLogBySlug.gql";
export default {
  async asyncData({ $graphql, params }) {
    let glog = await $graphql.default.request(gameLogBySlugQuery, {
      slug: params.pathMatch,
    });
    glog = glog.gameLogCollection.items[0];

    return {
      glog,
    };
  },
};
</script>

<style lang="scss" scoped>
#glog-details {
  font-family: Helvetica, sans-serif;
  text-shadow: none;
  background: var(--background-lighter);
  color: var(--foreground-darker);
  padding: 30px;
}
</style>
