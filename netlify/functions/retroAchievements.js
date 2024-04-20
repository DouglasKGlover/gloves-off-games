import { buildAuthorization } from "@retroachievements/api";
import { getUserCompletionProgress } from "@retroachievements/api";

exports.handler = async function (event, context) {
  const userName = "Gloves";
  const webApiKey = process.env.RA_API_KEY;

  const authorization = buildAuthorization({
    userName: userName,
    webApiKey: webApiKey,
  });

  let gameIdArray = [];
  let offset = 0;
  let lastLength = 0;
  function getProgress() {
    // Get the list of games
    const progress = await getUserCompletionProgress(authorization, {
      userName: userName,
      offset: offset,
    });

    // Check if the game has been completed and add to the array if not
    progress.results.forEach((game) => {
      if (game.maxPossible !== game.numAwardedHardcore) {
        gameIdArray.push(game.GameId);
      }
    });
    
    lastLength = progress.results.length;
  }
  
  getProgress();
  if (lastLength = 100) {
    getProgress();
  }

  return {
    statusCode: 200,
    body: JSON.stringify({gameIdArray}),
  };
};
