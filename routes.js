import { getAllStores, getStoreInfo } from './controllers/store.controller';
import { getProducts } from './controllers/products.controller';

export const Routes = app => {
	// Get list of all stores
	app.get('/stores', getAllStores);
	
	// Get Store info by storeId
	app.get('/stores/:id', getStoreInfo);

	// Get Products
	app.get('/products', getProducts);
};
