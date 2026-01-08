<template>
  <div>
    <b-container>
      <b-row>
        <b-col>
          <h1>{{ glog.title }}</h1>
          <p>
            Game:
            <NuxtLink
              v-if="glog.game"
              :to="`/games/${glog.game.system.slug}/${glog.game.slug}`"
            >
              {{ glog.game.title }}
            </NuxtLink>
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

<script setup>
import gameLogBySlugQuery from "~/graphql/gameLogBySlug.gql";

const route = useRoute();

const { $graphql } = useNuxtApp();

const { data: glogData } = await useAsyncData("glogDetail", () =>
  $graphql.request(gameLogBySlugQuery, {
    slug: route.params.slug,
  }),
);

const glog = computed(
  () => glogData.value?.gameLogCollection?.items?.[0] || {},
);

useHead({
  title: computed(() =>
    glog.value?.title
      ? `Gloves Off Games - ${glog.value.title}`
      : "Gloves Off Games - Glog",
  ),
});
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
