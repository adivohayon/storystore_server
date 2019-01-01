import { getAllStores, getStoreInfo } from './controllers/store.controller';
import { getAllShelves, getShelf } from './controllers/shelves.controller';
import {
	getAllCategories,
	getCategory,
	getShelvesInCategory,
} from './controllers/categories.controller';
import { seedDb } from './controllers/db.controller';

export const Routes = app => {
	app.get('/seed', seedDb);

	// Get list of all stores
	app.get('/stores', getAllStores);

	// Get store info by storeId
	app.get('/stores/:id', getStoreInfo);

	// Get all shelves in a store
	app.get('/stores/:storeId/shelves', getAllShelves);

	// Get specific shelf in store
	app.get('/stores/:storeId/shelves/:shelfId', getShelf);

	// Get list of all categories in stores
	app.get('/stores/:storeId/categories', getAllCategories);

	// Get specific category in store
	app.get('/stores/:storeId/categories/:categoryId', getCategory);

	// Get list of shelves in store category
	app.get(
		'/stores/:storeId/categories/:categoryId/shelves',
		getShelvesInCategory
	);

	app.use((err, req, res, next) => {
		console.error(err);
		res
			.status(500)
			.send(process.env.NODE_ENV == 'development' ? err.stack : 'Server Error');
		next;
	});
};
