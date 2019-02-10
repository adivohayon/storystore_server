import {
	csvToJson,
	saveToJson,
	getShelvesAndVariations,
	shelfIdToShelfSlugMap,
} from './lib';

import { injectAssets } from './lib/assets';
import {insertShelves, insertVariations} from './lib/db'
const getStore = () => {
	return {
		storeId: 2,
		slug: 'kookint',
	};
};

const start = async () => {
	try {
		console.log(`Storystore CSV -> JSON`);
		console.log(
			'------------------------------------------------------------------'
		);
		const store = getStore();
		// Get store table
		console.log(`Importing '${store.slug}'...`);
		console.log('Please wait...');

		// Convert CSV to JSON
		const jsonArr = await csvToJson(store.slug, 'kookint.csv');

		// Get shelves and variations
		const { shelves, variations } = getShelvesAndVariations(jsonArr);

		// // Inject Assets to variations
		const idToSlugMap = shelfIdToShelfSlugMap(shelves);
		injectAssets(variations, store.storeId, store.slug, idToSlugMap);

		// // Write to json files
		let saveFileResp = '';
		saveFileResp = await saveToJson(shelves, store.slug, 'shelves');
		console.log('***', saveFileResp);
		// saveFileResp = await saveToJson(variations, store.slug, 'variations');
		// console.log('***', saveFileResp);
		
		// Batch insert to DB
		let dbInsertResp = '';
		dbInsertResp = await insertShelves(shelves, false);
		console.log('###', dbInsertResp);

		console.log(`${shelves.length} shelves processed`);
		console.log(`${variations.length} variations processed`);
		console.log(
			'------------------------------------------------------------------'
		);
		console.log('CSV to JSON tool completed succesfully!');
	} catch (err) {
		console.error('ERROR ::::::::::', err);
	}
};

start();
