const port = process.env.DB_PORT || 5432;
const host = process.env.DB_HOST || "127.0.0.1";
const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
const database = process.env.DB_DATABASE;

export const knex = require("knex")({
	client: "pg",
	// debug: true,
	connection: {
		host,
		port,
		user,
		password,
		database,
	},
});





