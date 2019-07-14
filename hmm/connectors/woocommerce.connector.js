const _ = require('lodash');
const axios = require('axios');
module.exports = class WooCommerce {
	constructor(baseUrl, username, password, token) {
		this.baseURL = baseUrl;
		this.username = username;
		this.password = password;
		this.token = token || null;
		this.simpleItemPropertyId = null;
	}

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
	getToken() {
		return new Promise(async (resolve, reject) => {
			try {
				if (this.token) {
					await this.validateToken();
					resolve(this.token);
				} else {
					await this.generateToken();
					resolve(this.token);
				}
			} catch (err) {
				const errorCode = _.get(err, 'response.data.code', null);
				if (errorCode === 'jwt_auth_invalid_token') {
					await this.generateToken();
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

	generateToken() {
		return new Promise(async (resolve, reject) => {
			const url = this.baseURL + '/wp-json/jwt-auth/v1/token';
			try {
				const {
					data: { token },
				} = await axios.post(url, {
					username: this.username,
					password: this.password,
				});

				this.token = token;

				// if (storeInstance) {
				// 	const settings = Object.assign({}, storeInstance.settings);
				// 	settings.integrations[integrationIndex].token = this.token;
				// 	storeInstance.settings = settings;
				// 	await storeInstance.save();
				// }
				resolve(token);
			} catch (err) {
				console.log(err);
				reject(err);
			}
		});
	}
	// END TOKEN

	// BEGIN CATALOG
	listProducts(type, categoryId, perPage = 100, page = 1, onlyInStock = true) {
		let query = `?per_page=${perPage}&page=${page}`;
		if (type) {
			query += `&type=${type}`;
		}
		if (categoryId) {
			query += `&category=${categoryId}`;
		}

		if (onlyInStock) {
			query += `&stock_status=instock`;
		}

		const endpoint = this.baseURL + 'wp-json/wc/v3/products' + query;
		console.log('endpoit', endpoint);
		return axios
			.get(endpoint, this.getHeaders())
			.then(resp => resp.data)
			.catch(err => {
				throw new Error(err.toString());
			});
	}

	listProductVariations(productId) {
		const endpoint =
			this.baseURL + '/wp-json/wc/v3/products/' + productId + '/variations';
		return axios
			.get(endpoint, this.getHeaders())
			.then(resp => resp.data)
			.catch(err => {
				throw new Error(err.toString());
			});
	}

	listCategories() {
		const endpoint = this.baseURL + '/wp-json/wc/v3/products/categories';
		return axios
			.get(endpoint, this.getHeaders())
			.then(resp => resp.data)
			.catch(err => {
				throw new Error(err.toString());
			});
	}

	getCategoryChildren(parentId, categories) {
		return (
			categories.filter(category => category.parent === Number(parentId)) || []
		);
	}

	getCategoryBySlug(categorySlug, categories) {
		return categories.find(category => category.slug === categorySlug);
	}

	// END CATALOG

	getSimpleItemPropertyId(Item_Property) {
		if (this.simpleItemPropertyId) {
			return Promise.resolve(this.simpleItemPropertyId);
		} else {
			return Item_Property.findOne({
				where: { type: 'simple' },
				attributes: ['id'],
			}).then(resp => resp.id);
		}
	}
	// BEGIN PARSING
	parseProduct(product, Item_Property) {
		return new Promise(async (resolve, reject) => {
			if (!product) {
				reject('Missing product');
			}

			let itemPropertyId;
			if (product.type === 'simple') {
				itemPropertyId = await this.getSimpleItemPropertyId(Item_Property);
			}

			if (!itemPropertyId) {
				reject('Could not find itemPropertyId');
			}

			const productUrl = _.get(product, '_links.self[0].href', '');

			const shelf = {
				slug: product.slug,
				name: product.name,
				description: product.short_description,
				info: product.description,
			};
			const assets = _.uniqBy(product.images, 'id').map(image => image.src);

			const variation = {
				slug: '',
				price: product.regular_price,
				sale_price: product.sale_price,
				itemPropertyId,
				assets,
				product_url: productUrl,
			};

			if (product.type === 'simple') {
				variation.slug = product.slug;
			}

			resolve({ shelf, variation });
		});
	}

	parseCategory(wcCategory) {
		if (!wcCategory) {
			throw new Error('Missing product');
		}

		const category = {
			slug: wcCategory.slug,
			label: wcCategory.name,
			parent_id: 0,
			external_id: wcCategory.id,
		};

		return category;
	}

	// END PARSING
};
