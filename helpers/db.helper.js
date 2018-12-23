export const dropTableIfExists = (knex, table, cascade = true) => {
	let query = `DROP TABLE IF EXISTS ${table}`;
	if (cascade) {
		query += ' CASCADE';
	}
	return knex.raw(query);
};
