import { getAllStores, getStoreInfo } from './controllers/store.controller';
import { getAllProducts, getProduct } from './controllers/products.controller';
import {
	getAllCategories,
	getCategory,
	getProductsInCategory,
} from './controllers/categories.controller';
import { seedDb } from './controllers/db.controller';

export const Routes = app => {
	app.get('/seed', seedDb);

	// Get list of all stores
	app.get('/stores', getAllStores);

	// Get store info by storeId
	app.get('/stores/:id', getStoreInfo);

	// Get all products in a store
	app.get('/stores/:storeId/products', getAllProducts);

	// Get specific product in store
	app.get('/stores/:storeId/products/:productId', getProduct);

	// Get list of all categories in stores
	app.get('/stores/:storeId/categories', getAllCategories);

	// Get specific category in store
	app.get('/stores/:storeId/categories/:categoryId', getCategory);

	// Get list of products in store category
	app.get(
		'/stores/:storeId/categories/:categoryId/products',
		getProductsInCategory
	);

	app.use((err, req, res, next) => {
		console.error(err);
		res
			.status(500)
			.send(process.env.NODE_ENV == 'development' ? err.stack : 'Server Error');
		next;
	});
};
