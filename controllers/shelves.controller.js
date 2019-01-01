import { Shelves } from '../models/shelves.model';

// Get list of all shelves in store
export const getAllShelves = async (req, res) => {
	const storeId = req.params.storeId;

	try {
		const shelves = await Shelves.findAll(storeId);
		res.json(shelves);
	} catch (err) {
		console.error('err', err);
		res.status(404).end();
	}
};

// Get specific shelf in store
export const getShelf = async (req, res) => {
	const storeId = req.params.storeId;
	const shelfId = req.params.shelfId;

	try {
		const shelf = await Shelves.find(storeId, shelfId);
		res.json(shelf);
	} catch (err) {
		console.error('err', err);
		res.status(404).end();
	}
};
