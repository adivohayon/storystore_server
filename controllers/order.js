'use strict';

const _ = require('lodash');
const axios = require('axios');
const ICredit = require('./../payment-providers/i-credit.provider');
const YaadPay = require('./../payment-providers/yaadpay.provider');
const Mailer = require('./../helpers/mailer.helper');
const FormatDate = require('date-fns/format');

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
		const storeDomain = store.info.email.substring(store.info.email.indexOf('@'));
		console.log('storeDomain', storeDomain);
		const from = `noreply${storeDomain}`;

		// Organize items for email template
		const dbItems = await Variation.findAll({
			raw: true,
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

		const emailItems = order.items.map(orderItem => {
			const dbItem = dbItems.find(v => (v.id = orderItem.id));
			dbItem.name = dbItem['Shelf.name'];
			dbItem.price = dbItem.sale_price || dbItem.price;

			// Get attributes string
			let variationsArr = [];
			for (let key in dbItem.attrs) {
				if (dbItem.attrs.hasOwnProperty(key)) {
					const label = _.get(dbItem.attrs, [key, 'label'], '');
					if (label.length > 0) {
						variationsArr.push(label);
					}
				}
			}
			dbItem.variations = variationsArr.join(' - ');

			delete dbItem.attrs;
			delete dbItem.sale_price;
			delete dbItem['Shelf.name'];

			const item = Object.assign(orderItem, dbItem);

			console.log('_item', item);
			return item;
		});

		// Currency
		const currency =
			emailItems[0].currency === 'ILS' ? '₪' : emailItems[0].currency;

		// Subtotal
		const subtotal = emailItems.reduce((acc, item) => {
			acc += +item.price;
			return acc;
		}, 0);

		// Logo
		const logo = `https://assets.storystore.co.il/${store.slug}/logo_${
			store.slug
		}_dark.png`;

		// Date
		const orderDate = FormatDate(order.createdAt, 'DD/MM/YYYY');
		const subject = 'New transaction';

		const mailer = new Mailer();
		const view = mailer.getTemplate('new-order');
		res.render(
			view,
			{
				personal: order.personal,
				address: order.address,
				items: emailItems,
				store,
				subtotal,
				logo,
				currency,
				orderDate,
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

		// KOOKINT SPECIAL PRICING - FREE SHIPPING OVER 100 ILS
		let shippingCost = 0;
		// console.log('store', req.params.store);
		// console.log('total', total);
		if (req.params.store === 'kookint') {
			if (total < 100) {
				shippingCost = 33;
				total += shippingCost;
			}
		}

		// console.log('store', req.store);
		const order = await Order.create({
			personal: req.body.personal,
			address: req.body.address,
			items: items.map(({ id }) => ({ id, qty: quantities[String(id)] })),
			total,
			StoreId: req.store.id,
		});

		const { provider, accountId, test } = req.store.payment || {};
		let data;

		switch (provider) {
			// I-CREDIT
			case 'i-credit':
				const iCredit = new ICredit(accountId, test, req.store.slug, order);
				const ipnHost = __DEV__ ? process.env.SERVEO : req.hostname;
				const ipnUrls = iCredit.getIPNUrls(ipnHost);

				const getUrlRequest = iCredit.GetUrlRequest(
					req.headers.referer,
					ipnUrls,
					items,
					quantities,
					shippingCost
				);
				const { data } = await iCredit.getUrl(getUrlRequest);

				await order.update({ status: 'PENDING', request: data });
				return res.json({ url: data.URL });

			// YAAD PAY
			case 'yaadpay':
				const yaadPay = new YaadPay(accountId, req.store.slug, order);
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
