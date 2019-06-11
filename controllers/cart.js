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
					'WOOCOMMERCE'
				) {
					connector = new WoocommerceConnector(
						settings.integrations[cartIntegrationIndex]
					);

					await connector.getToken(store, cartIntegrationIndex);
				}
			}

			if (!connector) {
				connector = new DefaultConnector();
			}

			// Connector logic starts
			connector.addToCart();
			return res.json(connector.token);

			// return res.send(response);
		} catch (err) {
			res.send(err.toString());
		}
	});
};
