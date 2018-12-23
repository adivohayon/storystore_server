import { Stores } from './../models/store.model';

// Get list of all stores
export const getAllStores = async (req, res) => {
	try {
		const stores = await Stores.findAll();
		res.json(stores);
	} catch (err) {
		console.error('err', err);
		res.status(404).end();
	}
}

// Get Store info by storeId
export const getStoreInfo = async (req, res) => {
	const storeId = req.params.id;
	try {
		const store = await Stores.find(storeId);
		res.json(store);
		
	} catch (err) {
		console.error('err', err);
		res.status(404).end();
	}
};
