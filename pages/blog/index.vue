<template>
  <main>
    <SiteHero title="Blog" />
    <div class="container">
      <div class="blog-grid">
        <BlogCard
          v-for="(glog, index) in allGameLogs"
          :key="`blog-card-${index}`"
          :title="glog.title"
          :game-name="glog.game?.title || ''"
          :game-slug="glog.game?.slug || ''"
          :system-slug="glog.game?.system?.slug || ''"
          :date="glog.sys.firstPublishedAt"
        >
          <template #default>
            <NuxtLink
              :to="`/blog/${glog.slug}`"
              class="blog-link button primary"
            >
              Read post
            </NuxtLink>
          </template>
        </BlogCard>
      </div>
    </div>
  </main>
</template>

<script setup>
import BlogCard from "~/components/blog/Card.vue";
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
<style scoped lang="scss">
@use "~/assets/css/grid";

.blog-grid {
  width: 100%;
  margin: 0 auto;
  padding: 2rem 0;
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 2rem;

  @media (min-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (min-width: 900px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (min-width: 1200px) {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
