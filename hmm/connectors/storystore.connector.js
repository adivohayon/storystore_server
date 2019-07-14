module.exports = class Storystore {
	constructor(
		StoreModel,
		ShelfModel,
		VariationModel,
		AttributeModel,
		CategoryModel
	) {
		this.Store = StoreModel;
		this.Shelf = ShelfModel;
		this.Variation = VariationModel;
		this.Attribute = AttributeModel;
		this.Category = CategoryModel;
		this.externalToDbCategoriesMap = {};
	}

	// InjectCategories
	async injectCategory(category, storeId, parentId = 0, dbShelf) {
		try {
			console.log('inject category', category);
			const [dbCategory] = await this.Category.findCreateFind({
				where: { slug: category.slug, StoreId: storeId },
				defaults: {
					slug: category.slug,
					label: category.label ? category.label.trim() : '',
					parent_id: parentId,
					external_id: Number(category.external_id),
				},
			});

			// if (dbShelf) {
			// 	await dbShelf.addCategory(dbCategory, {
			// 		through: { external_id:  Number(category.external_id) || null },
			// 	});
			// }

			return dbCategory;
		} catch (err) {
			console.error('Storystore Connector / injectCategory', err.toString());
		}
	}

	async injectItem(
		storeId,
		shelf,
		variation,
		attribute,
		externalId,
		categories,
		categoriesExternalToDbMap
	) {
		try {
			const dbShelf = await this.injectShelf(shelf, storeId);
			const dbVariation = await this.injectVariation(variation, dbShelf.id);
			const toReturn = {
				dbShelf,
				dbVariation,
			};

			if (attribute) {
				const dbAttribute = await this.injectAttribute(
					attribute.label,
					attribute.value,
					attribute.itemPropertyId,
					externalId,
					dbVariation
				);
				toReturn.dbAttribute = dbAttribute;
			}

			if (categories && categories.length > 0) {
				for (const category of categories) {
					const dbCategory = await this.injectCategory(
						category,
						storeId,
						category.parent_id
					);
					await dbShelf.addCategory(dbCategory, {
						through: { external_id: Number(category.external_id) || null },
					});
				}
				// categoriesIds.forEach(categoryId) {

				// }
			}

			return toReturn;
		} catch (err) {
			console.error('Storystore Connector / injectItem', err.toString());
		}
	}

	async injectVariation(variation, shelfId) {
		const [dbVariation] = await this.Variation.findCreateFind({
			where: { slug: variation.slug, ShelfId: shelfId },
			defaults: {
				ShelfId: shelfId,
				slug: variation.slug,
				currency: variation.currency || '₪',
				price: Number(variation.price) || null,
				sale_price: Number(variation.sale_price) || null,
				property_label: variation.property_label
					? variation.property_label.trim()
					: '',
				property_value: variation.property_value
					? variation.property_value.trim()
					: '',
				itemPropertyId: Number(variation.itemPropertyId) || null,
				product_url: variation.product_url,
				assets:
					variation.assets && variation.assets.length ? variation.assets : [],
				variation_order: Number(variation.variation_order) || null,
				variation_info: variation.variation_info
					? variation.variation_info.trim()
					: null,
			},
		});
		return dbVariation;
	}

	async injectShelf(shelf, storeId) {
		try {
			const [dbShelf] = await this.Shelf.findCreateFind({
				where: { slug: shelf.slug, StoreId: storeId },
				defaults: {
					slug: shelf.slug,
					name: shelf.name ? shelf.name.trim() : '',
					description: shelf.description ? shelf.description.trim() : '',
					info: shelf.info ? shelf.info.trim() : '',
				},
			});
			return dbShelf;
		} catch (err) {
			console.error('Storystore Connector / injectShelf', err.toString());
		}
	}

	async injectAttribute(
		label = '',
		value = '',
		itemPropertyId,
		externalId,
		dbVariation
	) {
		try {
			const [dbAttribute, isCreated] = await this.Attribute.findOrCreate({
				where: { label, value },
				defaults: {
					label,
					value,
					itemPropertyId: Number(itemPropertyId) || null,
				},
			});

			await dbVariation.addAttribute(dbAttribute, {
				through: { external_id: externalId || null },
			});

			// if (isCreated) {

			// } else {
			// 	const hasAttribute = dbVariation.hasAttribute(dbAttribute);
			// 	if (!hasAttribute) {
			// 		await dbVariation.addAttribute(dbAttribute, {
			// 			through: { external_id: externalId || null },
			// 		});
			// 	} else {
			// 		return dbAttribute;
			// 	}
			// }

			return dbAttribute;
		} catch (err) {
			console.error('Storystore Connector / injectShelf', err.toString());
		}
	}
};
