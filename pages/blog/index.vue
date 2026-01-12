<template>
  <main>
    <SiteHero title="Blog" />
    <div class="container">
      <div
        class="game-log-link section"
        v-for="(glog, index) in allGameLogs"
        :key="`game-log-${index}`"
      >
        <span>
          {{ $dateTranslate(glog.sys.firstPublishedAt).long }}
          <span v-if="glog.game"> - </span>
          <NuxtLink
            v-if="glog.game"
            :to="`/games/${glog.game.system.slug}/${glog.game.slug}`"
          >
            {{ glog.game.title }}
          </NuxtLink>
        </span>
        <br />
        <h2>
          <NuxtLink :to="`/blog/${glog.slug}`">{{ glog.title }}</NuxtLink>
        </h2>
      </div>
    </div>
  </main>
</template>

<script setup>
import allGameLogsQuery from "~/graphql/allGameLogs.gql";

useHead({
  title: "Gloves Off Games - Glog",
});

const { $graphql } = useNuxtApp();

const { data: allGameLogsData } = await useAsyncData("allGameLogs", () =>
  $graphql.request(allGameLogsQuery),
);
const allGameLogs = computed(
  () => allGameLogsData.value?.gameLogCollection?.items || [],
);
</script>
