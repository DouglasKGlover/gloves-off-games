import { defineNuxtPlugin } from "#app";
import createBootstrap from "bootstrap-vue-next";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue-next/dist/bootstrap-vue-next.css";

export default defineNuxtPlugin((nuxtApp) => {
  // Install BootstrapVueNext with all components and directives
  nuxtApp.vueApp.use(
    createBootstrap({
      components: true,
      directives: true,
    }),
  );
});
