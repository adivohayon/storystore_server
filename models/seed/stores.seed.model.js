/*******************************
 *******  	   STORES	 	   *******
 *******************************/

import { knex } from './../db';
import { dropTableIfExists } from './../../helpers/db.helper';
import { storeInfo } from './store-info.seed';
export const createStoresTable = async () => {
	const dropTable = dropTableIfExists(knex, 'stores');
	const createTable = knex.schema.createTable('stores', table => {
		table.increments('store_id').unique();
		table.string('slug').unique();
		table.string('name');
		table.text('shipping_details');
		table.text('returns_policy');
		table.timestamps(null, true);
	});

	return Promise.all([dropTable, createTable]).catch(err => {
		throw new Error(err);
	});
};

export const seedStoresTable = async () => {
	const stores = [
		{ name: 'Simplyfashion', slug: 'simplyfashion', shipping_details: storeInfo.shipping_details, returns_policy: storeInfo.returns_policy },
		{ name: 'Perot Arztenu', slug: 'perot-artzenu', shipping_details: storeInfo.shipping_details, returns_policy: storeInfo.returns_policy },
		{ name: 'Swara', slug: 'swara', shipping_details: storeInfo.shipping_details, returns_policy: storeInfo.returns_policy },
	];

	return knex.batchInsert('stores', stores);
};
