/*******************************
 *******  	  VARIATIONS	 	 *******
 *******************************/
import { knex } from '../db';
import { dropTableIfExists } from '../../helpers/db.helper';
/*
	sku: 'TLDSAD',
	attributes: {
		color: {label: 'שחור', value: '#000000'},
		size: {label: 'בינוני', value: 'M' }
	}
	content: 
*/
export const createVariationsTable = async () => {
	const dropTable = dropTableIfExists(knex, 'variations');
	const createTable = knex.schema.createTable('variations', table => {
		table.increments('variation_id').unique(); // id
		table.string('sku');
		table.text('attributes'); // type (size, color)
		table.text('content');

		table.timestamps(null, true);
		table.integer('shelf_id').notNullable();

		// Indeces
		table
			.foreign('shelf_id')
			.onDelete('CASCADE')
			.references('shelf_id')
			.on('shelves');
	});

	return Promise.all([dropTable, createTable]);
};

export const seedVariationsTable = async () => {
	const attributes = [
		{
			color: { label: 'שחור', value: '#000000' },
			size: { label: 'בינוני', value: 'M' },
		},
		{
			color: { label: 'שחור', value: '#000000' },
			size: { label: 'גדול', value: 'L' },
		},
		{
			color: { label: 'חרדל', value: '#B99557' },
			size: { label: 'בינוני', value: 'M' },
		},
		{
			color: { label: 'חרדל', value: '#B99557' },
			size: { label: 'גדול', value: 'L' },
		},
	];

	const content = [
		{ type: 'image', value: 'assets/simplyfashion_dress_black_front.jpg' },
		{ type: 'image', value: 'assets/simplyfashion_dress_black_back.jpg' },
		{ type: 'image', value: 'assets/simplyfashion_dress_black_side.jpg' },
		{ type: 'image', value: 'assets/simplyfashion_dress_black_closeup.jpg' },
		{ type: 'image', value: 'assets/simplyfashion_dress_black_video.mp4' },
		{
			type: 'description',
			value: `שמלת מיני דקיקה בגזרה לוזית בשילוב קפוצ'ון אורך: 82 ס"מ, היקף: 90 ס"מ`,
		},
	];

	const variations = [
		{ sku: 'ABCD', attributes: JSON.stringify(attributes[0]), shelf_id: 1, content: JSON.stringify(content) },
		{ sku: 'EFGH', attributes: JSON.stringify(attributes[1]), shelf_id: 1, content: JSON.stringify(content) },
		{ sku: 'IJKL', attributes: JSON.stringify(attributes[2]), shelf_id: 1, content: JSON.stringify(content) },
		{ sku: 'MNOP', attributes: JSON.stringify(attributes[3]), shelf_id: 2, content: JSON.stringify(content) },
	];
	return knex.batchInsert('variations', variations);
};
