import { knex } from './db';
import { dropTableIfExists } from './../helpers/db.helper';

/*******************************
*******  	   STORES	 	   *******
*******************************/

export const createStoresTable = async () => {
	const dropTable = dropTableIfExists(knex, 'stores');
	const createTable = knex.schema.createTable('stores', table => {
		table.increments('store_id').unique();
		table.string('name');
		table.timestamps(null, true);
	});

	return Promise.all([dropTable, createTable]).catch(err => {
		throw new Error(err);
	});
};

export const seedStoresTable = async () => {
	const stores = [
		{ name: 'Simplyfashion' },
		{ name: 'Perot Arztenu' },
		{ name: 'Swara' },
	];

	return knex.batchInsert('stores', stores);
};


/*******************************
*******		 CATEGORIES		 *******
*******************************/

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



/*******************************
*******  	  PRODUCTS	 	 *******
*******************************/

export const createProductsTable = async () => {
	const dropTable = dropTableIfExists(knex, 'products');
	const createTable = knex.schema.createTable('products', table => {
		table.increments('product_id').unique();
		table.string('name');

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

export const seedProductsTable = async () => {
	const products = [
		{ name: 'Talya Dress', store_id: 1, category_id: 1 },
		{ name: 'Cool shirt', store_id: 1, category_id: 2 },
	];
	return knex.batchInsert('products', products);
};

