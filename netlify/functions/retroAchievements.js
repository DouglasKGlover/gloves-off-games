import { buildAuthorization } from "@retroachievements/api";
import { getGame } from "@retroachievements/api";

exports.handler = async function (event, context) {
  const userName = "Gloves";
  const webApiKey = process.env.RA_API_KEY;

  const authorization = buildAuthorization({
    userName: userName,
    webApiKey: webApiKey,
  });
  this.getGame(authorization, this.raId);

  const raGame = await getGame(authorization, { gameId: raId });
  console.log(raGame);

  return {
    statusCode: 200,
    body: JSON.stringify("HELLO WORLD"),
  };
};
