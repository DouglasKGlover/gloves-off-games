<template>
  <main>
    <div class="container">
      <div>
        <div>
          <h1>Photo Gallery</h1>

          <div>
            <div
              v-for="(photo, index) in images"
              :key="`game-photo-${index}`"
              class="section"
            >
              <button
                @click="openModal(`photo-modal-${index}`)"
                class="image-button"
              >
                <img :src="photo.thumbnail" width="300" height="200" />
              </button>

              <dialog :id="`photo-modal-${index}`">
                <img :src="photo.url" />
              </dialog>
            </div>
          </div>
        </div>
      </div>
    </div>
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
