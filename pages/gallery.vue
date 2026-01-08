<template>
  <main>
    <!-- <pre>{{ allImages.assetCollection.items }}</pre> -->
    <b-container>
      <b-row class="mb-4">
        <b-col>
          <h1 class="mb-4">Photo Gallery</h1>

          <b-row>
            <b-col
              cols="4"
              md="3"
              v-for="(photo, index) in images"
              :key="`game-photo-${index}`"
              class="mb-4"
            >
              <b-button v-b-modal="`photo-modal-${index}`" class="image-button">
                <b-img fluid :src="photo.thumbnail" width="300" height="200" />
              </b-button>

              <b-modal :id="`photo-modal-${index}`" hide-footer size="xl">
                <b-img :src="photo.url" fluid />
              </b-modal>
            </b-col>
          </b-row>
        </b-col>
      </b-row>
    </b-container>
  </main>
</template>

<script setup>
import allImagesQuery from "~/graphql/allImages.gql";

const { $graphql } = useNuxtApp();

const { data: allImagesData } = await useAsyncData("allImages", () =>
  $graphql.request(allImagesQuery),
);

const images = computed(
  () => allImagesData.value?.assetCollection?.items || [],
);
</script>
