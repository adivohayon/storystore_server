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

						variations = _.uniqBy(
							variations.concat({
								...current.variation,
							}),
							'id'
						);

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

	injectTables(shelves, variations, attributes) {
		let transaction;
		return new Promise(async (resolve, reject) => {
			try {
				// BEGIN LOOP - shelves
				for (const { slug, name, description, info, shelf_order } of shelves) {
					// Find or create shelf
					const [shelf] = await this.Models.Shelf.findCreateFind({
						where: { slug, StoreId: this.storeId },
						defaults: {
							slug,
							shelf_order: Number(shelf_order),
							name: name.trim(),
							description: description.trim(),
							info: info.trim(),
						},
					});

					// BEGIN LOOP - variations
					const dbVariationPromises = [];
					for (const {
						id,
						slug,
						price,
						sale_price,
						currency,
						property_label,
						property_value,
						ItemPropertyId,
					} of variations) {
						// Get attributes for variation
						const variationAttributes = attributes.filter(
							attr => attr.variation_id === id
						);

						// Push create variation promise
						dbVariationPromises.push(
							this.Models.Variation.findOrCreate({
								where: { slug, ShelfId: shelf.id },
								defaults: {
									ShelfId: shelf.id,
									slug,
									currency,
									price: Number(price) || 0,
									sale_price: Number(sale_price) || null,
									property_label: property_label.trim(),
									property_value: property_value.trim(),
									ItemPropertyId: Number(ItemPropertyId) || 0,
								},
								// transaction,
							})
								.then(async dbVariation => {
									// BEGIN LOOP - attributes
									const upsertAttributesPromises = [];
									for (const {
										label,
										value,
										ItemPropertyId,
									} of variationAttributes) {
										// push findOrCreate for each attribute to promises
										const dbAttribute = this.Models.Attribute.findOrCreate({
											where: { label, value },
											defaults: {
												label,
												value,
												ItemPropertyId: Number(ItemPropertyId) || 1,
											},
											// transaction,
										}).then(([instance, created]) => instance);

										upsertAttributesPromises.push(dbAttribute);
									}
									// END LOOP - attributes

									// Add attributes to variation
									return Promise.all(upsertAttributesPromises)
										.then(dbAttributes => {
											console.log('dbAttributes', dbAttributes);
											return dbVariation[0].addAttributes(dbAttributes);
										})
										.catch(e => reject(e));
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
