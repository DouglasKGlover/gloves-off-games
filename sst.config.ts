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
      name: "glovesoff.games",
    });

    const site = new sst.aws.StaticSite("GlovesOffGames", {
      path: ".",
      build: {
        command: "npm run generate",
        output: ".output/public",
      },
      domain: {
        name: "glovesoff.games",
        dns: sst.aws.dns({
          zone: zone.zoneId,
        }),
      },
      environment: {
        CTF_HOST: process.env.CTF_HOST || "cdn.contentful.com",
        CTF_SPACE_ID: process.env.CTF_SPACE_ID || "",
        CTF_CDA_ACCESS_TOKEN: process.env.CTF_CDA_ACCESS_TOKEN || "",
      },
      errorPage: "404.html",
      edge: {
        viewerRequest: {
          injection: `
            // Rewrite URLs without file extensions to append /index.html
            const uri = event.request.uri;
            if (!uri.includes('.') && !uri.endsWith('/')) {
              event.request.uri = uri + '/index.html';
            } else if (uri.endsWith('/')) {
              event.request.uri = uri + 'index.html';
            }
          `,
        },
      },
    });

    return {
      url: site.url,
    };
  },
});
