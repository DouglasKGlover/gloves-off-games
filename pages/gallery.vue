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
              v-for="(photo, index) in allImages.assetCollection.items"
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

<script>
import { allImagesQuery } from "~/graphql/allImages.gql";
export default {
  async asyncData({ $graphql }) {
    let allImages = await $graphql.default.request(allImagesQuery);

    return {
      allImages,
    };
  },
};
</script>
