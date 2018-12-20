import { getStore } from "./controllers/store.controller";
import { getProducts } from "./controllers/products.controller";

export const Routes = app => {
	// Get Store info
	app.get("/store/:id", getStore);

	// Get Products
	app.get("/products", getProducts);
};
