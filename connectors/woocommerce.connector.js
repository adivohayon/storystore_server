const axios = require('axios');
const DefaultConnector = require('./default.connector');

module.exports = class WoocommerceConnector extends DefaultConnector {
	constructor(baseURL) {
		super();
		this.setConnectorName('woocommerce');
		this.baseURL = baseURL;
		this.token = null;
		this.headers = null;
	}

	// GENERATE TOKEN
	generateAuthToken(username, password) {
		return new Promise(async (resolve, reject) => {
			const url = this.baseURL + '/wp-json/jwt-auth/v1/token';
			try {
				const {
					data: { token },
				} = await axios.post(url, {
					username: username,
					password: password,
				});

				console.log('auth token', token);

				this.setToken(token);

				resolve(token);
			} catch (err) {
				console.log(err);
				reject(err);
			}
		});
	}

	addToCart(item) {
		console.log('woocommerce cart');
		// const { data } = await axios.post(url, data, {
		// 	headers: this.headers
		// });

		super.addToCart(item);
	}

	setToken(token) {
		this.token = token;
		this.headers = {
			Authorization: 'Bearer ' + token,
			'Content-Type': 'application/json;charset=UTF-8',
		};
	}
};
