import { knex } from './../models/db';

export const Categories = {
	findAll: storeId => {
		return knex
			.select('name')
			.from('categories')
			.where({ store_id: storeId });
	},
	find: (storeId, categoryId) => {
		return knex
			.select('name')
			.from('categories')
			.where({ store_id: storeId, category_id: categoryId });
	},
	products: (storeId, categoryId) => {
		return knex
			.select('name')
			.from('products')
			.where({ store_id: storeId, category_id: categoryId });
	},
};
