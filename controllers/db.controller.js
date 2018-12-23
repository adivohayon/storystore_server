import {
	createStoresTable,
	seedStoresTable,
	createCategoriesTable,
	seedCategoriesTable,
	createProductsTable,
	seedProductsTable,
} from './../models/seed';

export const seedDb = async (req, res, next) => {
	try {
		// Stores
		await createStoresTable();
		await seedStoresTable();

		// Categories
		await createCategoriesTable();
		await seedCategoriesTable();

		// Products
		await createProductsTable();
		await seedProductsTable();

		// Posts

		// Content

		res.sendStatus(200);
	} catch (err) {
		next(err);
	}
};
