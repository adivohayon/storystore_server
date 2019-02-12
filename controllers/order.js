'use strict';
const { URL } = require('url');
const _ = require('lodash');
const axios = require('axios');

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

	app.post('/:store', async (req, res) => {
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
		const order = await Order.create({
			personal: req.body.personal,
			address: req.body.address,
			items: items.map(({ id }) => ({ id, qty: quantities[String(id)] })),
			total: items.reduce(
				(total, v) =>
					total +
					(Number(v.sale_price) || Number(v.price) || 0) *
						quantities[String(v.id)],
				0
			),
		});

		const { token: GroupPrivateToken, test } = req.store.payment || {};
		const { data } = await axios.post(
			test
				? 'https://testicredit.rivhit.co.il/API/PaymentPageRequest.svc/GetUrl'
				: 'https://icredit.rivhit.co.il/API/PaymentPageRequest.svc/GetUrl',
			{
				GroupPrivateToken,
				Currency: 1,
				HideItemList: true,
				RedirectURL: String(new URL('/?order=success', req.headers.referer)),
				FailRedirectURL: String(new URL('/?order=error', req.headers.referer)),

				IPNURL: `https://forsit.serveo.net/order/${req.store.slug}/ipn/${
					order.id
				}`,
				IPNFailureURL: `https://forsit.serveo.net/order/${req.store.slug}/ipn/${
					order.id
				}?error=1`,

				CustomerFirstName: _.get(order, 'personal.firstName', 'unknown'),
				CustomerLastName: _.get(order, 'personal.lastName', 'unknown'),
				Address: _.get(order, 'address.street'),
				POB: _.get(order, 'address.pob'),
				City: _.get(order, 'address.city'),
				Country: 'ישראל',
				Zipcode: _.get(order, 'address.zipcode'),
				PhoneNumber: _.get(order, 'personal.phone'),
				EmailAddress: _.get(order, 'personal.email'),
				Order: String(order.id),
				Items: items.map(v => ({
					Quantity: quantities[String(v.id)],
					UnitPrice: Number(v.sale_price) || Number(v.price) || 0,
					Description: v.Shelf.name,
				})),
			}
		);
		await order.update({ status: 'PENDING', request: data });
		res.json({ url: data.URL });
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
		await order.update({ response: req.body });
		const { token: GroupPrivateToken, test } = req.store.payment || {};
		const {
			data: { Status },
		} = await axios.post(
			test
				? 'https://testicredit.rivhit.co.il/API/PaymentPageRequest.svc/Verify'
				: 'https://icredit.rivhit.co.il/API/PaymentPageRequest.svc/Verify',
			{
				GroupPrivateToken,
				SaleId: req.body.SaleId,
				TotalAmount: req.body.TransactionAmount,
			}
		);
		await order.update({ status: Status == 'VERIFIED' ? 'SUCCESS' : 'ERROR' });
		res.json({});
	});
};
