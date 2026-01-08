import { defineNuxtConfig } from "nuxt/config";

import graphql from "@rollup/plugin-graphql";

export default defineNuxtConfig({
  app: {
    head: {
      title: "Gloves Off Games",
      htmlAttrs: {
        lang: "en",
      },
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "description",
          content:
            "Doug Glover's personal video game collection tracking site, with a rarely updated blog of thoughts and reviews on games I've played recently. Primary purpose being personal tracking so I don't accidently buy games I already own.",
        },
        { name: "format-detection", content: "telephone=no" },
      ],
      link: [{ rel: "icon", type: "image/x-icon", href: "/favicon.png" }],
    },
  },

  css: ["@/assets/css/global.scss"],

  plugins: [
    "~/plugins/dateTranslate",
    "~/plugins/translateLongText",
    "~/plugins/translateRichText",
  ],

  modules: [],

  runtimeConfig: {
    CTF_HOST: process.env.CTF_HOST,
    public: {
      CTF_HOST: process.env.CTF_HOST,
      CTF_PREVIEW: process.env.CTF_HOST === "preview.contentful.com",
      CTF_SPACE_ID: process.env.CTF_SPACE_ID,
      CTF_CDA_ACCESS_TOKEN: process.env.CTF_CDA_ACCESS_TOKEN,
    },
  },

  graphql: {
    clients: {
      default: {
        endpoint:
          "https://graphql.contentful.com/content/v1/spaces/" +
          process.env.CTF_SPACE_ID +
          "?access_token=" +
          process.env.CTF_CDA_ACCESS_TOKEN,
      },
    },
  },

  nitro: {
    compatibilityDate: "2026-01-07",
    prerender: {
      crawlLinks: true,
      failOnError: false,
    },
  },
  vite: {
    plugins: [graphql()],
  },
});
