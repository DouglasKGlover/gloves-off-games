const dotenv = require("dotenv");
const axios = require("axios");

async function igdbTokenGen() {
  await axios({
    url: `https://id.twitch.tv/oauth2/token?client_id=${process.env.IGDB_CLIENT_ID}&client_secret=${process.env.IGDB_AUTHORIZATION}&grant_type=client_credentials`,
    method: "POST",
  }).then((e) => console.log(e.data));
}

dotenv.config();

igdbTokenGen();
