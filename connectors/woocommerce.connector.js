const axios = require('axios');
const DefaultConnector = require('./default.connector');

module.exports = class WoocommerceConnector extends DefaultConnector {
	constructor(integration) {
		super();
		super.setConnectorName('woocommerce');
		this.baseURL = integration.baseUrl;
		this.username = integration.username;
		this.password = integration.password;
		this.token = integration.token || null;
	}

	// HEADERS
	getHeaders() {
		if (this.token) {
			return {
				headers: {
					Authorization: 'Bearer ' + this.token,
					'Content-Type': 'application/json;charset=UTF-8',
				},
			};
		} else {
			return {};
		}
	}

	// BEGIN TOKEN
	getToken(storeInstance, integrationIndex) {
		return new Promise(async (resolve, reject) => {
			try {
				if (this.token) {
					await this.validateToken();
					resolve(this.token);
				} else {
					await this.generateAuthToken(storeInstance, integrationIndex);
					resolve(this.token);
				}
			} catch (err) {
				if (err.response.data.code === 'jwt_auth_invalid_token') {
					await this.generateAuthToken(storeInstance, integrationIndex);
					resolve(this.token);
				} else {
					console.log(err);
					reject(err);
				}
			}
		});
	}

	validateToken() {
		const endpoint = this.baseURL + '/wp-json/jwt-auth/v1/token/validate';
		return axios.post(endpoint, null, this.getHeaders());
	}

	generateAuthToken(storeInstance, integrationIndex) {
		return new Promise(async (resolve, reject) => {
			const url = this.baseURL + '/wp-json/jwt-auth/v1/token';
			try {
				const {
					data: { token },
				} = await axios.post(url, {
					username: this.username,
					password: this.password,
				});

				console.log('auth token', token);

				this.token = token;

				if (storeInstance) {
					const settings = Object.assign({}, storeInstance.settings);
					settings.integrations[integrationIndex].token = this.token;
					storeInstance.settings = settings;
					await storeInstance.save();
				}
				resolve(token);
			} catch (err) {
				console.log(err);
				reject(err);
			}
		});
	}
	// END TOKEN

	// BEGIN CATALOG
	listProducts() {
		const endpoint = this.baseURL + '/wp-json/wc/v3/products';
		return axios
			.get(endpoint, this.getHeaders())
			.then(resp => resp.data)
			.catch(err => {
				throw new Error(err.toString());
			});
	}

	listProductVariations(productId) {
		const endpoint = this.baseURL + '/wp-json/wc/v3/products/' + productId + '/variations';
		return axios
			.get(endpoint, this.getHeaders())
			.then(resp => resp.data)
			.catch(err => {
				throw new Error(err.toString());
			});
	}
	// END CATALOG
};
