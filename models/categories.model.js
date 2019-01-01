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
	shelves: (storeId, categoryId) => {
		return knex
			.select('name')
			.from('shelves')
			.where({ store_id: storeId, category_id: categoryId });
	},
};
