import fs from 'fs';
import path from 'path';
import csv from 'csvtojson';
const _uniqBy = require('lodash.uniqby');

export const saveToJson = (obj, storeSlug, file) => {
	return new Promise((resolve, reject) => {
		const jsonObj = JSON.stringify(obj);
		const timestamp = Date.now();
		const jsonFile = path.resolve(
			__dirname,
			'../',
			'stores',
			storeSlug,
			'json',
			`${storeSlug}_${file}_${timestamp}.json`
		);
		fs.writeFile(jsonFile, jsonObj, err => {
			if (err) {
				reject(err);
			}

			resolve(`Saved file to ${jsonFile}`);
		});
	});
};

export const csvToJson = (storeSlug, filename) => {
	const csvFile = path.resolve(__dirname, '../', 'stores', storeSlug, filename);
	return csv().fromFile(csvFile);
};


export const getShelvesAndVariations = jsonArr => {
	const allShelves = [];
	const allVariations = [];

	jsonArr.forEach(row => {
		if (row.shelf) {
			allShelves.push(row.shelf);
		}
		if (row.variation) {
			allVariations.push(row.variation);
		}
	});

	const uniqueShelves = _uniqBy(allShelves, 'shelf_id');

	return { shelves: uniqueShelves, variations: allVariations };
};


export const shelfIdToShelfSlugMap = shelves => {
	const idSlugMap = {};
	shelves.forEach(shelf => {
		idSlugMap[shelf.shelf_id] = shelf.slug;
	});

	// console.log('idSlugMap', idSlugMap);
	return idSlugMap;
};