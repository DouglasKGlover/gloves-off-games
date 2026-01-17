// update-game-status.js
const contentful = require("contentful-management");

const SPACE_ID = "gxu1rby54im7";
const ENVIRONMENT_ID = "master";
const ACCESS_TOKEN = "CFPAT-dI0y3J11kHLz2_S3FYmbTCgQC-S6p8P31_ugnXqWzBc";

async function updateGames() {
  const client = contentful.createClient({ accessToken: ACCESS_TOKEN });
  const space = await client.getSpace(SPACE_ID);
  const env = await space.getEnvironment(ENVIRONMENT_ID);

  // Query for games with playedByStatus 'untouched' or 'abandoned'
  const { items } = await env.getEntries({
    content_type: "game",
    "fields.playedStatus[in]": "Untouched,Abandoned",
    limit: 1000, // adjust as needed
  });

  for (const entry of items) {
    const hasTitle = entry.fields.title && entry.fields.title["en-US"];
    const hasSystem = entry.fields.system && entry.fields.system["en-US"];
    if (!hasTitle || !hasSystem) {
      console.warn(
        `Skipping entry ${entry.sys.id} due to missing required fields.`,
      );
      continue;
    }
    entry.fields.playedStatus["en-US"] = "Unfinished";
    const updatedEntry = await entry.update();
    await updatedEntry.publish();
    console.log(`Updated and published: ${entry.sys.id}`);
  }
}

updateGames().catch(console.error);
