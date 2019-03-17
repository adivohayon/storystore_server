'use strict';
const _ = require('lodash');
const csvtojson = require('csvtojson');
const AWS = require('aws-sdk');

const ImportHelper = require('./../helpers/import.helper');
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

module.exports = (
	app,
	{ sequelize, Store, Shelf, Variation, Attribute, Item_Property }
) => {
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

	app.get('/item-properties', async (req, res) => {
		res.render('admin/item-properties', {
			itemProperties: await Item_Property.findAll(),
		});
	});

	app.post('/item-properties', async (req, res) => {
		if (!req.body.type || !req.body.label) {
			return res
				.status(400)
				.send({ message: `Missing info: could not find 'type' or 'label'.` });
		}
		try {
			await Item_Property.create({
				type: req.body.type,
				label: req.body.label,
			});

			return res.redirect('/admin/item-properties');
			// return res
			// 	.status(200)
			// 	.send({ message: 'New item property has been created.' });
		} catch (err) {
			if (
				err.errors &&
				err.errors[0] &&
				err.errors[0].validatorKey === 'not_unique'
			) {
				return res.status(400).send({ message: err.errors[0].message });
			}
			console.log('!!!Error!!! - Admin / Create Item Property', err);
			return res.status(400).send({ message: err });
		}
	});

	app.get('/sync', async (req, res) => {
		await sequelize.sync({ alter: !!+req.query.alter, force: true });
		console.log('afterSync');
		const itemProperties = [
			{ type: 'fashion_simple_size', label: 'מידה' },
			{ type: 'fashion_simple_color', label: 'צבע' },
			{ type: 'carver_axis', label: 'ציר' },
			{ type: 'musical_key', label: 'סולם' },
			{ type: 'size_cm', label: 'מידה בס״מ' },
			{ type: 'musical_note_count', label: 'מס תווים' },
			{ type: 'size_general', label: 'מידה' },
		];
		const createPromises = [];
		for (const { type, label } of itemProperties) {
			createPromises.push(
				Item_Property.findCreateFind({
					where: { type, label },
					defaults: {
						type,
						label,
					},
				})
			);
		}
		await Promise.all(createPromises);
		res.json({ ok: true });
	});

	app.post('/create-store', async (req, res) => {
		const info = {
			address: req.body.store_info_address,
			email: req.body.store_info_email,
			phone: req.body.store_info_phone,
			openingHours: req.body['store_info_opening-hours'],
		};

		const payment = {
			provider: req.body.payment_provider,
			test: req.body.payment_test == 'true',
			accountId: req.body.payment_account_id,
		};
		await Store.create({
			slug: req.body.store_slug,
			name: req.body.store_name || req.body.store_slug,
			tagline: req.body.store_tagline,
			about: req.body.store_about,
			info,
			shipping_details: req.body.shipping_details,
			returns: req.body.returns,
			payment,
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

	app.post('/add-attribute', async (req, res) => {
		try {
			const variation = await Variation.findOne({ where: { id: 3 } });
			const newAttribute = {
				label: req.body.label.trim() || '',
				value: req.body.label.trim() || '',
				ItemPropertyId: Number(req.body.ItemPropertyId),
			};

			const attribute = await Attribute.create(newAttribute);
			await variation.addAttribute(attribute);

			res.json({ message: 'Attribute added successfully.', attribute });
		} catch (err) {
			console.log('!!!Error!!! - Admin / Add Attribute', err);
			res.status(400).send({ message: err });
		}
	});

	app.delete('/delete-shelves', async (req, res) => {
		try {
			await Shelf.destroy({ where: { StoreId: req.body.storeId } });
			res.json({
				message:
					'successfuly removed all shelves for storeId: ' + req.body.storeId,
			});
		} catch (err) {
			res.status(400).send({ message: err });
		}
	});

	app.post('/test-import', async (req, res) => {
		try {
			const store = await Store.findOne({ where: { slug: req.body.store } });
			if (!store)
				return res
					.status(400)
					.send({ message: 'Could not find store or missing store slug' });

			const importModels = { Store, Shelf, Variation, Attribute };
			const importHelper = new ImportHelper(
				store.id,
				store.slug,
				sequelize,
				importModels
			);
			const assets = await importHelper.getAssets();


			if (!req.body.csv || req.body.csv.length == 0) {
				return res.status(400).send({ message: 'CSV file was not found' });
			}

			// return res.json({ csv: req.body.csv });

			const {
				shelves,
				variations,
				attributes,
			} = await importHelper.csvToTables(req.body.csv);

			// return res.json(variations);

			const { message } = await importHelper.injectTables(
				shelves,
				variations,
				attributes,
				assets
			);

			return res.json({ message });
		} catch (err) {
			console.log('!!!ERROR!!! - Test Import', err);
			return res.status(400).send({ message: err });
		}
	});

	app.post('/import', async (req, res) => {
		console.log('req.body.store', req.body.store);
		const store = await Store.findOne({ where: { slug: req.body.store } });
		if (!store) return res.json({ error: 'missing store id' });

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
		// console.log('variation', variations[0]);
		console.log('shelves', shelves);
		for (const {
			id: ShelfId,
			slug,
			name,
			info,
			description,
			shelfOrder,
		} of shelves) {
			// console.log('order', +shelfOrder);
			const [shelf] = await Shelf.findCreateFind({
				where: { slug, StoreId: store.id },
				defaults: {
					shelfOrder: Number(shelfOrder),
					name: name.trim(),
					description: description.trim(),
					info: info.trim(),
					slug,
				},
			});
			// console.log('shelf', shelf.id);
			await sequelize.transaction(async transaction => {
				for (const chunk of _.chunk(
					variations.filter(v => ShelfId == v.ShelfId && !v.id),
					50
				)) {
					await Variation.bulkCreate(
						chunk.map(
							({
								variation: { sku, slug, price, sale_price, attributes },
							}) => ({
								ShelfId: shelf.id,
								slug,
								sku,
								attrs: attributes,
								price: +price || 0,
								sale_price: +sale_price || null,
								assets: {
									images: keys
										.filter(key =>
											key.startsWith(
												[store.slug, shelf.slug, slug, ''].join('/')
											)
										)
										.map(key => key.split('/').pop()),
								},
							})
						),
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
				['id', 'variation.id'],
				// 'Variation.id',
				['Variation.slug', 'variation.slug'],
				['sku', 'variation.sku'],
				['attrs', 'attributes'],
				['price', 'variation.price'],
				['sale_price', 'variation.sale_price'],
				['currency', 'variation.currency'],
			],
			include: [
				{
					model: Shelf,
					attributes: [
						'Shelf.id',
						['Shelf.slug', 'shelf.slug'],
						'name',
						'info',
						'description',
						'order',
					],
					where: { StoreId: store.id },
				},
			],
			raw: true,
		})).map(flat);
		console.log('items', items);

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
