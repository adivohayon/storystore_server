import { Categories } from './../models/categories.model';
// Get list of all products in store
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

// Get specific product in store
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

// Get list of products in category, in store
export const getProductsInCategory = async (req, res) => {
	const storeId = req.params.storeId;
	const categoryId = req.params.categoryId;

	try {
		const products = await Categories.products(storeId, categoryId);
		res.json(products);
	} catch (err) {
		console.error('err', err);
		res.status(404).end();
	}
};
