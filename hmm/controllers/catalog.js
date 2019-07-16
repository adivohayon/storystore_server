const StorystoreConnector = require('./../connectors/storystore.connector');
module.exports = (
	app,
	{ sequelize, Store, Shelf, Variation, Attribute, Item_Property, Category }
) => {
	app.get('/ping', async (req, res) => {
		res.send('pong');
	});

	app.get('/:storeId', async (req, res) => {
		const storeId = Number(req.params.storeId);
		if (!storeId) {
			throw new Error('StoreId not provided');
		}

		const categories = await Category.findAll({ where: { StoreId: storeId } });
		res.render('catalog/index', { categories });
	});

	app.get('/import', async (req, res) => {
		res.render('catalog/import');
	});

	app.post('/import/woocommerce', async (req, res) => {
		try {
			const { baseUrl, username, password, storeId } = req.body;
			if (!baseUrl || !username || !password || !Number.isInteger(storeId)) {
				throw new Error('Missing or invalid arguments');
			}
			const WooCommerce = require('../connectors/woocommerce.connector');
			const wooCommerce = new WooCommerce(baseUrl, username, password);
			const token = await wooCommerce.getToken();

			// Get storystore category
			const categories = await wooCommerce.listCategories();
			const wcParentCategoryId =
				wooCommerce.getCategoryBySlug('shop', categories).id || null; // change this to storystore

			if (!wcParentCategoryId) {
				throw new Error(`Could not find category 'storystore'`);
			}

			const storystoreConnector = new StorystoreConnector(
				Store,
				Shelf,
				Variation,
				Attribute,
				Category
			);

			const wcCategories = wooCommerce.getCategoryChildren(
				wcParentCategoryId,
				categories
			);
			const categoriesExternalToDbMap = {};
			// return res.json(parentCategories);
			console.log('parentCategories', wcCategories);
			for (const wcCategory of wcCategories) {
				const parsedCategory = wooCommerce.parseCategory(wcCategory);
				const dbCategory = await storystoreConnector.injectCategory(
					parsedCategory,
					storeId
				);
				categoriesExternalToDbMap[wcCategory.id] = dbCategory.id;
			}

			// Get storystore subcategories
			const products = await wooCommerce.listProducts(
				'simple',
				wcParentCategoryId
			);

			// return res.json(products[0]);
			// return res.json(products);

			const store = await Store.findOne({ where: { id: storeId } });
			console.log('catalog / import/woocommerce / storeSlug', store.slug);
			let numberOfInjectedProducts = 0;
			for (const product of products) {
				try {
					const { shelf, variation } = await wooCommerce.parseProduct(
						product,
						Item_Property,
						store.slug
					);

					let attribute;
					if (product.type === 'simple') {
						attribute = {
							label: '',
							value: '',
							itemPropertyId: wooCommerce.simpleItemPropertyId,
						};
					}

					const productCategories = product.categories
						.filter(category => category.id !== wcParentCategoryId)
						.map(wooCommerce.parseCategory);

					// return res.json(categoriesIds);
					// continue;
					const { dbShelf, dbVariation } = await storystoreConnector.injectItem(
						storeId,
						shelf,
						variation,
						attribute,
						product.id,
						productCategories,
						categoriesExternalToDbMap
					);

					console.log(
						'---- Item injected ----',
						`shelfId: ${dbShelf.id},  variationId: ${dbVariation.id},  ${
							dbShelf.slug
						} - ${dbVariation.slug}`
					);
					numberOfInjectedProducts++;
				} catch (err) {
					console.error('#### Item NOT injected ####', err.toString());
					continue;
				}
				// parsedProducts.push(wooCommerce.parseProduct(product, Item_Property));
			}

			return res.send(`${numberOfInjectedProducts} products injected`);
		} catch (err) {
			console.error(err);
			return res.sendStatus(500).send(err.toString());
		}
	});

	app.post('/import/categories', async (req, res) => {
		try {
			const { baseUrl, username, password, storeId } = req.body;
			if (!baseUrl || !username || !password || !Number.isInteger(storeId)) {
				throw new Error('Missing or invalid arguments');
			}
			const WooCommerce = require('../connectors/woocommerce.connector');
			const wooCommerce = new WooCommerce(baseUrl, username, password);
			const token = await wooCommerce.getToken();
			const wcCategories = await wooCommerce.listAllCategories();

			const storystoreConnector = new StorystoreConnector(
				Store,
				Shelf,
				Variation,
				Attribute,
				Category
			);

			let numberOfInjectedCategories = 0;
			for (const wcCategory of wcCategories) {
				try {
					const category = await wooCommerce.parseCategory(wcCategory);

					const dbCategory = await storystoreConnector.injectCategory(
						storeId,
						category
					);

					console.log(
						'---- Item injected ----',
						`categoryId: ${dbCategory.id}, ${dbCategory.slug}`
					);
					numberOfInjectedCategories++;
				} catch (err) {
					console.error('#### Category NOT injected ####', err.toString());
					continue;
				}
				// parsedProducts.push(wooCommerce.parseProduct(product, Item_Property));
			}

			return res.send(`${numberOfInjectedCategories} Categories injected`);
		} catch (err) {
			console.error(err);
			return res.sendStatus(500).send(err.toString());
		}
	});

	app.post('/categories', async (req, res) => {
		const { slug, label, storeId } = req.body;
		if (!slug || !label) {
			throw new Error('Missing fields');
		}
		try {
			const category = await Category.create({
				slug,
				label,
				parent_id: 0,
				StoreId: storeId,
			});
			return res.json(category);
		} catch (err) {
			console.error('::POST::  Catalog / Categories', err.toString());
			return res.sendStatus(500).send(err.toString());
		}
	});
};
