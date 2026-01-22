import { GraphQLClient } from "graphql-request";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function requestWithRetry<T>(
  client: GraphQLClient,
  document: string,
  variables?: Record<string, unknown>,
  retries = 5,
  delay = 500,
): Promise<T> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await client.request<T>(document, variables);
    } catch (error: unknown) {
      const isRateLimit =
        error instanceof Error &&
        (error.message.includes("429") || error.message.includes("RATE_LIMIT"));

      if (isRateLimit && attempt < retries - 1) {
        const waitTime = delay * Math.pow(2, attempt);
        console.log(
          `Rate limited, waiting ${waitTime}ms before retry ${attempt + 1}/${retries}`,
        );
        await sleep(waitTime);
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  const endpoint = `https://graphql.contentful.com/content/v1/spaces/${config.public.CTF_SPACE_ID}?access_token=${config.public.CTF_CDA_ACCESS_TOKEN}`;
  const client = new GraphQLClient(endpoint);

  const wrappedClient = {
    request: <T>(
      document: string,
      variables?: Record<string, unknown>,
    ): Promise<T> => requestWithRetry<T>(client, document, variables),
  };

  return {
    provide: {
      graphql: wrappedClient,
    },
  };
});
