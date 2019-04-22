'use strict';

const AWS = require('aws-sdk');
const S3 = new AWS.S3();
const csvtojson = require('csvtojson');
const _ = require('lodash');

module.exports = class Import {
	constructor(storeId, storeSlug, sequelize, Models) {
		this.storeId = storeId;
		this.storeSlug = storeSlug;
		this.sequelize = sequelize;
		this.Models = Models;
	}

	getAssets() {
		return new Promise(async (resolve, reject) => {
			try {
				let assets = [];
				for (let ContinuationToken; ; ) {
					const {
						Contents,
						NextContinuationToken,
						IsTruncated,
					} = await S3.listObjectsV2({
						Bucket: process.env.BUCKET,
						Prefix: this.storeSlug,
						ContinuationToken,
					}).promise();
					assets = assets.concat(
						Contents.map(({ Key }) => Key).filter(key =>
							/\.(jpg|mp4)$/.test(key)
						)
					);
					if (!IsTruncated) break;
					ContinuationToken = NextContinuationToken;
				}
				if (!assets.length) {
					reject(`Could not find assets for '${this.storeSlug}'`);
				}
				resolve(assets);
				// const mappedAssets = assets.map(asset => {
				// 	const [store, shelf, variation, fileName]  = asset.split('/');
				// 	return
				// })
				// resolve(mappedAssets);
			} catch (err) {
				console.log('!!!ERROR!!! - Import Helper / getAssets', err);
				reject(err);
			}
		});
	}

	csvToTables(csvStr) {
		return new Promise(async (resolve, reject) => {
			try {
				const csv = await csvtojson().fromString(csvStr);
				const tables = csv.reduce(
					({ shelves = [], variations = [], attributes = [] }, current) => {
						// const shelves = _.uniqBy(acc.shelves);
						shelves = _.uniqBy(
							shelves.concat({
								...current.shelf,
							}),
							'id'
						);

						// variations = variations.concat({
						// 	...current.variation,
						// });
						// variations = variations.filter(function(variant) {
						// 	const key = variant.shelfId + '|' + variant.slug;
						// 	console.log('key', key);
						// 	if (!this[key]) {
						// 		this[key] = true;
						// 		return true;
						// 	}
						// }, Object.create(null));

						variations = _.uniqBy(
							variations.concat({
								...current.variation,
							}),
							'id'
						);

						// const vars = test(variations);
						// console.log(vars);
						// return { variations };

						// variations = _.uniqBy(
						// 	variations.concat({
						// 		...current.variation,
						// 	}),
						// 	'id'
						// );

						// variations = variations.concat({
						// 	...current.variation,
						// });

						attributes = attributes.concat({ ...current.attributes });
						return {
							variations,
							shelves,
							attributes,
						};
						// return current.variation;
						// return shelves;
					},
					{}
				);

				resolve(tables);
			} catch (err) {
				console.log('!!!ERROR!!! - Import Helper / csvToTables', err);
				reject(err);
			}
		});
	}

	injectTables(shelves, variations, attributes, allAssets) {
		let transaction;
		return new Promise(async (resolve, reject) => {
			try {
				// BEGIN LOOP - shelves
				for (const {
					id: shelfCsvId,
					slug: shelfSlug,
					name,
					description,
					info,
					shelf_order,
				} of shelves) {
					// Find or create shelf
					const [shelf] = await this.Models.Shelf.findCreateFind({
						where: { slug: shelfSlug, StoreId: this.storeId },
						defaults: {
							slug: shelfSlug,
							shelf_order: Number(shelf_order),
							name: name.trim(),
							description: description.trim(),
							info: info.trim(),
						},
					});

					const shelfVariations = variations.filter(
						variant => variant.shelfId == shelfCsvId
					);
					// BEGIN LOOP - variations
					const dbVariationPromises = [];
					for (const {
						id: variationCsvId,
						slug: variationSlug,
						price,
						sale_price,
						currency,
						property_label,
						property_value,
						itemPropertyId,
						product_url,
						variation_order
					} of shelfVariations) {
						// Get attributes for variation
						const variationAttributes = attributes.filter(
							attr => attr.variation_id === variationCsvId
						);
						
						// return res.json(variationAttributes);
						// console.log('variationAttributes', variationAttributes);
						const assets = allAssets
							.filter(key => {
								return key.startsWith(
									[this.storeSlug, shelfSlug, variationSlug, ''].join('/')
								);
							})
							.map(key => key.split('/').pop());

						console.log('itemPropertyId', itemPropertyId);
						// Push create variation promise
						dbVariationPromises.push(
							this.Models.Variation.findCreateFind({
								where: { slug: variationSlug, ShelfId: shelf.id },
								defaults: {
									ShelfId: shelf.id,
									slug: variationSlug,
									currency,
									price: Number(price) || 0,
									sale_price: Number(sale_price) || null,
									property_label: property_label.trim(),
									property_value: property_value.trim(),
									itemPropertyId: Number(itemPropertyId) || null,
									product_url: product_url,
									assets,
									variation_order: Number(variation_order) || null,
								},
								// transaction,
							})
								.then(async dbVariation => {
									//console.log(dbVariation, id, dbVariation.slug);
									if (variationAttributes.length === 0) {
										variationAttributes.push({label: null, value: null, itemPropertyId: null});
									}
									// BEGIN LOOP - attributes
									const upsertAttributesPromises = [];
									for (const {
										label,
										value,
										itemPropertyId,
									} of variationAttributes) {
										// push findOrCreate for each attribute to promises
										//console.log('attribute', label);
										const dbAttribute = this.Models.Attribute.findOrCreate({
											where: { label, value },
											defaults: {
												label,
												value,
												itemPropertyId: Number(itemPropertyId) || null,
											},
											// transaction,
										}).then(([instance, created]) => {
											//console.log('created', created);


											// if it was just created make the association
											if (created) {
												return dbVariation[0].addAttribute(instance);
											} else {
												// if not check if it's already associated
												return dbVariation[0]
													.hasAttribute(instance)
													.then(result => {
														// If not associated, make the association
														if (!result) {
															return dbVariation[0].addAttribute(instance);
														} else {
															return instance;
														}
													});
											}
										});

										upsertAttributesPromises.push(dbAttribute);
									}
									// END LOOP - attributes

									// Add attributes to variation
									return Promise.all(upsertAttributesPromises).catch(e =>
										reject(e)
									);
								})
								.catch(e => reject(e))
						);
					}
					// END LOOP - variations

					await Promise.all(dbVariationPromises);
				}
				// END LOOP - shelves
				resolve({ message: 'Import finished successfully' });
			} catch (err) {
				console.log('!!!ERROR!!! - Import Helper / createShelves', err);
				if (err) {
					// await transaction.rollback();
					reject(err);
				}
			}
		});
	}
};
