/*******************************
 *******  	   STORES	 	   *******
 *******************************/

import { knex } from './../db';
import { dropTableIfExists } from './../../helpers/db.helper';

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
