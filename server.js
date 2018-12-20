const express = require("express");
const sls = require("serverless-http");
const app = express();
import { getStore } from "./controllers/store.controller";
// Test that serverless works
app.get("/ping", (req, res) => {
	res.send("pong");
});

app.get("/store/:id", getStore);

// module.exports.app = sls(app, {});

export const api =  sls(app, {});
// export function app() {
// 	return sls(app, {});
// }
