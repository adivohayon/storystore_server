const WoocommerceConnector = require('./../../connectors/woocommerce.connector');
const prompt = require('prompt');
const jsonfile = require('jsonfile');

const tool = {
	connector: null,
	promptHandler: () => {
		return new Promise((resolve, reject) => {
			const schema = {
				properties: {
					baseUrl: {
						description: 'Woocommerce Base URL',
						type: 'string',
						default: 'http://localhost:8080',
						required: true,
					},
					username: {
						description: 'Woocommerce Username',
						type: 'string',
						default: 'adivohayon',
						required: true,
					},
					password: {
						description: 'Woocommerce Password',
						type: 'string',
						default: 'Stinger21',
						hidden: true,
					},
				},
			};

			prompt.get(schema, (err, result) => {
				if (err) {
					reject(err);
				}
				result.type = 'catalog';
				result.connector = 'WOOCOMMERCE';
				resolve(result);
			});
		});
	},
	run: async () => {
		try {
			const integration = await tool.promptHandler();
			tool.connector = new WoocommerceConnector(integration);
			await tool.connector.getToken();

			const products = await tool.connector.listProducts();
			// console.log(products);
			const variations = await tool.convertToStorystore(products);
			console.log('variations', variations);
			tool.exportJSON('variations', variations);
		} catch (err) {
			console.log(
				'\n\n-------------------------------------------------------------------\n'
			);
			console.log('\t######### Error:', err.toString(), ' #########\n');
		}

		// const connector = new WoocommerceConnector();
	},

	// TODO: this func is not done yet
	convertToStorystore: WCProducts => {
		return new Promise(async (resolve, reject) => {
			try {
				const shelves = [];
				for (const product of WCProducts) {
					const shelf = {
						slug: product.slug,
						name: product.name,
						description: product.short_description,
						info: product.description,
					};

					// Has variations
					if (product.type === 'variable') {
						const WCVariations = await tool.connector.listProductVariations(
							product.id
						);
						resolve(WCVariations);
					}
					// No variations
					else {
						resolve();
					}
				}
			} catch (err) {
				reject(err);
			}
		});
	},
	exportJSON: (name, data) => {
		const file = `./tmp/woocommerce-${name}.json`;
		jsonfile.writeFileSync(file, data);
	},
};

tool.run();
