import { defineNuxtModule } from "@nuxt/kit";
import { request } from "graphql-request";

const ALL_GAMES_QUERY = `
  query allGamesForRoutes {
    gameCollection(limit: 999) {
      items {
        slug
        system {
          slug
        }
      }
    }
  }
`;

const ALL_SYSTEMS_QUERY = `
  query allSystemsForRoutes {
    systemCollection(limit: 100) {
      items {
        slug
      }
    }
  }
`;

const ALL_BLOG_POSTS_QUERY = `
  query allBlogPostsForRoutes {
    gameLogCollection(limit: 999) {
      items {
        slug
      }
    }
  }
`;

export default defineNuxtModule({
  meta: {
    name: "prerender-routes",
  },
  async setup(_options, nuxt) {
    const spaceId = process.env.CTF_SPACE_ID;
    const accessToken = process.env.CTF_CDA_ACCESS_TOKEN;

    if (!spaceId || !accessToken) {
      console.warn(
        "[prerender-routes] Missing Contentful credentials, skipping dynamic route generation",
      );
      return;
    }

    const endpoint = `https://graphql.contentful.com/content/v1/spaces/${spaceId}?access_token=${accessToken}`;
    const routes: string[] = [];

    try {
      // Fetch all games
      const gamesData = (await request(endpoint, ALL_GAMES_QUERY)) as {
        gameCollection?: {
          items?: { slug: string; system?: { slug: string } }[];
        };
      };
      const games = gamesData?.gameCollection?.items || [];

      for (const game of games) {
        if (game.slug && game.system?.slug) {
          routes.push(`/games/${game.system.slug}/${game.slug}`);
        }
      }
      console.log(`[prerender-routes] Found ${games.length} game routes`);

      // Fetch all systems
      const systemsData = (await request(endpoint, ALL_SYSTEMS_QUERY)) as {
        systemCollection?: { items?: { slug: string }[] };
      };
      const systems = systemsData?.systemCollection?.items || [];

      for (const system of systems) {
        if (system.slug) {
          routes.push(`/systems/${system.slug}`);
        }
      }
      console.log(`[prerender-routes] Found ${systems.length} system routes`);

      // Fetch all blog posts
      const blogData = (await request(endpoint, ALL_BLOG_POSTS_QUERY)) as {
        gameLogCollection?: { items?: { slug: string }[] };
      };
      const posts = blogData?.gameLogCollection?.items || [];

      for (const post of posts) {
        if (post.slug) {
          routes.push(`/blog/${post.slug}`);
        }
      }
      console.log(`[prerender-routes] Found ${posts.length} blog routes`);

      // Add routes to Nitro prerender config
      nuxt.options.nitro = nuxt.options.nitro || {};
      nuxt.options.nitro.prerender = nuxt.options.nitro.prerender || {};
      nuxt.options.nitro.prerender.routes = [
        ...(nuxt.options.nitro.prerender.routes || []),
        ...routes,
      ];

      console.log(
        `[prerender-routes] Total routes to prerender: ${routes.length}`,
      );
    } catch (error) {
      console.error(
        "[prerender-routes] Error fetching routes:",
        error instanceof Error ? error.message : error,
      );
    }
  },
});
