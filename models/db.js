export const pg = require('pg');

export const knex = require('knex')({
	client: process.env.DATABASE_URL.split(':')[0],
	// debug: true,
	connection: process.env.DATABASE_URL,
	pool: { min: 0, max: 1 },
});

console.log(process.env.DATABASE_URL);
