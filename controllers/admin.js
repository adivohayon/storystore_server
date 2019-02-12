'use strict';
const _ = require('lodash');
const csvtojson = require('csvtojson');
const AWS = require('aws-sdk');

const S3 = new AWS.S3();

module.exports = (app, { sequelize, Store, Shelf, Variation }) => {
	app.use((req, res, next) => {
		req.session.admin = true;
		next();
	});

	app.get('/', async (req, res) => {
		res.render('admin', { stores: await Store.findAll() });
	});

	app.get('/sync', async (req, res) => {
		await sequelize.sync();
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

	app.post('/import', async (req, res) => {
		const store = await Store.findOne({ where: { slug: req.body.store } });
		// const uploadAssets = req.body.uploadAssets;

		if (!store) return res.json({ error: 'missing store id' });
		// console.log('uploadAssets', uploadAssets);
		// if (uploadAssets) {
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
		// }
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

		console.log('shelves', shelves);
		for (const {
			slug,
			name,
			short_description: description,
			info,
			shelf_id,
		} of shelves) {
			const [shelf] = await Shelf.findCreateFind({
				where: { slug, StoreId: store.id },
				defaults: { name, description, info },
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

	return { admin: true };
};
