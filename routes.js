import { getAllStores, getStoreInfo } from './controllers/store.controller';
import { getProducts } from './controllers/products.controller';
import { seedDb } from './controllers/db.controller';

export const Routes = app => {
	app.get('/seed', seedDb);
	// Get list of all stores
	app.get('/stores', getAllStores);

	// Get Store info by storeId
	app.get('/stores/:id', getStoreInfo);

	// Get Products
	app.get('/products', getProducts);

	app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send(process.env.NODE_ENV == 'development' ? err.stack : 'Server Error');
    next;
});
};
