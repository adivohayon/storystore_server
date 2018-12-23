import { knex } from './../models/db';

export const Products = {
	findAll: storeId => {
		return knex
			.select('name')
			.from('products')
			.where({ store_id: storeId });
	},
	find: (storeId, productId) => {
		return knex
			.select('name')
			.from('products')
			.where({ store_id: storeId, product_id: productId });
	},
};
