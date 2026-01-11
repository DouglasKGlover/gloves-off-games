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
    const zone = aws.route53.getZoneOutput({
      name: "douglasglover.ca",
    });

    const site = new sst.aws.StaticSite("GlovesOffGames", {
      path: ".",
      build: {
        command: "npm run generate",
        output: ".output/public",
      },
      domain: {
        name: "games.douglasglover.ca",
        dns: sst.aws.dns({
          zone: zone.zoneId,
        }),
      },
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
