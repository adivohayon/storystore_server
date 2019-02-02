import { knex } from './db';
/*
{
	"shelfId": 1,
  "name": "Talya Dress",
  "price": "49.00",
  "currency": "$",
	"slug": "talya-dress",
	"skus": [
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
						'shelves.slug'
					)
					.from('shelves')
					.where({ store_id: storeId });

				const allShelves = [];
				for (const shelf of shelves) {
					const skus = await knex
						.select('attributes', 'skus.sku_id AS skuId', 'content')
						.from('skus')
						.where({ shelf_id: shelf.shelfId })
						.map(sku => {
							return {
								skuId: sku.skuId,
								attributes: JSON.parse(sku.attributes),
								content: JSON.parse(sku.content),
							};
						});

					// const skuContent = await knex.select('type', 'value').from('sku_content').where()
					allShelves.push({ ...shelf, skus });
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

				const skus = await knex
					.select('attributes', 'skus.sku_id AS skuId', 'content')
					.from('skus')
					.where({ shelf_id: shelfId })
					.map(sku => {
						return {
							skuId: sku.skuId,
							attributes: JSON.parse(sku.attributes),
							content: JSON.parse(sku.content),
						};
					});

				// const skuContent = await knex.select('type', 'value').from('sku_content').where()

				const fullShelf = { ...shelf, skus };
				console.log('fullShelf', fullShelf);

				resolve(fullShelf);
			} catch (err) {
				console.error(err);
				reject(err);
			}
		});
	},
};
