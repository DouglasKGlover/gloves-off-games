const dotenv = require("dotenv");
const axios = require("axios");

async function igdbTokenGen() {
  await axios({
    url: "https://id.twitch.tv/oauth2/token?client_id=3pugzwe4banfxbwmbpjj5tqh7cvm3y&client_secret=rfxt9nyn0ghuiz2kivq6gfikkw7amw&grant_type=client_credentials",
    method: "POST",
  }).then((e) => console.log(e.data));
}

dotenv.config();

igdbTokenGen();
