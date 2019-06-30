const StorystoreConnector = require('./../connectors/storystore.connector');
module.exports = (
	app,
	{ sequelize, Store, Shelf, Variation, Attribute, Item_Property }
) => {
	app.get('/ping', async (req, res) => {
		res.send('pong');
	});
	app.get('/', async (req, res) => {
		res.render('catalog/index');
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
};
