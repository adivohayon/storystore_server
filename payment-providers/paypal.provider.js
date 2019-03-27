const _ = require('lodash');
const axios = require('axios');

module.exports = class Paypal {
	constructor(isTestEnv) {
		this.clientId = process.env.PAYPAL_CLIENT_ID || '';
		this.clientSecret = process.env.PAYPAL_SECRET || '';
		this.accessToken = '';
		this.apiUrl = isTestEnv ? 'https://api.sandbox.paypal.com' : 'https://api.paypal.com';
		this.axiosConfig = {};
	}

	async generateAccessToken() {
		const payload = 'grant_type=client_credentials';
		const resp = (await axios.post(
			`${this.apiUrl}/v1/oauth2/token`,
			payload,
			{
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
				},
				// withCredentials: true,
				auth: {
					username: this.clientId,
					password: this.clientSecret,
				},
			}
		)).data;
		this.accessToken = resp.access_token;
		this.axiosConfig = {
			headers: { Authorization: 'bearer ' + this.accessToken },
		};
	}

	capturePayment(orderId, token) {
		return axios.post(
			`${this.apiUrl}/v2/checkout/orders/${orderId}/capture`,
			{
				payment_source: {
					// token, // ?
				},
			},
			this.axiosConfig
		);
	}

	orderDetails(orderId) {
		return axios.get(
			`${this.apiUrl}/v2/checkout/orders/${orderId}`,
			this.axiosConfig
		);
	}

	createOrderRequest(intent, dbItems, returnUrl, cancelUrl) {
		const items = dbItems.map(item => {
			return {
				name: `${item.variation.Shelf.name} - ${item.variation.property_label} - ${item.attribute.label}`,
				unit_amount: item.variation.finalPrice,
				quantity: 1,
			};
		});
		return {
			intent,
			application_context: {
				return_url: returnUrl,
				cancel_url: cancelUrl,
			},
			purchase_units: [
				{
					amount: {
						currency_code: 'USD',
						value: 400,
						items,
					},
				},
			],
		};
	}

	createOrder(orderRequest) {
		return axios
			.post(
				`${this.apiUrl}/v2/checkout/orders`,
				orderRequest,
				this.axiosConfig
			)
	}
};
