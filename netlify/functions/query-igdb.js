const axios = require('axios');

const data = {
    "Client-ID": process.env.IGDB_CLIENT_ID,
    "Authorization": "Bearer " + process.env.IGDB_AUTHORIZATION
};

console.log("Attempt to run function");
console.log(data);
console.log(axios);

// axios.post('https://reqres.in/api/users', data)
//     .then((res) => {
//         console.log(`Status: ${res.status}`);
//         console.log('Body: ', res.data);
//     }).catch((err) => {
//         console.error(err);
//     });