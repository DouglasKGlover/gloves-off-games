const axios = require('axios');
const headers = {
    "Client-ID": process.env.IGDB_CLIENT_ID,
    "Authorization": "Bearer " + process.env.IGDB_AUTHORIZATION,
};

async function apiCall(endpoint, data) {
    return axios({
        url: `https://api.igdb.com/v4/${endpoint}`,
        method: 'POST',
        headers: headers,
        data: data
    });
}

exports.handler = async function (event, context) {
    let returnData = [{}];

    // Get the ID of the platform
    const platform = await apiCall(
        "platforms",
        `fields name; search ${event.queryStringParameters.platform}; limit 1;`
    );

    // Find the game based on the name and platform ID
    const game = await apiCall(
        "games",
        `fields summary, cover, platforms; search ${event.queryStringParameters.title}; where version_parent = null & release_dates.platform = ${platform.data[0].id}; limit 1;`
    );

    // Update the return data based on details found about the game
    if (game.data.length) {
        returnData[0].summary = game.data[0].summary;

        if (game.data[0].cover) {
            const cover = await apiCall(
                "covers",
                `fields url, height; where id = ${game.data[0].cover};`
            );
            if (cover.data.length) {
                returnData[0].cover = cover.data[0].url;
            }
        }
    }

    return {
        statusCode: 200,
        body: JSON.stringify(returnData)
    };
};