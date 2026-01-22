const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const contentful = require("contentful-management");
const { Resource } = require("sst");

const s3Client = new S3Client({});

exports.handler = async function () {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `backup-${timestamp}.json`;

  console.log(`Starting Contentful backup: ${filename}`);

  try {
    const client = contentful.createClient({
      accessToken: process.env.CTF_CMA_ACCESS_TOKEN,
    });

    const space = await client.getSpace(process.env.CTF_SPACE_ID);
    const environment = await space.getEnvironment("master");

    // Fetch all content types
    const contentTypes = await environment.getContentTypes({ limit: 1000 });
    console.log(`Fetched ${contentTypes.items.length} content types`);

    // Fetch all entries (paginated)
    const entries = [];
    let skip = 0;
    const limit = 100;
    while (true) {
      const batch = await environment.getEntries({ skip, limit });
      entries.push(...batch.items);
      console.log(`Fetched ${entries.length} entries...`);
      if (batch.items.length < limit) break;
      skip += limit;
    }

    // Fetch all assets (paginated)
    const assets = [];
    skip = 0;
    while (true) {
      const batch = await environment.getAssets({ skip, limit });
      assets.push(...batch.items);
      console.log(`Fetched ${assets.length} assets...`);
      if (batch.items.length < limit) break;
      skip += limit;
    }

    // Fetch locales
    const locales = await environment.getLocales();

    const exportData = {
      contentTypes: contentTypes.items,
      entries: entries,
      assets: assets,
      locales: locales.items,
      exportedAt: new Date().toISOString(),
    };

    // Upload to S3
    const uploadCommand = new PutObjectCommand({
      Bucket: Resource.ContentfulBackups.name,
      Key: filename,
      Body: JSON.stringify(exportData, null, 2),
      ContentType: "application/json",
    });

    await s3Client.send(uploadCommand);

    console.log(`Backup uploaded to S3: ${filename}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Backup completed successfully",
        filename,
        entries: entries.length,
        contentTypes: contentTypes.items.length,
        assets: assets.length,
      }),
    };
  } catch (error) {
    console.error("Backup failed:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Backup failed",
        error: error.message,
      }),
    };
  }
};
