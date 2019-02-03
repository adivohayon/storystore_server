import { knex } from './db';
/*
{
	"shelfId": 1,
  "name": "Talya Dress",
  "price": "49.00",
  "currency": "$",
	"slug": "talya-dress",
	"variations": [
		{skuId: 1, skuAttributes: jsonparsed, content: [{type, value}] },
		{skuId: 2, skuAttributes: jsonparsed },
	],
}

*/
export const Shelves = {
	findAll: storeId => {
		return new Promise(async (resolve, reject) => {
			try {
				const shelves = await knex
					.select(
						'shelves.shelf_id AS shelfId',
						'shelves.name',
						'shelves.price',
						'shelves.currency',
						'shelves.slug',
						'shelves.description',
						'shelves.sale',
					)
					.from('shelves')
					.where({ store_id: storeId });

				const allShelves = [];
				for (const shelf of shelves) {
					const variations = await knex
						.select(
							'variations.variation_id AS variationId',
							'sku',
							'attributes',
							'content'
						)
						.from('variations')
						.where({ shelf_id: shelf.shelfId })
						.map(variation => {
							return {
								variationId: variation.variationId,
								sku: variation.sku,
								attributes: JSON.parse(variation.attributes),
								content: JSON.parse(variation.content),
							};
						});

					allShelves.push({ ...shelf, variations });
				}
				resolve(allShelves);
			} catch (err) {
				reject(err);
			}
		});
		return;
	},
	find: (storeId, shelfId) => {
		return new Promise(async (resolve, reject) => {
			try {
				const shelf = await knex
					.select(
						'shelves.shelf_id AS shelfId',
						'shelves.name',
						'shelves.price',
						'shelves.currency',
						'shelves.slug'
					)
					.from('shelves')
					.where({ store_id: storeId, 'shelves.shelf_id': shelfId })
					.then(rows => rows[0]);

				const variations = await knex
					.select(
						'variations.variation_id AS variationId',
						'sku',
						'attributes',
						'content'
					)
					.from('variations')
					.where({ shelf_id: shelfId })
					.map(variation => {
						return {
							variationId: variation.variationId,
							sku: variation.sku,
							attributes: JSON.parse(variation.attributes),
							content: JSON.parse(variation.content),
						};
					});

				const fullShelf = { ...shelf, variations };
				console.log('fullShelf', fullShelf);

				resolve(fullShelf);
			} catch (err) {
				console.error(err);
				reject(err);
			}
		});
	},
};
