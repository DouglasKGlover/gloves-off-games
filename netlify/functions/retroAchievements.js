import { buildAuthorization } from "@retroachievements/api";
import { getUserCompletionProgress } from "@retroachievements/api";

exports.handler = async function (event, context) {
  const userName = "Gloves";
  const webApiKey = process.env.RA_API_KEY;

  const authorization = buildAuthorization({
    userName: userName,
    webApiKey: webApiKey,
  });

  const progress = await getUserCompletionProgress(authorization, {
    userName: userName,
    offset: 100,
  });
  console.log(progress);

  return {
    statusCode: 200,
    body: JSON.stringify(progress),
  };
};
