import {
	createStoresTable,
	seedStoresTable,
} from './../models/seed/stores.seed.model';

import {
	createCategoriesTable,
	seedCategoriesTable,
} from './../models/seed/categories.seed.model';
import {
	createShelvesTable,
	seedShelvesTable,
} from './../models/seed/shelves.seed.model';
import {
	createSkusTable,
	seedSkusTable,
} from './../models/seed/skus.seed.model';



export const seedDb = async (req, res, next) => {
	try {
		// Stores
		await createStoresTable();
		await seedStoresTable();

		// Categories
		await createCategoriesTable();
		await seedCategoriesTable();

		// Shelves
		await createShelvesTable();
		await seedShelvesTable();

		// SKUs
		await createSkusTable();
		await seedSkusTable();

		// SKU Content
		// await createSkuContentTable();
		// await seedSkuContentTable();

		// Posts

		// Content

		res.sendStatus(200);
	} catch (err) {
		next(err);
	}
};
