// import fetch from 'cross-fetch';
const fetch = require('cross-fetch');

const url = "https://jsonmock.hackerrank.com/api/movies";

const getData = async () => {
    const response = await fetch(url);

    if (response.ok) {
        const data = await response.json();

        console.log('DATA: ', data);
    }
};
await getData();