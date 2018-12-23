import { Products } from './../models/products.model';

// Get list of all products in store
export const getAllProducts = async (req, res) => {
	const storeId = req.params.storeId;

	try {
		const products = await Products.findAll(storeId);
		res.json(products);
	} catch (err) {
		console.error('err', err);
		res.status(404).end();
	}
}

// Get specific product in store
export const getProduct = async (req, res) => {
	const storeId = req.params.storeId;
	const productId = req.params.productId;

	try {
		const product = await Products.find(storeId, productId);
		res.json(product);
		
	} catch (err) {
		console.error('err', err);
		res.status(404).end();
	}
};
