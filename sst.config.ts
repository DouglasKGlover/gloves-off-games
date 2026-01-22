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

    // S3 bucket for Contentful backups
    const backupBucket = new sst.aws.Bucket("ContentfulBackups", {
      access: "private",
    });

    // Lambda function for backup
    const backupFunction = new sst.aws.Function("ContentfulBackup", {
      handler: "functions/backup-contentful.handler",
      timeout: "5 minutes",
      memory: "512 MB",
      link: [backupBucket],
      environment: {
        CTF_SPACE_ID: process.env.CTF_SPACE_ID || "",
        CTF_CMA_ACCESS_TOKEN: process.env.CTF_CMA_ACCESS_TOKEN || "",
      },
      nodejs: {
        install: ["contentful-export", "@aws-sdk/client-s3"],
      },
    });

    // Monthly cron trigger (1st of each month at 3am UTC)
    new sst.aws.Cron("ContentfulBackupSchedule", {
      schedule: "cron(0 3 1 * ? *)",
      job: backupFunction,
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
    });

    return {
      url: site.url,
      backupBucket: backupBucket.name,
    };
  },
});
