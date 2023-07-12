const dotenv = require("dotenv");
const contentful = require("contentful-management");
const axios = require("axios");

// const consoles = [
//   { name: "PlayStation 5", id: "2gfu6mTOkS5Mod5Gqy9ODN" },
//   { name: "PC (Microsoft Windows)", id: "6vKctDGACAs1oZz0TMUkSe" },
//   { name: "PlayStation 2", id: "6fkH7tigKfZtC2NPRt2iwP" },
//   { name: "PlayStation 3", id: "1uEj3rEsJSAPIse2z8uK7q" },
//   { name: "PlayStation 4", id: "5Ee9gBQkAhV1GuzPXlIuRw" },
//   { name: "PlayStation", id: "6ASEJghfW4ZloAIYUvInER" },
//   { name: "PlayStation Portable", id: "4feB1lSYlvkS4ppmHyfGde" },
//   { name: "PlayStation Vita", id: "7KEao5XTVW0qKqHJjAlnVm" },
//   { name: "Wii", id: "7Lk9CPGOy7yQ9wev862O5E" },
//   { name: "Wii U", id: "5TZNzfE1yhijCjKfFwW1tW" },
//   { name: "Switch", id: "6YVCTCDFTK8X91rpKBFvL5" },
//   { name: "Sega Mega Drive/Genesis", id: "6ih9rBvmwWAuaAunllHeli" },
//   { name: "Nintendo 3DS", id: "5IrdhdD30Myjewg7JzyNal" },
//   { name: "Nintendo DS", id: "74BJMZafQMgQZnX219AbOm" },
//   { name: "Game Boy Advance", id: "327Da1VPnc0XRy1s38qUzK" },
//   { name: "Game Boy Color", id: "2FsVNAiFlbWIo7mnrMoukX" },
//   { name: "GameCube", id: "2Et5X44yantK60iDixPsto" },
//   { name: "Nintendo 64", id: "3dTvnRQCvD1iXIuWk61Adi" },
//   { name: "Game Boy", id: "5AMUCTBTDts3rcPriFt3So" },
//   { name: "Super Nintendo Entertainment System", id: "6EcLJAF1TLPczf8HwvhhSr" },
//   { name: "Nintendo Entertainment System", id: "LNKQ5B8fRu1BMfIa1nnrK" },
// ];

async function igdbCall(endpoint, data) {
  return axios({
    url: `https://api.igdb.com/v4/${endpoint}`,
    method: "POST",
    headers: {
      "Client-ID": process.env.IGDB_CLIENT_ID,
      Authorization: "Bearer " + process.env.IGDB_AUTHORIZATION,
    },
    data: data,
  });
}

async function getGame() {
  const ctfSpaceId = process.env.CTF_SPACE_ID;
  const ctfAccessToken = process.env.CTF_CMA_ACCESS_TOKEN;
  const ctfEnv = "master";
  let ctfGamesList = [];
  const platformToSearch = consoles[0];

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
        limit: 10,
        skip: 0,
        links_to_entry: platformToSearch.id,
      })
    )
    .then((response) => {
      response.items.forEach((game) => {
        ctfGamesList.push(game);
      });
    })
    .catch((error) => {
      console.log("Error:", error.data);
    });

  ctfGamesList.forEach(async (game) => {
    const platform = await igdbCall(
      "platforms",
      `fields name; search "${platformToSearch.name}"; limit 1;`
    );

    const gameData = await igdbCall(
      "games",
      `fields
        summary,
        storyline,
        genres.name,
        release_dates.platform,
        release_dates.date,
        involved_companies.company.name,
        themes.name;
        
      search "${game.fields.title["en-US"]}"; where version_parent = null & release_dates.platform = ${platform.data[0].id}; limit 1;`
    );

    if (gameData.data[0]) {
      console.log("Updating Game: " + game.fields.title["en-US"]);

      // ID
      game.fields.igdbId = {
        "en-US": `${gameData.data[0].id}`,
      };

      // Release date for the given platform
      if (gameData.data[0]["release_dates"]) {
        const releaseDate = gameData.data[0]["release_dates"].find(
          (date) => date.platform === platform.data[0].id
        ).date;
        game.fields.igdbReleaseDate = {
          ["en-US"]: new Date(releaseDate * 1000),
        };
      }

      // Summary
      if (gameData.data[0].summary) {
        game.fields.igdbSummary = {
          "en-US": gameData.data[0].summary,
        };
      }

      // Storyline
      if (gameData.data[0].storyline) {
        game.fields.igdbStoryline = {
          "en-US": gameData.data[0].storyline,
        };
      }

      // Developers
      let developers = [];
      if (gameData.data[0].involved_companies) {
        gameData.data[0].involved_companies.forEach((company) => {
          developers.push(company.company.name);
        });
        game.fields.igdbDevelopers = {
          "en-US": developers,
        };
      }

      // Themes
      let themes = [];
      if (gameData.data[0].themes) {
        gameData.data[0].themes.forEach((theme) => {
          themes.push(theme.name);
        });
        game.fields.igdbThemes = {
          "en-US": themes,
        };
      }

      // Genres
      let genres = [];
      if (gameData.data[0].genres) {
        gameData.data[0].genres.forEach((genre) => {
          genres.push(genre.name);
        });
        game.fields.igdbGenres = {
          "en-US": genres,
        };
      }

      // Push the updates to the CMS
      return game.update();
    } else {
      console.log("!!! Couldn't update game: " + game.fields.title["en-US"]);
    }
  });
}

dotenv.config();

// Run the function
getGame();
