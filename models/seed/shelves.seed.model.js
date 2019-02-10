/*******************************
 *******  	  SHELVES	 	 *******
 *******************************/
import { knex } from './../db';
import { dropTableIfExists } from './../../helpers/db.helper';

export const createShelvesTable = async () => {
	const dropTable = dropTableIfExists(knex, 'shelves');
	const createTable = knex.schema.createTable('shelves', table => {
		table.increments('shelf_id').unique(); // id
		table.integer('order');
		table.string('slug').unique();
		table.string('name'); // name
		table.string('short_description');
		table.text('info');
		
		// table.text('sale');
		// table.decimal('price', 5);

		table.integer('store_id').notNullable();
		// table.integer('category_id').notNullable();

		table.timestamps(null, true);

		// Indeces
		table
			.foreign('store_id')
			.onDelete('CASCADE')
			.references('store_id')
			.on('stores');

		table
			.foreign('category_id')
			.onDelete('CASCADE')
			.references('category_id')
			.on('categories');
	});

	return Promise.all([dropTable, createTable]);
};

export const seedShelvesTable = async () => {
	const shelfSale = {
		saleText: 'מבצע קני היום 1+1 !',
		saleComment: 'ההנחה תתעדכן בסל הקניות',
	};
	const shelves = [
		{
			name: 'Talya Dress',
			price: 49,
			currency: '$',
			slug: 'talya-dress',
			store_id: 1,
			category_id: 1,
			description: `שמלת פולו
				שמלת פולו מדוייקת לחורף של ישראל, מעוצבת בסגנון המחויט ששם אותך בדיוק  במראה האלגנטי

				שלא מתאמץ. תוספות הצווארון, השרוול והתחתית מעניקים מראה מתוחכם ומעניין שיכול להתאים
				
				לכל זמן ולכל יציאה. עם סניקרס למראה סטרייט סטייל מגניב או ליציאה עם עקב למראה אצילי.
				
				השמלה תפורה מבד סריג וופל נעים ורך מאוד.
				
				קיימת בצבע כחול ובורדו.
		`,
			sale: JSON.stringify(shelfSale),
		},
		{
			name: 'Cool shirt',
			price: 29,
			currency: '$',
			slug: 'cool-shirt',
			store_id: 1,
			category_id: 2,
		},
	];
	return knex.batchInsert('shelves', shelves);
};
