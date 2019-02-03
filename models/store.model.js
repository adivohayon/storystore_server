import { knex } from './../models/db';

export const Stores = {
	findAll: () => {
		return knex.select('store_id AS storeId', 'name', 'slug', 'shipping_details AS shippingDetails', 'returns_policy AS returnsPolicy').from('stores');
	},
	findBySlug: (storeSlug) => {
		return knex.select('store_id AS storeId', 'name', 'slug', 'shipping_details AS shippingDetails', 'returns_policy AS returnsPolicy').from('stores').where({slug: storeSlug});
	},
	find: (storeId) => {
		return knex.select('store_id AS storeId', 'name', 'slug', 'shipping_details AS shippingDetails', 'returns_policy AS returnsPolicy').from('stores').where({store_id: storeId});
	}
}