/*******************************
 *******  	  SHELVES	 	 *******
 *******************************/
import { knex } from './../db';
import { dropTableIfExists } from './../../helpers/db.helper';

export const createShelvesTable = async () => {
	const dropTable = dropTableIfExists(knex, 'shelves');
	const createTable = knex.schema.createTable('shelves', table => {
		table.increments('shelf_id').unique(); // id
		table.string('name'); // name
		table.decimal('price', 5);
		table.string('currency', 2);
		table.string('slug');

		table.integer('store_id').notNullable();
		table.integer('category_id').notNullable();

		table.timestamps(null, true);

		// Indeces
		table
			.foreign('store_id')
			.onDelete('CASCADE')
			.references('store_id')
			.on('stores');

		table
			.foreign('category_id')
			.onDelete('CASCADE')
			.references('category_id')
			.on('categories');
	});

	return Promise.all([dropTable, createTable]);
};

export const seedShelvesTable = async () => {
	const shelves = [
		{ name: 'Talya Dress', price: 49, currency: '$', slug: 'talya-dress', store_id: 1, category_id: 1 },
		{ name: 'Cool shirt', price: 29, currency: '$', slug: 'cool-shirt', store_id: 1, category_id: 2 },
	];
	return knex.batchInsert('shelves', shelves);
};
