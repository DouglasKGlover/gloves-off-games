<template>
  <div class="container">
    <div>
      <div>
        <h1>Systems</h1>
        <p>Every single one of them.</p>

        <hr />
      </div>
    </div>

    <div>
      <div>
        <ul>
          <li
            v-for="(system, index) in allSystems"
            :key="`systems-list-item-${index}`"
          >
            <NuxtLink :to="`/systems/${system.slug}`">
              {{ system.title }}
              <sup> [{{ system.linkedFrom.gameCollection.total }}]</sup>
              <!-- <sup v-if="system.shortName"> [{{ system.shortName }}]</sup> -->
            </NuxtLink>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import allSystemsQuery from "~/graphql/allSystems.gql";

useHead({
  title: "Gloves Off Games - Systems",
});

const { $graphql } = useNuxtApp();

const { data: allSystemsData } = await useAsyncData("allSystems", () =>
  $graphql.request(allSystemsQuery),
);
const allSystems = computed(
  () => allSystemsData.value?.systemCollection?.items || [],
);
</script>
