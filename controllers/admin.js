'use strict';
const _ = require('lodash');
const csvtojson = require('csvtojson');
const AWS = require('aws-sdk');

const S3 = new AWS.S3();

const flat = req => {
	const res = {};
	const scan = (o, prefix) => {
		for (let [key, value] of Object.entries(o)) {
			switch (typeof value) {
				case 'object':
					if (value !== null) {
						scan(value, prefix.concat(key));
						continue;
					}
					value = '';
					break;
				case 'string':
					value = value.trim();
					break;
			}
			res[
				prefix
					.concat(key)
					.join('.')
					.toLowerCase()
			] = value;
		}
		return res;
	};
	return scan(req, []);
};

module.exports = (app, { sequelize, Store, Shelf, Variation }) => {
	app.use((req, res, next) => {
		req.session.admin = true;
		next();
	});

	app.use(
		'/db',
		require('@giladno/sequelize-admin')(sequelize, {
			deletable: true,
			editable: true,
		})
	);

	app.get('/', async (req, res) => {
		res.render('admin', { stores: await Store.findAll() });
	});

	app.get('/sync', async (req, res) => {
		await sequelize.sync({ alter: !!+req.query.alter });
		res.json({ ok: true });
	});

	app.post('/create-store', async (req, res) => {
		const info = {
			address: req.body.store_info_address,
			email: req.body.store_info_email,
			phone: req.body.store_info_phone,
			openingHours: req.body['store_info_opening-hours'],
		};
		await Store.create({
			slug: req.body.store_slug,
			name: req.body.store_name || req.body.store_slug,
			tagline: req.body.store_tagline,
			about: req.body.store_about,
			info,
			shipping_details: req.body.shipping_details,
		});
		res.redirect('/admin');
	});

	app.post('/import.old', async (req, res) => {
		const store = await Store.findOne({ where: { slug: req.body.store } });
		if (!store) return res.json({ error: 'missing store id' });
		let keys = [];
		for (let ContinuationToken; ; ) {
			const {
				Contents,
				NextContinuationToken,
				IsTruncated,
			} = await S3.listObjectsV2({
				Bucket: process.env.BUCKET,
				Prefix: store.slug,
				ContinuationToken,
			}).promise();
			keys = keys.concat(
				Contents.map(({ Key }) => Key).filter(key => /\.(jpg|mp4)$/.test(key))
			);
			if (!IsTruncated) break;
			ContinuationToken = NextContinuationToken;
		}
		await sequelize.sync();
		await Shelf.destroy({ where: { StoreId: store.id } });
		await Variation.destroy({ where: { ShelfId: null } });
		const csv = await csvtojson().fromString(req.body.csv);
		const { shelves, variations } = csv.reduce(
			({ shelves = [], variations = [] }, { shelf = [], variation = [] }) => ({
				shelves: _.uniqBy(shelves.concat(shelf), 'shelf_id'),
				variations: variations.concat(variation),
			}),
			{}
		);

		for (const {
			slug,
			name,
			short_description: description,
			info,
			shelf_id,
		} of shelves) {
			const [shelf] = await Shelf.findCreateFind({
				where: { slug, StoreId: store.id },
				defaults: {
					name: name.trim(),
					description: description.trim(),
					info: info.trim(),
				},
			});

			await sequelize.transaction(async transaction => {
				for (const chunk of _.chunk(
					variations.filter(v => shelf_id == v.shelf_id),
					50
				)) {
					await Variation.bulkCreate(
						chunk.map(({ sku, slug, price, sale_price, attributes }) => ({
							ShelfId: shelf.id,
							slug,
							sku,
							attrs: attributes,
							price: +price || 0,
							sale_price: +sale_price || null,
							assets: {
								images: keys
									.filter(key =>
										key.startsWith([store.slug, shelf.slug, slug, ''].join('/'))
									)
									.map(key => key.split('/').pop()),
							},
						})),
						{
							transaction,
						}
					);
				}
			});
		}
		res.redirect('/admin');
	});

	app.post('/import', async (req, res) => {
		const store = await Store.findOne({ where: { slug: req.body.store } });
		if (!store) return res.json({ error: 'missing store id' });
		let keys = [];
		for (let ContinuationToken; ; ) {
			const {
				Contents,
				NextContinuationToken,
				IsTruncated,
			} = await S3.listObjectsV2({
				Bucket: process.env.BUCKET,
				Prefix: store.slug,
				ContinuationToken,
			}).promise();
			keys = keys.concat(
				Contents.map(({ Key }) => Key).filter(key => /\.(jpg|mp4)$/.test(key))
			);
			if (!IsTruncated) break;
			ContinuationToken = NextContinuationToken;
		}
		const csv = await csvtojson().fromString(req.body.csv);

		const { shelves, variations } = csv.reduce(
			(
				{ shelves = [], variations = [] },
				{ id, shelf: { id: ShelfId, ...shelf }, ...variation }
			) => ({
				shelves: _.uniqBy(
					shelves.concat({ id: +ShelfId || 0, ...shelf }),
					'id'
				),
				variations: variations.concat({
					id: +id || 0,
					...variation,
					ShelfId: +ShelfId || 0,
				}),
			}),
			{}
		);

		for (const { id: ShelfId, slug, name, info, description } of shelves) {
			const [shelf] = await Shelf.findCreateFind({
				where: { slug, StoreId: store.id },
				defaults: {
					name: name.trim(),
					description: description.trim(),
					info: info.trim(),
				},
			});
			await sequelize.transaction(async transaction => {
				for (const chunk of _.chunk(
					variations.filter(v => ShelfId == v.ShelfId && !v.id),
					50
				)) {
					await Variation.bulkCreate(
						chunk.map(({ sku, slug, price, sale_price, attributes }) => ({
							ShelfId: shelf.id,
							slug,
							sku,
							attrs: attributes,
							price: +price || 0,
							sale_price: +sale_price || null,
							assets: {
								images: keys
									.filter(key =>
										key.startsWith([store.slug, shelf.slug, slug, ''].join('/'))
									)
									.map(key => key.split('/').pop()),
							},
						})),
						{
							transaction,
						}
					);
				}
			});
		}
		res.redirect('/admin');
	});

	app.post('/export', async (req, res) => {
		const store = await Store.findOne({ where: { slug: req.body.store } });
		if (!store) return res.json({ error: 'missing store id' });
		const items = (await Variation.findAll({
			attributes: [
				'id',
				'slug',
				'sku',
				['attrs', 'attributes'],
				'price',
				'sale_price',
				'currency',
			],
			include: [
				{
					model: Shelf,
					attributes: ['id', 'slug', 'name', 'info', 'description'],
					where: { StoreId: store.id },
				},
			],
			raw: true,
		})).map(flat);

		const csv = (data, headers) => {
			if (!data.length) return '';
			if (!headers)
				headers = Object.keys(data[0]).reduce(
					(o, key) => Object.assign(o, { [key]: key }),
					{}
				);
			const keys = Object.keys(headers);
			return [keys]
				.concat(data.map(o => keys.map(k => o[headers[k]])))
				.map(line =>
					line
						.map(field =>
							/[,"\n]/.test(field) ? `"${field.replace(/"/g, '""')}"` : field
						)
						.join(',')
				)
				.join('\n');
		};
		if (0) {
			res.contentType('text/plain');
		} else {
			res.contentType('text/csv');
			res.attachment(`${store.slug}.csv`);
		}
		res.send(csv(items));
	});

	return { admin: true };
};
