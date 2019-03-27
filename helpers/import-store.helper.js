'use strict';
const csvtojson = require('csvtojson');

module.exports = class ImportStore {
	constructor(Store) {
		this.Store = Store;
	}

	csvToTables(csvStr) {
		return new Promise(async (resolve, reject) => {
			try {
				const stores = (await csvtojson().fromString(csvStr)).map(v => v.store);
				resolve(stores);
			} catch (err) {
				console.log('!!!ERROR!!! - Import Helper / csvToTables', err);
				reject(err);
			}
		});
	}

	injectTable(stores) {
		const upsertPromises = [];
		for (const store of stores) {
			upsertPromises.push(
				this.Store.findCreateFind({
					where: { slug: store.slug },
					defaults: {
						name: store.name.trim(),
						slug: store.slug.trim(),
						tagline: store.tagline.trim(),
						about: store.about,
						info: store.info,
						shipping_options: JSON.parse(store.shipping_options),
						shipping_details: store.shipping_details,
						returns: store.returns,
						payment: { test: true },
					},
				})
			);
		}
		// return this.Store.bulkCreate(stores);
		if (upsertPromises.length > 0) {
			return Promise.all(upsertPromises);
		} else {
			return Promise.reject('no promises');
		}
	}
	// injectTables(shelves, variations, attributes, allAssets) {
	// 	let transaction;
	// 	return new Promise(async (resolve, reject) => {
	// 		try {
	// 			// BEGIN LOOP - shelves
	// 			for (const {
	// 				id: shelfCsvId,
	// 				slug: shelfSlug,
	// 				name,
	// 				description,
	// 				info,
	// 				shelf_order,
	// 			} of shelves) {
	// 				// Find or create shelf
	// 				const [shelf] = await this.Models.Shelf.findCreateFind({
	// 					where: { slug: shelfSlug, StoreId: this.storeId },
	// 					defaults: {
	// 						slug: shelfSlug,
	// 						shelf_order: Number(shelf_order),
	// 						name: name.trim(),
	// 						description: description.trim(),
	// 						info: info.trim(),
	// 					},
	// 				});

	// 				const shelfVariations = variations.filter(
	// 					variant => variant.shelfId == shelfCsvId
	// 				);
	// 				// BEGIN LOOP - variations
	// 				const dbVariationPromises = [];
	// 				for (const {
	// 					id: variationCsvId,
	// 					slug: variationSlug,
	// 					price,
	// 					sale_price,
	// 					currency,
	// 					property_label,
	// 					property_value,
	// 					itemPropertyId,
	// 				} of shelfVariations) {
	// 					// Get attributes for variation
	// 					const variationAttributes = attributes.filter(
	// 						attr => attr.variation_id === variationCsvId
	// 					);

	// 					const assets = allAssets
	// 						.filter(key => {
	// 							return key.startsWith(
	// 								[this.storeSlug, shelfSlug, variationSlug, ''].join('/')
	// 							);
	// 						})
	// 						.map(key => key.split('/').pop());

	// 					console.log('itemPropertyId', itemPropertyId);
	// 					// Push create variation promise
	// 					dbVariationPromises.push(
	// 						this.Models.Variation.findCreateFind({
	// 							where: { slug: variationSlug, ShelfId: shelf.id },
	// 							defaults: {
	// 								ShelfId: shelf.id,
	// 								slug: variationSlug,
	// 								currency,
	// 								price: Number(price) || 0,
	// 								sale_price: Number(sale_price) || null,
	// 								property_label: property_label.trim(),
	// 								property_value: property_value.trim(),
	// 								itemPropertyId: Number(itemPropertyId) || null,
	// 								assets,
	// 							},
	// 							// transaction,
	// 						})
	// 							.then(async dbVariation => {
	// 								//console.log(dbVariation, id, dbVariation.slug);
	// 								// BEGIN LOOP - attributes
	// 								const upsertAttributesPromises = [];
	// 								for (const {
	// 									label,
	// 									value,
	// 									itemPropertyId,
	// 								} of variationAttributes) {
	// 									// push findOrCreate for each attribute to promises
	// 									//console.log('attribute', label);
	// 									const dbAttribute = this.Models.Attribute.findOrCreate({
	// 										where: { label, value },
	// 										defaults: {
	// 											label,
	// 											value,
	// 											itemPropertyId: Number(itemPropertyId) || null,
	// 										},
	// 										// transaction,
	// 									}).then(([instance, created]) => {
	// 										//console.log('created', created);

	// 										// if it was just created make the association
	// 										if (created) {
	// 											return dbVariation[0].addAttribute(instance);
	// 										} else {
	// 											// if not check if it's already associated
	// 											return dbVariation[0]
	// 												.hasAttribute(instance)
	// 												.then(result => {
	// 													// If not associated, make the association
	// 													if (!result) {
	// 														return dbVariation[0].addAttribute(instance);
	// 													} else {
	// 														return instance;
	// 													}
	// 												});
	// 										}
	// 									});

	// 									upsertAttributesPromises.push(dbAttribute);
	// 								}
	// 								// END LOOP - attributes

	// 								// Add attributes to variation
	// 								return Promise.all(upsertAttributesPromises).catch(e =>
	// 									reject(e)
	// 								);
	// 							})
	// 							.catch(e => reject(e))
	// 					);
	// 				}
	// 				// END LOOP - variations

	// 				await Promise.all(dbVariationPromises);
	// 			}
	// 			// END LOOP - shelves
	// 			resolve({ message: 'Import finished successfully' });
	// 		} catch (err) {
	// 			console.log('!!!ERROR!!! - Import Helper / createShelves', err);
	// 			if (err) {
	// 				// await transaction.rollback();
	// 				reject(err);
	// 			}
	// 		}
	// 	});
	// }
};
