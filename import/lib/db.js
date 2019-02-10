import { knex } from './../../models/db';
import { createShelvesTable } from './../../models/seed/shelves.seed.model';
export const insertShelves = async (shelves, createTable=false) => {
	try {
		if (createTable) {
			const createTableResp = await createShelvesTable();
			console.log('Insert Shelves: Created table', createTableResp);
		}
		return knex.batchInsert('shelves', shelves);
	}
	catch(err) {
		console.error('ERROR: INSERT SHELVES', err);
		return err;
	}
	
};

export const insertVariations = variations => {
	return knex.batchInsert('variations', variations);
};
