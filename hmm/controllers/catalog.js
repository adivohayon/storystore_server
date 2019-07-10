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
			const products = await wooCommerce.listProducts('simple');

			// return res.json(products[0]);
			const storystoreConnector = new StorystoreConnector(
				Store,
				Shelf,
				Variation,
				Attribute
			);
			let numberOfInjectedProducts = 0;
			for (const product of products) {
				try {
					const { shelf, variation } = await wooCommerce.parseProduct(
						product,
						Item_Property
					);

					let attribute;
					if (product.type === 'simple') {
						attribute = {
							label: '',
							value: '',
							itemPropertyId: wooCommerce.simpleItemPropertyId,
						};
					}

					const { dbShelf, dbVariation } = await storystoreConnector.injectItem(
						storeId,
						shelf,
						variation,
						attribute,
						product.id
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
			const categories = await wooCommerce.listAllCategories();
			return res.send(categories);
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
