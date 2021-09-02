<template>
  <main>
    <b-container>
      <b-row>
        <b-col>
          <h1>Gloves Off Games</h1>
          <p>My personal collection tracking site.</p>
        </b-col>
      </b-row>

      <b-row>
        <b-col>
          <div
            v-for="(system, index) in allSystems"
            :key="`systems-list-item-${index}`"
          >
            <nuxt-link :to="`/systems/${system.slug}`">
              {{ system.title }}
              <sup v-if="system.shortName" style="font-size: 0.6em">
                [{{ system.shortName }}]</sup
              >
            </nuxt-link>
          </div>
        </b-col>
      </b-row>
    </b-container>
  </main>
</template>

<script>
import { allSystemsQuery } from "~/graphql/allSystems.gql";
export default {
  async asyncData({ $graphql }) {
    let allSystems = await $graphql.default.request(allSystemsQuery, {
      preview: process.env.CTF_PREVIEW,
    });
    allSystems = allSystems.systemCollection.items;

    return {
      allSystems,
    };
  },
};
</script>
