import { Categories } from './../models/categories.model';
// Get list of all shelfs in store
export const getAllCategories = async (req, res) => {
	const storeId = req.params.storeId;

	try {
		const categories = await Categories.findAll(storeId);
		res.json(categories);
	} catch (err) {
		console.error('err', err);
		res.status(404).end();
	}
};

// Get specific shelf in store
export const getCategory = async (req, res) => {
	const storeId = req.params.storeId;
	const categoryId = req.params.categoryId;

	try {
		const category = await Categories.find(storeId, categoryId);
		res.json(category);
	} catch (err) {
		console.error('err', err);
		res.status(404).end();
	}
};

// Get list of shelves in category, in store
export const getShelvesInCategory = async (req, res) => {
	const storeId = req.params.storeId;
	const categoryId = req.params.categoryId;

	try {
		const shelves = await Categories.shelves(storeId, categoryId);
		res.json(shelves);
	} catch (err) {
		console.error('err', err);
		res.status(404).end();
	}
};
