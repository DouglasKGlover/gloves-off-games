import { GraphQLClient } from "graphql-request";

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  const endpoint = `https://graphql.contentful.com/content/v1/spaces/${config.public.CTF_SPACE_ID}?access_token=${config.public.CTF_CDA_ACCESS_TOKEN}`;
  const client = new GraphQLClient(endpoint);

  return {
    provide: {
      graphql: client,
    },
  };
});
