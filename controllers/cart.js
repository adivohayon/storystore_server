const DefaultConnector = require('./../connectors/default.connector');
const WoocommerceConnector = require('./../connectors/woocommerce.connector');

module.exports = (app, { Store }) => {
	app.post('/add-to-cart', async (req, res) => {
		try {
			let connector, token;
			const storeId = +req.body.storeId;

			if (!storeId) {
				throw new Error('No storeId provided');
			}

			const store = await Store.findOne({
				where: { id: storeId },
				attributes: ['id', 'slug', 'settings'],
			});

			const { slug: storeSlug, settings } = store;

			const cartIntegrationIndex = settings.integrations.findIndex(
				integration => integration.type === 'cart'
			);

			if (cartIntegrationIndex > -1) {
				if (
					settings.integrations[cartIntegrationIndex].connector ===
						'WOOCOMMERCE' &&
					settings.integrations[cartIntegrationIndex].baseUrl &&
					settings.integrations[cartIntegrationIndex].username &&
					settings.integrations[cartIntegrationIndex].password
				) {
					connector = new WoocommerceConnector(
						settings.integrations[cartIntegrationIndex].baseUrl
					);

					if (
						settings.integrations[cartIntegrationIndex].token &&
						settings.integrations[cartIntegrationIndex].token.length > 0
					) {
						token = settings.integrations[cartIntegrationIndex].token;
						connector.setToken(token);
					} else {
						token = await connector.generateAuthToken(
							settings.integrations[cartIntegrationIndex].username,
							settings.integrations[cartIntegrationIndex].password
						);
						const clonedSettings = { ...settings };
						clonedSettings.integrations[cartIntegrationIndex].token = token;

						store.settings = clonedSettings;
						await store.save();
					}
				}
			}

			if (!connector) {
				connector = new DefaultConnector();
			}

			// Connector logic starts
			connector.addToCart();
			return res.json(connector.headers);

			// return res.send(response);
		} catch (err) {
			res.send(err.toString());
		}
	});
};
