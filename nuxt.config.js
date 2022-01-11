export default {
  // Target: https://go.nuxtjs.dev/config-target
  target: "static",

  env: {
    CTF_HOST: process.env.CTF_HOST,
    CTF_PREVIEW: process.env.CTF_HOST == "preview.contentful.com", // true/false based on whether we're on a preview site
  },

  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    title: "Gloves Off Games",
    htmlAttrs: {
      lang: "en",
    },
    meta: [
      { charset: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { hid: "description", name: "description", content: "" },
      { name: "format-detection", content: "telephone=no" },
    ],
    link: [{ rel: "icon", type: "image/x-icon", href: "/favicon.png" }],
  },

  // Netlify
  generate: {
    fallback: true,
    interval: 100  // Contentful API = 50/s
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: ["@/assets/css/global.scss"],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: ["~/plugins/dateTranslate.js", "~/plugins/translateRichText.js"],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: ["nuxt-graphql-request"],

  graphql: {
    clients: {
      default: {
        endpoint:
          "https://graphql.contentful.com/content/v1/spaces/" +
          process.env.CTF_SPACE_ID +
          // "/environments/slug-system-migration" +
          "?access_token=" +
          process.env.CTF_CDA_ACCESS_TOKEN,
      },
    },
  },

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    // https://go.nuxtjs.dev/bootstrap
    "bootstrap-vue/nuxt",
  ],

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {},
};
