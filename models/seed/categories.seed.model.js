/*******************************
 *******		 CATEGORIES		 *******
 *******************************/
import { knex } from './../db';
import { dropTableIfExists } from './../../helpers/db.helper';

export const createCategoriesTable = async () => {
	const dropTable = dropTableIfExists(knex, 'categories');
	const createTable = knex.schema.createTable('categories', table => {
		table.increments('category_id');
		table.string('name');
		table.integer('store_id').notNullable();
		table.timestamps(null, true);

		// Indeces
		table.unique('category_id');
		table
			.foreign('store_id')
			.onDelete('CASCADE')
			.references('store_id')
			.on('stores');
	});

	return Promise.all([dropTable, createTable]);
};

export const seedCategoriesTable = async () => {
	const categories = [
		{ name: 'dresses', store_id: 1 },
		{ name: 'shirts', store_id: 1 },
	];
	return knex.batchInsert('categories', categories);
};
