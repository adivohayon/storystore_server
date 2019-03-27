'use strict';

const _ = require('lodash');
const axios = require('axios');
const ICredit = require('./../payment-providers/i-credit.provider');
const YaadPay = require('./../payment-providers/yaadpay.provider');
const Paypal = require('./../payment-providers/paypal.provider');
const Mailer = require('./../helpers/mailer.helper');
const util = require('util');
const FormatDate = require('date-fns/format');
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
											attributes: ['id', 'slug', 'name', 'tagline', 'info'],
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

		// const to = [customerEmail, store.info.email];
		const to = [customerEmail, 'adiv@shop-together.io'];

		// From address
		const from = `"${store.name}" <noreply@storystore.co.il>`;

		const emailItems = order.items.map(item => {
			return {
				name: item.variation.Shelf.name,
				attributes: `${item.variation.property_label} - ${
					item.attribute.label
				}`,
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

		const mailer = new Mailer();
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
					const mailResp = await mailer.send(from, to, subject, html);
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
		if (!req.body.customer) {
			return res.status(422).json({ error: 'missing customer info' });
		}
		if (!req.body.items || !req.body.items.length) {
			return res.status(422).json({ error: 'missing items' });
		}

		const shipping = req.body.shipping;
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
			const isTestEnv =
				(await Store.findOne({ where: { id: storeId } })).payment.test || true;
			
				const paypal = new Paypal(isTestEnv);
			await paypal.generateAccessToken();

			const returnUrl =
				'http' +
				`://${req.get('host')}/order/capture?db_order_id=${
					order.id
				}&is_test=${isTestEnv}`;

			const urlPrefix = req.headers.origin
				? req.headers.origin
				: 'http://localhost:3000/';
			const cancelUrl = `${urlPrefix}?order=error&orderId=${order.id}`;
			
			const createOrderRequest = paypal.createOrderRequest(
				'CAPTURE',
				items,
				returnUrl,
				cancelUrl
			);
			const { data } = await paypal.createOrder(createOrderRequest);

			data.referredUrl = `${req.headers.origin}?order=success&orderId=${
				order.id
			}&orderEmail=${customer.email}`;

			// Update order
			await order.update({ payment_provider_request: data });
			const approveUrl = data.links.find(l => l.rel === 'approve').href;
			return res.json({ url: approveUrl });
		} catch (err) {
			console.log('err', err);
			if (err.response && err.response.data) {
				return res.status(500).send(err.response.data);
			}
			return res.status(500).send(err);
		}
	});

	app.get('/capture', async (req, res) => {
		const {
			token: paypalOrderId,
			db_order_id: dbOrderId,
			is_test: isTestEnvStr,
		} = req.query;
		const isTestEnv = isTestEnvStr === 'true';
		const paypal = new Paypal(isTestEnv);
		console.log('query', req.query);
		try {
			await paypal.generateAccessToken();
			await paypal.capturePayment(paypalOrderId);

			console.log('CAPTURED');
			const order = await Order.findOne({ where: { id: dbOrderId } });
			const referredUrl = order.payment_provider_request.referredUrl;
			// update order status to "completed" and insert response data
			await Order.update(
				{ status: 'PAYMENT_SUCCESS' },
				{ where: { id: dbOrderId } }
			);

			// redirect back to store_slug.storystore.co.il?order=success
			return res.redirect(referredUrl);
		} catch (err) {
			await Order.update(
				{ status: 'PAYMENT_ERROR' },
				{ where: { id: dbOrderId } }
			);
			if (err && err.response && err.response.status === 422) {
				return res.json(err.response.data);
			}
			console.log(err.response.data);
			return res.sendStatus(500);
		}
	});
};
