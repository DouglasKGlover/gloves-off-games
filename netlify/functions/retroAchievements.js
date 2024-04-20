import { buildAuthorization } from "@retroachievements/api";
import { getUserCompletionProgress } from "@retroachievements/api";

exports.handler = async function (event, context) {
  const userName = "Gloves";
  const webApiKey = process.env.RA_API_KEY;

  const authorization = buildAuthorization({
    userName: userName,
    webApiKey: webApiKey,
  });

  function getProgress(offset) {
    const progress = getUserCompletionProgress(authorization, {
      userName: userName,
      offset: offset,
    });
    return progress;
  }

  // Get progress for as long as there are more achievements to fetch
  let progress = [];
  let offset = 0;
  let response = getProgress(offset);
  while (response.results.length > 0) {
    progress = progress.concat(response.data);
    offset += response.results.length;
    response = getProgress(offset);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(progress),
  };
};
