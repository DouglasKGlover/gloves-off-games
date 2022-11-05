const dotenv = require("dotenv");
const contentful = require("contentful-management");

// Function to get all games, find those with a slug containing a slash, and update their slug to remove the content before that slash
async function removeSystemFromGameSlug() {
  const ctfSpaceId = process.env.CTF_SPACE_ID;
  const ctfAccessToken = process.env.CTF_CDA_ACCESS_TOKEN;
  const ctfEnv = "slug-system-migration";

  const client = contentful.createClient({
    space: ctfSpaceId,
    accessToken: ctfAccessToken,
    environment: ctfEnv,
  });

  const result = await client
    .getSpace(ctfSpaceId)
    .then((space) => space.getEnvironment(ctfEnv))
    .then((environment) =>
      environment.getEntries({
        content_type: "game",
        limit: 50,
      })
    )
    .then((response) => {
      response.items.forEach((game) => {
        // Find any games with a slash currently in the slug
        if (game.fields.slug["en-US"].includes("/")) {
          console.log(`Updating Slug '${game.fields.slug["en-US"]}' to:`);

          // Create a new slug without the system, which was previously entered manually
          const newSlug = game.fields.slug["en-US"].substring(
            game.fields.slug["en-US"].lastIndexOf("/") + 1
          );

          console.log(`'${newSlug}'`);

          // Update the existing game to have the new slug
          game.fields.slug["en-US"] = newSlug;
          console.log(game);
          console.log("-----");

          // Send the new data to the CMS
          return game.update();
        }
      });
    })
    .catch((error) => {
      console.log("Error:", error);
    });

  return result;
}

dotenv.config();

// Run the function
removeSystemFromGameSlug();
