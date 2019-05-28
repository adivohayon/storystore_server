const YaadPay = require('./../payment-providers/yaadpay.provider');
const Paypal = require('./../payment-providers/paypal.provider');
const Payplus = require('./../payment-providers/payplus.provider');

module.exports = class DefaultConnector {
	constructor(Models, Sequelize) {
		// this.clientBaseUrl = clientBaseUrl;
		// this.serverBaseUrl = serverBaseUrl;
		this.models = Models;
		this.Sequelize = Sequelize;
		this.total = null;
	}

	// VALIDATIONS --------------------------------------
	validateRequestCustomer(customer) {
		return true;
	}

	validateRequestItems(items) {
		return items && items.length;
	}

	validateItems(items) {
		return items && items.length;
	}

	validateShipping(shipping) {
		return shipping && shipping.price >= 0;
	}

	// ITEMS --------------------------------------
	getDBItems(idsArr) {
		// Get items
		return this.models.Variation_Attribute.findAll({
			attributes: ['id'],
			where: {
				id: {
					[this.Sequelize.Op.in]: idsArr,
				},
			},
			include: [
				{ model: this.models.Attribute, attributes: ['label'] },
				{
					model: this.models.Variation,
					include: [{ model: this.models.Shelf }],
				},
			],
		});
	}

	getTotal(items, quantitiesMap, shippingPrice) {
		let total = items.reduce((total, v) => {
			return (
				total + Number(v.variation.finalPrice) * quantitiesMap[String(v.id)]
			);
		}, 0);

		if (shippingPrice > 0) {
			total += shippingPrice;
		}

		return total;
	}

	parseRequestItems(requestItems) {
		const quantitiesMap = {};
		const allVariationAttributeIds = [];
		for (const item of requestItems) {
			for (const variationAttributeId of item.variationAttributeIds) {
				quantitiesMap[String(variationAttributeId)] = item.qty;
				allVariationAttributeIds.push(variationAttributeId);
			}
		}
		const variationAttributeIds = [...new Set(allVariationAttributeIds)];
		return { quantitiesMap, variationAttributeIds };
	}

	// CUSTOMER --------------------------------------
	handleDBCustomer(customer) {
		return this.createDBCustomer(customer);
	}

	createDBCustomer(customer) {
		return this.models.Customer.create(customer);
	}

	// ORDER --------------------------------------
	async newOrder(
		shippingType,
		shippingPrice,
		customerId,
		items,
		quantitiesMap
	) {
		return this.createDBOrder(
			shippingType,
			shippingPrice,
			customerId,
			items,
			quantitiesMap
		);
	}
	async createDBOrder(
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
					const initRequest = pelecard.InitRequest(
						paymentReturnUrl,
						this.total
					);

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
				} else {
				/* ---------------END PELECARD------------------ */

				/* ---------------START PAYPAL------------------ */
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
