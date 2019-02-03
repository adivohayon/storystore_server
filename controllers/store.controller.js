import { Stores } from './../models/store.model';
import { Shelves } from './../models/shelves.model';

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

export const getStore = async (req, res) => {
	const storeSlug = req.params.slug;
	if (!storeSlug) {
		res.status(404).end();
	}

	console.log('storeSluf', storeSlug);
	try {
		const store = (await Stores.findBySlug(storeSlug))[0];
		console.log('store', store);
		if (store && store.storeId) {
			console.log('store.storeId', store.storeId);
			const shelves = await Shelves.findAll(store.storeId);
			console.log('shelves', shelves);
			store.shelves = shelves;
			res.json(store);
		} else {
			res.status(404).end();
		}
	}catch (err) {
		console.error('err', err);
		res.status(404).end();
	}
}
// Get Store info by storeId
export const getStoreInfo = async (req, res) => {
	const storeSlug = req.params.slug;
	const storeId = req.params.id;
	try {
		const store = await Stores.find(storeId);
		res.json(store);
		
	} catch (err) {
		console.error('err', err);
		res.status(404).end();
	}
};
