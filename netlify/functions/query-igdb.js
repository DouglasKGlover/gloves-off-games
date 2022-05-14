const axios = require('axios');

const config = {
    headers: {
        "Client-ID": process.env.IGDB_CLIENT_ID,
        "Authorization": "Bearer " + process.env.IGDB_AUTHORIZATION,
    }
};

exports.handler = async function (event, context) {
    let returnData = null;
    const requestParams = `fields summary; search ${event.queryStringParameters.title}; where version_parent = null; limit 1;`;

    let reqInstance = axios.create({
        headers: {
            "Client-ID": process.env.IGDB_CLIENT_ID,
            Authorization: `Bearer ${process.env.IGDB_AUTHORIZATION}`
        }
    });

    await reqInstance.post("https://api.igdb.com/v4/games", requestParams, config)
        .then((res) => {
            returnData = res.data;
        }).catch((err) => {
            console.error(err);
        });

    return {
        statusCode: 200,
        body: JSON.stringify(returnData),
    };
};