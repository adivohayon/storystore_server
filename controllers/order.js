'use strict';

const _ = require('lodash');
const axios = require('axios');

const YaadPay = require('./../payment-providers/yaadpay.provider');
const Paypal = require('./../payment-providers/paypal.provider');
const Payplus = require('./../payment-providers/payplus.provider');
const Mailer = require('./../helpers/mailer.helper');
const util = require('util');
const FormatDate = require('date-fns/format');
const DefaultConnector = require('./../connectors/default.connector');
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

	app.post('/', async (req, res) => {
		const clientBaseUrl = req.headers.origin;
		const protocol =
			process.env.NODE_ENV === 'development' ? 'http' : req.protocol;
		const serverBaseUrl = `${protocol}://${req.get('host')}`;

		// const connector = new DefaultConnector(
		// 	clientBaseUrl,
		// 	serverBaseUrl,
		// 	Store,
		// 	Shelf,
		// 	Variation,
		// 	Attribute,
		// 	Variation_Attribute,
		// 	Customer,
		// 	Order,
		// 	Sequelize
		// );

		const woocommerceAPIUrl = 'http://localhost:8080/wp-json/';
		const connector = new WoocommerceConnector(woocommerceAPIUrl);


		if (!connector.validateRequestCustomer(req.body.customer)) {
			throw new Error('Invalid customer format');
		}

		if (!connector.validateRequestItems(req.body.items)) {
			throw new Error('Invalid request items format');
		}

		if (!connector.validateShipping(req.body.shipping)) {
			throw new Error('Invalid shipping option');
		}

		try {
			const {
				order,
				items,
				storeId,
				storeSlug,
				storePayment,
				customer,
			} = await connector.newOrder(
				req.body.items,
				req.body.customer,
				req.body.shipping
			);
			
			//console.log('storePayment', storePayment);
			const paymentUrl = await connector.handlePayment(
				storePayment,
				order,
				items,
				customer,
				storeSlug
			);

			return res.json(paymentUrl);
		} catch (err) {
			console.error(err);
			return res.status(500).send(err.toString());
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
