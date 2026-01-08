/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "gloves-off-games",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
    };
  },
  async run() {
    const site = new sst.aws.Nuxt("GlovesOffGames", {
      domain: "gog.douglasglover.ca",
      environment: {
        CTF_HOST: process.env.CTF_HOST || "cdn.contentful.com",
        CTF_SPACE_ID: process.env.CTF_SPACE_ID || "",
        CTF_CDA_ACCESS_TOKEN: process.env.CTF_CDA_ACCESS_TOKEN || "",
      },
    });

    return {
      url: site.url,
    };
  },
});
