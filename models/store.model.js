import { knex } from './../models/db';

export const Stores = {
	findAll: () => {
		return knex.select('name').from('stores');
	},
	find: (storeId) => {
		return knex.select('name').from('stores').where({store_id: storeId});
	}
}