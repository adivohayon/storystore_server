const axios = require('axios');
const DefaultConnector = require('./default.connector');

module.exports = class WoocommerceConnector extends DefaultConnector {
	constructor(baseURL, username, password, Models, Sequelize) {
		super(Models, Sequelize);
		this.baseURL = baseURL;
		this.username = username;
		this.password = password;
		this.token = null;
		// this.generateAuthToken(username, passweord);
	}

	// ORDER --------------------------------------
	generateAuthToken() {
		return new Promise(async (resolve, reject) => {
			const url = this.baseURL + '/jwt-auth/v1/token';
			console.log('url', url);
			try {
				const {
					data: { token },
				} = await axios.post(this.baseURL + 'jwt-auth/v1/token', {
					username: this.username,
					password: this.password,
				});

				console.log('auth token', token);
				this.token = token;
				resolve(token);
			} catch (err) {
				reject(err);
			}
		});
	}

	WC_createOrder(wcOrderRequest) {
		return new Promise(async (resolve, reject) => {
			const url = this.baseURL + 'wc/v3/orders';
			console.log('url', url);
			try {
				const { data } = await axios.post(url, wcOrderRequest, {
					headers: {
						Authorization: 'Bearer ' + this.token,
						'Content-Type': 'application/json;charset=UTF-8',
					},
				});

				if (!data) {
					reject(
						'There was a problem creating a new order on Woocommerce - ' + url
					);
				}
				resolve(data);
			} catch (err) {
				console.log(err.response.data);
				reject(err);
			}
		});
	}

	WC_getLineItems(requestItems, quantitiesMap) {
		const lineItems = requestItems.map(item => {
			const lineItem = {
				product_id: item.productId || 0,
				variation_id: item.variationId || 0,
				quantity: quantitiesMap[item.productId] || 1,
				// quantity
			};
			return lineItem;
		});

		return lineItems;
	}

	WC_getShippingLines(shipping) {
		return [
			{
				method_id: 'flat_rate',
				method_title: shipping.type,
				total: String(shipping.price),
			},
		];
	}

	WC_OrderRequest(customer, requestItems, quantitiesMap, shipping) {
		const lineItems = this.getWCLineItems(requestItems, quantitiesMap);
		const shippingLines = this.getWCShippingLines(shipping);
		const req = {
			payment_method: 'bacs',
			payment_method_title: 'storystore',
			shipping: {
				first_name: customer.first_name,
				last_name: customer.last_name,
				address_1: customer.shipping_address,
				city: customer.shipping_city,
				state: customer.shipping_state_code || '',
				postcode: String(customer.shipping_zip_code),
				country: customer.shipping_country_code,
			},
			line_items: lineItems,
			shipping_lines: shippingLines,
		};

		console.log('WCOrderRequest', req);
		return req;
	}

	WC_AddToCart(item) {

	}
};
