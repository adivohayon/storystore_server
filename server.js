const express = require("express");
const sls = require("serverless-http");
const app = express();
const port = 3000;
// app.listen(port, () => console.log(`Example app listening on port ${port}!`));
app.get('/ping', (req, res) => {
	res.send('pong');
})
module.exports.app = sls(app, {});
