'use strict';

const _ = require('lodash');
const axios = require('axios');
const ICredit = require('./../payment-providers/i-credit.provider');
const YaadPay = require('./../payment-providers/yaadpay.provider');
const Mailer = require('./../helpers/mailer.helper');
const util = require('util');
const FormatDate = require('date-fns/format');
const createOrderId = (storeId, orderId) => {
	return storeId + '000' + orderId;
};
module.exports = (app, { Sequelize, Store, Shelf, Variation, Order }) => {
	app.param('store', async (req, res, next, slug) => {
		try {
			if (!(req.store = await Store.findOne({ where: { slug } })))
				return next(new Error(`invalid store slug: ${slug}`));
			next();
		} catch (err) {
			next(err);
		}
	});

	app.post('/new-order-email', async (req, res) => {
		// const from = req.body.from || null;
		const to = req.body.to || null;

		// Order
		const orderId = +req.body.orderId || null;
		if (!orderId) {
			return res.status(422).send('no orderId');
		}
		const order = await Order.findOne({ where: { id: orderId } });

		// Store name
		const store = await Store.findOne({
			attributes: ['name', 'tagline', 'info', 'slug'],
			where: { id: order.StoreId },
		});
		// From address
		const storeDomain = store.info.email.substring(
			store.info.email.indexOf('@')
		);
		const from = `"${store.name}" <noreply@storystore.co.il>`;

		// Organize items for email template
		const dbItems = await Variation.findAll({
			// raw: true,
			attributes: ['id', 'attrs', 'price', 'sale_price', 'currency'],
			where: {
				id: {
					[Sequelize.Op.in]: order.items
						.map(({ id }) => Number(id))
						.filter(id => id),
				},
			},
			include: [
				{
					model: Shelf,
					where: { StoreId: order.StoreId },
					attributes: ['name'],
					raw: true,
				},
			],
		});

		// console.log(util.inspect(dbItems, false, null, true /* enable colors */))

		// console.log('dbItems 1', dbItems[0].Shelf);
		// console.log('dbItems 2', dbItems[1].Shelf);

		// for (let orderItem of order.items) {
		// 	for (let dbItem of dbItems) {

		// 	}
		// }
		const emailItems = dbItems.map(dbItem => {
			const orderItem = order.items.find(item => item.id == dbItem.id);
			console.log('orderItem', orderItem);

			return {
				name: dbItem.Shelf.name,
				attributes: dbItem.attributesStr,
				price: dbItem.finalPrice,
				qty: orderItem.qty,
				id: orderItem.id,
				currency: dbItem.currency,
			};
		});

		const shipping = order.items.find(item => item.id === -1);
		// return res.json(emailItems);

		// // Currency
		const currency =
			emailItems[0].currency === 'ILS' ? '₪' : emailItems[0].currency;

		// // Subtotal
		const subtotal = emailItems.reduce((acc, item) => {
			acc += (+item.price * +item.qty);
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
		const orderNumber = createOrderId(order.StoreId, order.id);

		const mailer = new Mailer();
		const view = mailer.getTemplate('new-order');

		// console.log(emailItems);
		res.render(
			view,
			{
				personal: order.personal,
				address: order.address,
				items: emailItems,
				store,
				subtotal,
				total,
				logo,
				currency,
				orderDate,
				orderNumber,
				shipping
			},
			async (err, html) => {
				try {
					if (err) {
						throw new Error(err);
					}

					// return res.send(html);
					const mailResp = await mailer.send(from, to, subject, html);
					console.log('mailResp', mailResp);
					return res.send(200);
				} catch (err) {
					console.error(err);
					return res.status(500).send(err);
				}
			}
		);
	});

	app.post('/:store', async (req, res) => {
		// console.log('address', req.body.address);
		// console.log('personal', req.body.personal);
		// console.log('items', req.body.items);
		const quantities = req.body.items.reduce(
			(o, { id, qty }) => Object.assign(o, { [String(id)]: Number(qty) || 1 }),
			{}
		);
		const items = await Variation.findAll({
			where: {
				id: {
					[Sequelize.Op.in]: req.body.items
						.map(({ id }) => Number(id))
						.filter(id => id),
				},
			},
			include: [
				{
					model: Shelf,
					where: { StoreId: req.store.id },
					attributes: ['name'],
				},
			],
		});

		if (items.length < 1) {
			return res
				.status(404)
				.json({ error: 'items were not found in database' });
		}
		

		let total = items.reduce(
			(total, v) =>
				total +
				(Number(v.sale_price) || Number(v.price) || 0) *
					quantities[String(v.id)],
			0
		);

		const shipping = req.body.shipping;
		// items.push(shipping);
		
		if (shipping.price > 0) {
			total += shipping.price;
		}

		// KOOKINT SPECIAL PRICING - FREE SHIPPING OVER 100 ILS
	

		// let shippingCost = 0;
		// console.log('store', req.params.store);
		// console.log('total', total);
		// if (req.params.store === 'kookint') {
		// 	if (total < 100) {
		// 		shippingCost = 33;
		// 		total += shippingCost;
		// 	}
		// }

		// console.log('store', req.store);
		const order = await Order.create({
			personal: req.body.personal,
			address: req.body.address,
			items: [...items.map(({ id }) => ({ id, qty: quantities[String(id)] })), shipping],
			total,
			StoreId: req.store.id,
		});

		const { provider, accountId, test } = req.store.payment || {};
		let data;

		const orderNumber = createOrderId(order.StoreId, order.id);

		switch (provider) {
			// I-CREDIT
			case 'i-credit':
				const iCredit = new ICredit(
					accountId,
					test,
					req.store.slug,
					order,
					orderNumber
				);
				const ipnHost = __DEV__ ? process.env.SERVEO : req.hostname;
				const ipnUrls = iCredit.getIPNUrls(ipnHost);

				const getUrlRequest = iCredit.GetUrlRequest(
					req.headers.referer,
					ipnUrls,
					items,
					quantities,
					shipping.price
				);
				const { data } = await iCredit.getUrl(getUrlRequest);

				await order.update({ status: 'PENDING', request: data });
				return res.json({ url: data.URL });

			// YAAD PAY
			case 'yaadpay':
				const yaadPay = new YaadPay(
					accountId,
					req.store.slug,
					order,
					orderNumber
				);
				const payRequest = yaadPay.PayRequest(
					total,
					'testing transaction info'
				);

				const { url } = yaadPay.getUrl(payRequest);
				// const resp = await yaadPay.pay(payRequest);
				await order.update({ status: 'PENDING', request: url });

				return res.json({ url });
			// return res.status(200);
			default:
				return res.status(400).send('Payment provider not found: ' + provider);
		}

		// console.log('data', data);

		// await order.update({ status: 'PENDING', request: data });
		// res.json({ url: data.URL });
	});

	app.all('/:store/redirect', async (req, res) => {
		const { Token = '' } = req.query;
		res.json({
			method: req.method,
			url: req.url,
			query: req.query,
			headers: req.headers,
			body: req.body,
		});
	});

	app.all('/:store/redirect/error', async (req, res) => {
		res.json({
			method: req.method,
			url: req.url,
			query: req.query,
			headers: req.headers,
			body: req.body,
		});
	});

	app.all('/:store/ipn/:order', async (req, res) => {
		const order = await Order.findOne({ where: { id: +req.params.order } });
		if (!order) return res.status(404).end();
		if (order.status) {
			console.warn(`duplicate callback for order ${order.id}`);
			return res.status(400).end();
		}
		if (+req.query.error) {
			await order.update({ response: req.body, status: 'ERROR' });
			return res.json({});
		}
		await order.update({ response: req.body });
		const { token: GroupPrivateToken, test } = req.store.payment || {};

		const iCredit = new ICredit(GroupPrivateToken, test, req.store.slug, order);
		const verifyRequest = iCredit.VerifyRequest(
			req.body.SaleId,
			req.body.TransactionAmount
		);
		const {
			data: { Status },
		} = await iCredit.verify(verifyRequest);

		await order.update({ status: Status == 'VERIFIED' ? 'SUCCESS' : 'ERROR' });
		res.json({});
	});
};
