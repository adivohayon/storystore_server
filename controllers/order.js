'use strict';

const _ = require('lodash');
const axios = require('axios');

const YaadPay = require('./../payment-providers/yaadpay.provider');
const Paypal = require('./../payment-providers/paypal.provider');
const Payplus = require('./../payment-providers/payplus.provider');
const Mailer = require('./../helpers/mailer.helper');
const util = require('util');
const FormatDate = require('date-fns/format');
// const axios = require('axios');
const createOrderId = (prefix, orderId) => {
	return prefix + orderId;
};
module.exports = (
	app,
	{
		Sequelize,
		Store,
		Shelf,
		Variation,
		Order,
		Customer,
		Attribute,
		Variation_Attribute,
	}
) => {
	app.post('/new-order-email', async (req, res) => {
		const customerEmail = req.body.to || null;

		// Order
		const orderId = +req.body.orderId || null;
		if (!orderId) {
			return res.status(422).send('no orderId');
		}
		const order = await Order.findOne({
			attributes: [
				'id',
				'status',
				'total',
				'shipping_price',
				'shipping_type',
				'createdAt',
			],
			include: [
				{
					attributes: ['id'],
					model: Variation_Attribute,
					as: 'items',
					through: { as: 'orderItem', attributes: ['quantity'] },
					include: [
						{
							model: Attribute,
							attributes: ['label'],
						},
						{
							model: Variation,
							include: [
								{
									attributes: ['name', 'description'],
									model: Shelf,
									include: [
										{
											model: Store,
											attributes: [
												'id',
												'slug',
												'name',
												'tagline',
												'info',
												'settings',
											],
										},
									],
								},
							],
						},
					],
				},
				{
					model: Customer,
					as: 'customer',
				},
			],
			where: { id: orderId },
		});

		// GET FIRST STORE
		const store = order.items[0].variation.Shelf.Store;

		const mailer = new Mailer();

		const bcc = [];
		if (
			store.settings.sendEmail &&
			store.info.email &&
			mailer.validateEmail(store.info.email)
		) {
			bcc.push(store.info.email);
		}

		// const to = [customerEmail, store.info.email];
		// const bcc =
		// return res.json(bcc);
		const to = [customerEmail];

		// From address
		const from = `"${store.name}" <noreply@storystore.co.il>`;

		const emailItems = order.items.map(item => {
			let attributes = '';

			if (item.variation.property_label) {
				attributes += item.variation.property_label;
			}

			if (item.attribute.label) {
				attributes += ' - ' + item.attribute.label;
			}

			return {
				name: item.variation.Shelf.name,
				attributes,
				price: item.variation.finalPrice,
				qty: item.orderItem.quantity,
				id: item.id,
				currency: item.variation.currency,
			};
		});

		// return res.json(emailItems);
		const shipping = {
			type: order.shipping_type,
			price: order.shipping_price,
		};

		// // Currency
		const currency =
			emailItems[0].currency === 'ILS' ? '₪' : emailItems[0].currency;

		// // Subtotal
		const subtotal = emailItems.reduce((acc, item) => {
			acc += +item.price * +item.qty;
			return acc;
		}, 0);

		const total = subtotal + shipping.price;
		// // Logo
		const logo = `https://assets.storystore.co.il/${store.slug}/logo_${
			store.slug
		}_dark.png`;

		// Date
		const orderDate = FormatDate(order.createdAt, 'DD/MM/YYYY');
		const subject = `ההזמנה מ-${store.name} בדרך אליך`;
		const orderNumber = createOrderId('6700', order.id);

		const view = mailer.getTemplate('new-order');

		// console.log(emailItems);
		res.render(
			view,
			{
				customer: order.customer,
				items: emailItems,
				store,
				subtotal,
				total,
				logo,
				currency,
				orderDate,
				orderNumber,
				shipping,
			},
			async (err, html) => {
				try {
					if (err) {
						throw new Error(err);
					}

					// return res.send(html);
					const mailResp = await mailer.send(from, to, subject, html, bcc);
					// console.log('mailResp', mailResp);
					return res.send(200);
				} catch (err) {
					console.error(err);
					return res.status(500).send(err);
				}
			}
		);
	});

	app.get('/payplus-test', async (req, res) => {
		try {
			/* ---------------START PAYPLUS------------------ */
			const payplus = new Payplus('108ebd12540248bc9fb2ac7e600cc3c3', true);
			const link = payplus.directLink(
				100,
				'order1',
				'http://localhost:4000/order/payplus-test-capture'
			);
			return res.json(link);
			// const authenticateRequest = payplus.authenticateRequest(
			// 	'100',
			// 	'testorder'
			// );
			// return res.json(authenticateRequest);
			// const resp = await payplus.authenticate(authenticateRequest);
			// const url = encodeURIComponent('https://ws.payplus.co.il/pp/cc/oc.aspx?a=100&uniqNum=order1&pfsAuthCode=108ebd12540248bc9fb2ac7e600cc3c3&refURL=http://localhost:4000/payplus-test-capture');
			const url =
				'https://ws.payplus.co.il/pp/cc/oc.aspx?a=100&uniqNum=order1&pfsAuthCode=108ebd12540248bc9fb2ac7e600cc3c3&refURL=http://localhost:4000/payplus-test-capture';
			// return res.send(url);
			// const resp = await axios.get(url).then((resp => {
			// 	console.log(resp);
			// 	return resp.data;
			// }));

			return res.redirect(url);
			/* ---------------END PAYPLUS------------------ */
		} catch (err) {
			console.error('err', { err });
			return res.send('err');
		}
	});
	app.post('/', async (req, res) => {
		if (!req.body.customer) {
			return res.status(422).json({ error: 'missing customer info' });
		}
		if (!req.body.items || !req.body.items.length) {
			return res.status(422).json({ error: 'missing items' });
		}

		const shipping = req.body.shipping;
		console.log('shipping', shipping);
		if (!shipping || shipping.price < 0) {
			return res
				.status(422)
				.json({ error: 'Shipping price does not exist or is negative' });
		}

		try {
			const quantitiesMap = {};
			const allVariationAttributeIds = [];
			for (const item of req.body.items) {
				for (const variationAttributeId of item.variationAttributeIds) {
					quantitiesMap[String(variationAttributeId)] = item.qty;
					allVariationAttributeIds.push(variationAttributeId);
				}
			}
			const variationAttributeIds = [...new Set(allVariationAttributeIds)];

			// Get items
			const items = await Variation_Attribute.findAll({
				attributes: ['id'],
				where: {
					id: {
						[Sequelize.Op.in]: variationAttributeIds,
					},
				},
				include: [
					{ model: Attribute, attributes: ['label'] },
					{ model: Variation, include: [{ model: Shelf }] },
				],
			});
			// return res.json(items);
			// No items error
			if (items.length < 1) {
				return res
					.status(404)
					.json({ error: 'items were not found in database' });
			}

			let total = items.reduce((total, v) => {
				return (
					total + Number(v.variation.finalPrice) * quantitiesMap[String(v.id)]
				);
			}, 0);

			if (shipping && shipping.price && shipping.price > 0) {
				total += shipping.price;
			}

			const customer = await Customer.create(req.body.customer);
			const order = await Order.create({
				total,
				shipping_type: shipping.type,
				shipping_price: shipping.price,
				customerId: customer.id,
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

			const storeId = items[0].variation.Shelf.StoreId;
			console.log('storeId', storeId);
			const { slug: storeSlug, payment: storePayment } = await Store.findOne({
				where: { id: storeId },
				attributes: ['slug', 'payment'],
			});
			// return res.json({ storePayment, storeSlug });
			// const storePayment = (await Store.findOne({ where: { id: storeId } }))
			// 	.payment;
			const clientReturnUrl = `${req.headers.origin}?orderId=${
				order.id
			}&orderEmail=${customer.email}`;

			const isTestEnv = storePayment.test;
			const protocol =
				process.env.NODE_ENV === 'development' ? 'http' : req.protocol;
			const paymentReturnUrl = `${protocol}://${req.get(
				'host'
			)}/order/capture?db_order_id=${order.id}&is_test=${isTestEnv}`;
			console.log('storePayment', storePayment);

			/* ---------------START PAYPLUS------------------ */
			if (storePayment.payplus) {
				// Get direct link
				const payplus = new Payplus(storePayment.payplus, isTestEnv);
				const payplusLink = payplus.directLink(
					total,
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

				/* ---------------END PAYPLUS------------------ */
			} else if (storePayment.iCredit) {
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
					/* ---------------END ICREDIT------------------ */
			} else if (storePayment.provider === 'pelecard') {
				/* ---------------START PELECARD------------------ */
				console.log('startPelecard');
				const Pelecard = require('./../payment-providers/pelecard.provider');
				const pelecard = new Pelecard(storePayment.provider, '', isTestEnv);
				const initRequest = pelecard.InitRequest(paymentReturnUrl, total);

				// return res.json(initRequest);
				// return res.json(initRequest);
				const { data } = await pelecard.Init(initRequest);
				if (data.Error && data.Error.ErrCode !== 0) {
					return res.status(422).json(data.Error);
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
				return res.json({ url: data.URL });

				/* ---------------END PELECARD------------------ */
			} else {
				/* ---------------START PAYPAL------------------ */
				const paypal = new Paypal(isTestEnv);

				await paypal.generateAccessToken();

				const urlPrefix = req.headers.origin
					? req.headers.origin
					: 'http://localhost:3000/';
				const cancelUrl = `${urlPrefix}?order=error&orderId=${order.id}`;

				const createOrderRequest = paypal.createOrderRequest(
					'CAPTURE',
					items,
					total,
					paymentReturnUrl,
					cancelUrl
				);
				const { data } = await paypal.createOrder(createOrderRequest);

				data.referredUrl = `${req.headers.origin}?orderId=${
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
				return res.json({ url: approveUrl });
				/* ---------------END PAYPAL------------------ */
			}

			// /* ---------------START PAYPLUS------------------ */
			// const payplus = new Payplus('108ebd12540248bc9fb2ac7e600cc3c3', isTestEnv);
			// const authenticateRequest = payplus.authenticateRequest(100, 'testorder');
			// const resp = payplus.authenticate(authenticateRequest);
			// return res.json(resp);
			// /* ---------------END PAYPLUS------------------ */
		} catch (err) {
			console.log('err', err);
			if (err.response && err.response.data) {
				return res.status(500).send(err.response.data);
			}
			return res.status(500).send(err);
		}
	});

	app.get('/capture', async (req, res) => {
		const { db_order_id: dbOrderId, is_test: isTestEnvStr } = req.query;
		const isTestEnv = isTestEnvStr === 'true';

		console.log('query', req.query);
		try {
			const order = await Order.findOne({ where: { id: dbOrderId } });
			let { clientReturnUrl, paymentProvider } = order.payment_provider_request;
			if (paymentProvider === 'payplus') {
				/* ---------------START PAYPLUS------------------ */
				// return res.json(clientReturnUrl);
				/* ---------------END PAYPLUS------------------ */
			} else if (paymentProvider === 'iCredit') {
				const token = req.query.Token;
				if (!order.payment_provider_request.PublicSaleToken || !token) {
					throw new Error('No public sale token saved for this order');
				}

				if (order.payment_provider_request.PublicSaleToken !== token) {
					throw new Error(
						'Mismatch between public token saved and the one received from payment provider'
					);
				}
			} else if (paymentProvider === 'pelecard') {
				
			} else {
				// Paypal
				const token = req.query.paypalOrderId;
				const paypal = new Paypal(isTestEnv);
				await paypal.generateAccessToken();
				await paypal.capturePayment(paypalOrderId);
				// End paypal
			}

			clientReturnUrl += '&order=success';
			// console.log('CAPTURED');

			// update order status to "completed" and insert response data
			order.status = 'PAYMENT_SUCCESS';
			await order.save();
			// await Order.update(
			// 	{ status: 'PAYMENT_SUCCESS' },
			// 	{ where: { id: dbOrderId } }
			// );

			// redirect back to store_slug.storystore.co.il?order=success
			// return res.json(clientReturnUrl);
			return res.redirect(clientReturnUrl);
		} catch (err) {
			console.log('err', err.toString());
			const order = (await Order.update(
				{
					status: 'PAYMENT_ERROR',
					debug: err.toString(),
				},
				{ where: { id: dbOrderId }, returning: true }
			))[1][0];

			if (err && err.response && err.response.status === 422) {
				return res.json(err.response.data);
			}

			// return res.json(order);
			let clientReturnUrl = _.get(
				order,
				'payment_provider_request.clientReturnUrl',
				null
			);
			clientReturnUrl += '&order=error';
			// console.log(err.response.data);
			return res.redirect(clientReturnUrl);
			// return res.sendStatus(500);
		}
	});

	app.get('/:orderId/items', async (req, res) => {
		console.log('req.params', req.params);
		// return res.json(req.params);
		const order = await Order.findOne({
			where: { id: req.params.orderId },
			attributes: ['shipping_price'],
			include: [
				{
					attributes: ['id'],
					model: Variation_Attribute,
					as: 'items',
					through: { as: 'orderItem', attributes: ['quantity'] },
					include: [
						{
							model: Variation,
							attributes: [
								'id',
								'price',
								'sale_price',
								'property_label',
								'product_url',
							],
							include: [{ model: Shelf, attributes: ['id', 'name'] }],
						},
					],
				},
			],
		});
		return res.json(order);
	});
};
