import contentfulExport from "contentful-export";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { Resource } from "sst";

const s3Client = new S3Client({});

export async function handler() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `backup-${timestamp}.json`;

  console.log(`Starting Contentful backup: ${filename}`);

  try {
    // Export content from Contentful (returns the export data directly)
    const exportData = await contentfulExport({
      spaceId: process.env.CTF_SPACE_ID,
      managementToken: process.env.CTF_CMA_ACCESS_TOKEN,
      saveFile: false,
      exportDir: "/tmp",
      contentFile: filename,
      downloadAssets: false,
      includeDrafts: true,
      includeArchived: true,
    });

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
        entries: exportData.entries?.length || 0,
        contentTypes: exportData.contentTypes?.length || 0,
        assets: exportData.assets?.length || 0,
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
}
