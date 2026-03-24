const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.status(200).send('Bot keep-alive server is running!');
});

module.exports = app;