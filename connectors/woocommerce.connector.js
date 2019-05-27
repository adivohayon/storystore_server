const YaadPay = require('./../payment-providers/yaadpay.provider');
const Paypal = require('./../payment-providers/paypal.provider');
const Payplus = require('./../payment-providers/payplus.provider');

module.exports = class WoocommerceConnector {
	constructor(
		woocommerceAPIUrl
	) {
		this.woocommerceAPIUrl = woocommerceAPIUrl;
		this.total = null;
	}


	// VALIDATIONS --------------------------------------
	validateRequestCustomer(requestCustomer) {
		return true;
	}

	validateRequestItems(requestItems) {
		return requestItems && requestItems.length;
	}

	validateItems(items) {
		return items && items.length;
	}

	validateShipping(shipping) {
		return shipping && shipping.price >= 0;
	}
	
	// ITEMS --------------------------------------
	getItems(idsArr) {
	
	}

	getTotal(items, quantitiesMap, shippingPrice) {
	}

	parseRequestItems(requestItems) {
	}


	// CUSTOMER --------------------------------------
	handleCustomer(customer) {
		return this.models.Customer.create(customer);
	}

	// ORDER --------------------------------------
	async createOrder(
		shippingType,
		shippingPrice,
		customerId,
		items,
		quantitiesMap
	) {
		try {
			const order = await this.models.Order.create({
				total: this.total,
				shipping_type: shippingType,
				shipping_price: shippingPrice,
				customerId: customerId,
			});

			const associationPromises = [];
			for (let item of items) {
				associationPromises.push(
					order.setItems(item, {
						through: {
							quantity: quantitiesMap[String(item.id)],
						},
					})
				);
			}

			await Promise.all(associationPromises);
			return order;
		} catch (err) {
			reject(err);
		}
	}

	newOrder(requestItems, requestCustomer, shipping) {
		return new Promise(async (resolve, reject) => {
			try {
				const { quantitiesMap, variationAttributeIds } = this.parseRequestItems(
					requestItems
				);

				const items = await this.getItems(variationAttributeIds);
				if (items.length < 1) {
					throw new Error('Items were not found in database');
				}

				this.total = this.getTotal(items, quantitiesMap, shipping.price);

				const customer = await this.handleCustomer(requestCustomer);

				const order = await this.createOrder(
					shipping.type,
					shipping.price,
					customer.id,
					items,
					quantitiesMap
				);
				
				const storeId = items[0].variation.Shelf.StoreId;

				const { storeSlug, storePayment } = await this.getStoreInfo(storeId);
				
				
				resolve({ order, storeId, items, storeSlug, storePayment, customer });
				// /* ---------------START PAYPLUS------------------ */
				// const payplus = new Payplus('108ebd12540248bc9fb2ac7e600cc3c3', isTestEnv);
				// const authenticateRequest = payplus.authenticateRequest(100, 'testorder');
				// const resp = payplus.authenticate(authenticateRequest);
				// return res.json(resp);
				// /* ---------------END PAYPLUS------------------ */
			} catch (err) {
				console.log('err', err);
				if (err.response && err.response.data) {
					reject(err.response.data);
				} else {
					reject(err);
				}
			}
		});
	}

	async getStoreInfo(storeId) {
		try {
			const {
				slug: storeSlug,
				payment: storePayment,
			} = await this.models.Store.findOne({
				where: { id: storeId },
				attributes: ['slug', 'payment'],
			});
			// console.log('storePayment', storePayment);
			return { storeSlug, storePayment };
		} catch (err) {
			console.error('err');
			return err.toString();
		}
	}

	// PAYMENT --------------------------------------
	// Abstract this to smaller functions
	handlePayment(storePayment, order, items, customer, storeSlug) {
		return new Promise(async (resolve, reject) => {
			try {
				const isTestEnv = storePayment.test;

				const clientReturnUrl = `${this.clientBaseUrl}?orderId=${
					order.id
				}&orderEmail=${customer.email}`;
				const paymentReturnUrl = `${
					this.serverBaseUrl
				}/order/capture?db_order_id=${order.id}&is_test=${isTestEnv}`;

				/* ---------------START PAYPLUS------------------ */
				if (storePayment.payplus) {
					// Get direct link
					const payplus = new Payplus(storePayment.payplus, isTestEnv);
					const payplusLink = payplus.directLink(
						this.total,
						order.id,
						paymentReturnUrl
					);

					// Update order
					await order.update({
						payment_provider_request: {
							clientReturnUrl,
							paymentProvider: 'payplus',
						},
					});
					return res.json({ url: payplusLink });
				} else if (storePayment.iCredit) {
					/* ---------------END PAYPLUS------------------ */

					/* ---------------START ICREDIT------------------ */
					const ICredit = require('./../payment-providers/i-credit.provider');
					const iCredit = new ICredit(storePayment.iCredit, isTestEnv);

					iCredit.ipnUrls = {
						success: `https://${req.get('host')}/order/${storeSlug}/ipn/${
							order.id
						}`,
						failure: `https://${req.get('host')}/order/${storeSlug}/ipn/${
							order.id
						}?error=1`,
					};
					const getUrlRequest = iCredit.GetUrlRequest(
						items,
						quantitiesMap,
						order.id,
						shipping,
						paymentReturnUrl,
						customer
					);
					const { data } = await iCredit.getUrl(getUrlRequest);
					await order.update({
						payment_provider_request: {
							...data,
							clientReturnUrl,
							paymentProvider: 'iCredit',
						},
					});
					// console.log('iCreditLink', data);
					return res.json({ url: data.URL });
				} else if (storePayment.pelecard) {
					/* ---------------END ICREDIT------------------ */

					/* ---------------START PELECARD------------------ */
					const Pelecard = require('./../payment-providers/pelecard.provider');
					const pelecard = new Pelecard(storePayment.iCredit, '', isTestEnv);
					const initRequest = pelecard.InitRequest(paymentReturnUrl, this.total);

					// return res.json(initRequest);
					// return res.json(initRequest);
					const { data } = await pelecard.Init(initRequest);
					if (data.Error && data.Error.ErrCode !== 0) {
						reject(data.Error);
					}
					// return res.json(data);

					await order.update({
						payment_provider_request: {
							...data,
							clientReturnUrl,
							paymentProvider: 'pelecard',
						},
					});
					// console.log('iCreditLink', data);
					resolve({ url: data.URL });
				} 
				/* ---------------END PELECARD------------------ */
				
				/* ---------------START PAYPAL------------------ */
				else {
					const paypal = new Paypal(isTestEnv);

					await paypal.generateAccessToken();

					const urlPrefix = this.clientBaseUrl || 'http://localhost:3000/';

					const cancelUrl = `${urlPrefix}?order=error&orderId=${order.id}`;

					const createOrderRequest = paypal.createOrderRequest(
						'CAPTURE',
						items,
						this.total,
						paymentReturnUrl,
						cancelUrl
					);
					const { data } = await paypal.createOrder(createOrderRequest);


					data.referredUrl = `${this.clientBaseUrl}?orderId=${
						order.id
					}&orderEmail=${customer.email}`;

					const paymentProviderRequest = {
						...data,
						clientReturnUrl,
						paymentProvider: 'paypal',
					};
					// Update order
					await order.update({
						payment_provider_request: paymentProviderRequest,
					});

					const approveUrl = data.links.find(l => l.rel === 'approve').href;
					resolve({ url: approveUrl });
				}
				/* ---------------END PAYPAL------------------ */
			} catch (err) {
				reject(err);
			}
		});
	}
};
