'use strict';
const aws = require('aws-sdk');
const s3 = new aws.S3(); // Pass in opts to S3 if necessary
const _ = require('lodash');
// TODO:  move to model

// TODO: move to helper
const getS3Object = (bucket, path) => {
	return new Promise((resolve, reject) => {
		const getParams = {
			Bucket: bucket, // your bucket name,
			Key: path, // path to the object you're looking for
		};
		s3.getObject(getParams, (err, data) => {
			if (err) {
				if (err.code === 'NoSuchKey') {
					resolve(false);
				}
				reject(err);
			}
			if (data) {
				const str = data.Body.toString('utf-8');
				resolve(str);
			} else {
				resolve(false);
			}
		});
	});
};

// TODO: refactor and abstract reusable code
module.exports = (
	app,
	{
		sequelize,
		Store,
		Shelf,
		Variation,
		Attribute,
		Item_Property,
		Category,
		Influencer,
	}
) => {
	app.get('/', async (req, res) => {
		res.json(await Store.findAll());
	});

	app.get('/:store', async (req, res) => {
		res.json(
			await Store.findOne({
				attributes: [
					'id',
					'slug',
					'name',
					'tagline',
					'about',
					'info',
					'shipping_options',
					'returns',
					'shipping_details',
					'settings',
					'desktop_url',
				],
				where: { slug: req.params.store },
			})
		);
	});

	app.get('/:storeId/influencers/:influencer_slug', async (req, res) => {
		try {
			if (!req.params.storeId || isNaN(req.params.storeId)) {
				throw new Error('No valid storeId provided');
			}
			// if (_.isNumber(req.params.storeId))

			if (!req.params.influencer_slug) {
				throw new Error('No influencer slug provided');
			}

			const shelfInclude = [
				{
					model: Shelf,
					as: 'shelves',
					include: [
						{
							model: Variation,
							as: 'variations',
							attributes: [
								['id', 'variationId'],
								'slug',
								'price',
								'sale_price',
								'currency',
								'property_label',
								'property_value',
								'assets',
								'variation_order',
								'ShelfId',
								'variation_info',
							],
							include: [
								{
									model: Attribute,
									as: 'attributes',
									attributes: ['label', 'value'],
									include: [
										{
											model: Item_Property,
											as: 'itemProperty',
											attributes: ['type', 'label'],
										},
									],
									through: { attributes: ['id', 'external_id'], as: 'variationAttribute' },
								},
								{
									model: Item_Property,
									as: 'itemProperty',
									attributes: ['type', 'label'],
								},
							],
						},
					],
				},
			];

			const influencer = await Influencer.findOne({
				attributes: ['id', 'slug', 'name'],
				where: {
					slug: req.params.influencer_slug,
					StoreId: req.params.storeId,
				},
				include: shelfInclude,
			});
			if (!influencer) {
				return res.status(404).send('Influencer not found');
			}

			return res.json(influencer);
		} catch (err) {
			console.error(err);
			return res.status(422).send(err.toString());
		}
	});

	app.get('/:storeId/categories/:category_slug', async (req, res) => {
		try {
			if (!req.params.category_slug) {
				throw new Error('No category slug provided');
			}

			const shelfInclude = [
				{
					model: Shelf,
					as: 'shelves',
					include: [
						{
							model: Variation,
							as: 'variations',
							attributes: [
								['id', 'variationId'],
								'slug',
								'price',
								'sale_price',
								'currency',
								'property_label',
								'property_value',
								'assets',
								'variation_order',
								'ShelfId',
								'variation_info',
							],
							include: [
								{
									model: Attribute,
									as: 'attributes',
									attributes: ['label', 'value'],
									include: [
										{
											model: Item_Property,
											as: 'itemProperty',
											attributes: ['type', 'label'],
										},
									],
									through: { attributes: ['id'], as: 'variationAttribute' },
								},
								{
									model: Item_Property,
									as: 'itemProperty',
									attributes: ['type', 'label'],
								},
							],
						},
					],
				},
			];

			const rootCategory = await Category.findOne({
				where: { slug: req.params.category_slug },
				include: shelfInclude,
			});
			// retyrb res.json(rootCategory);

			const subcategories = await Category.findAll({
				where: { parent_id: rootCategory.id },
				include: shelfInclude,
			});
			return res.json([rootCategory, ...subcategories]);
		} catch (err) {
			console.error(err);
		}
	});

	app.get('/:storeId/shelves', async (req, res) => {
		// return res.json()
		const limit = Number(req.query.limit) || 5;
		const offset = Number(req.query.offset) || 0;
		const shelves = await Shelf.findAll({
			attributes: [
				'id',
				'slug',
				'name',
				'description',
				'info',
				'shelf_order',
				'type',
				'cta_text',
				'data',
			],
			where: { StoreId: req.params.storeId },
			// order: [['shelf_order', 'ASC']],
			as: 'Shelf',
			order: [['shelf_order', 'ASC']],
			limit,
			offset,
			include: [
				{
					model: Variation,
					as: 'variations',
					attributes: [
						['id', 'variationId'],
						'slug',
						'price',
						'sale_price',
						'currency',
						'property_label',
						'property_value',
						'assets',
						'variation_order',
						'ShelfId',
						'variation_info',
					],
					// where: sequelize.where(
					// 	sequelize.fn('array_length', sequelize.col('assets'), 1),
					// 	{ [sequelize.Op.gt]: 0 }
					// ),
					include: [
						{
							model: Attribute,
							as: 'attributes',
							attributes: ['label', 'value'],
							include: [
								{
									model: Item_Property,
									as: 'itemProperty',
									attributes: ['type', 'label'],
								},
							],
							through: { attributes: ['id', 'external_id'], as: 'variationAttribute' },
						},
						{
							model: Item_Property,
							as: 'itemProperty',
							attributes: ['type', 'label'],
						},
					],
				},
			],
		});

		const pagination = {
			offset: offset + limit,
		};
		for (const shelf of shelves) {
			for (const variation of shelf.variations) {
				variation.assets = variation.assets.map(asset => ({
					src: `${shelf.slug}/${variation.slug}/${asset}`,
					loaded: false,
				}));
			}
		}
		return res.json({ shelves, pagination });
	});

	app.get('/:store/texts', async (req, res) => {
		const policy = await getS3Object(
			'storystore-api',
			`${req.params.store}/${req.params.store}_policy.txt`
		);
		if (!policy) {
			return res.status(404).send('Policy not found');
		}

		const customerService = await getS3Object(
			'storystore-api',
			`${req.params.store}/${req.params.store}_customer_service.txt`
		);

		if (customerService) {
			res.json({ policy, customerService });
		}

		return res.json({ policy });
	});

	app.get('/:store/shelves', async (req, res) => {
		res.json(
			await Shelf.findAll({
				include: [
					{ model: Store, attributes: [], where: { slug: req.params.store } },
					{ model: Variation, as: 'variations' },
				],
			})
		);
	});

	app.get('/:store/shelves/:shelf', async (req, res) => {
		res.json(
			await Shelf.findOne({
				where: { slug: req.params.shelf },
				include: [
					{ model: Store, attributes: [], where: { slug: req.params.store } },
					{ model: Variation, as: 'variations' },
				],
			})
		);
	});
};
