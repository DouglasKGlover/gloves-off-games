<template>
  <b-container>
    <b-row>
      <b-col>
        <h1>Systems</h1>
        <p>Every single one of them.</p>

        <hr />
      </b-col>
    </b-row>

    <b-row>
      <b-col>
        <ul>
          <li
            v-for="(system, index) in allSystems"
            :key="`systems-list-item-${index}`"
          >
            <nuxt-link :to="`/systems/${system.slug}`">
              {{ system.title }}
              <sup> [{{ system.linkedFrom.gameCollection.total }}]</sup>
              <!-- <sup v-if="system.shortName"> [{{ system.shortName }}]</sup> -->
            </nuxt-link>
          </li>
        </ul>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import { allSystemsQuery } from "~/graphql/allSystems.gql";
export default {
  head() {
    return {
      title: "Gloves Off Games - Systems",
    };
  },
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

<style></style>
