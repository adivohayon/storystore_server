import { knex } from './../models/db';

// Get list of all stores
export const getAllStores = async (req, res) => {
	try {
		const stores = await knex.select('store_name').from('stores');
		res.json(stores);
	} catch (err) {
		console.error('err', err);
		res.status(404).end();
	}
}

// Get Store info by storeId
export const getStoreInfo = async (req, res) => {
	const storeId = req.params.id;
	res.send('storeInfo');
};
