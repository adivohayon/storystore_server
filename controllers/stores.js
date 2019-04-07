'use strict';
const aws = require('aws-sdk');
const s3 = new aws.S3(); // Pass in opts to S3 if necessary

const getS3Object = (bucket, path) => {
	return new Promise((resolve, reject) => {
		const getParams = {
			Bucket: bucket, // your bucket name,
			Key: path, // path to the object you're looking for
		};
		s3.getObject(getParams, (err, data) => {
			if (err) {
				reject(err);
			}

			const str = data.Body.toString('utf-8');
			resolve(str);
		});
	});
};
module.exports = (
	app,
	{ sequelize, Store, Shelf, Variation, Attribute, Item_Property }
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
				],
				where: { slug: req.params.store },
			})
		);
	});

	app.get('/:storeId/shelves', async (req, res) => {
		// return res.json()
		const limit = Number(req.query.limit) || 5;
		const offset = Number(req.query.offset) || 0;
		const shelves = await Shelf.findAll({
			attributes: ['id', 'slug', 'name', 'description', 'info', 'shelf_order'],
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
					],
					where: sequelize.where(
						sequelize.fn('array_length', sequelize.col('assets'), 1),
						{ [sequelize.Op.gt]: 0 }
					),
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
	/*
		include: [
			{
						// order: [['shelves', 'shelf_order', 'ASC']],
						model: Shelf,
						as: 'shelves',
						limit: Number(req.body.limit) || 5,
						// offset: Number(req.body.offset) || 0,
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
								],
								where: sequelize.where(
									sequelize.fn('array_length', sequelize.col('assets'), 1),
									{ [sequelize.Op.gt]: 0 }
								),
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
										through: { attributes: ['id'], as: 'variationAttribute'},
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
				],
*/
	app.get('/:store/texts', async (req, res) => {
		const policy = await getS3Object(
			'storystore-api',
			`${req.params.store}/${req.params.store}_policy.txt`
		);
		const customerService = await getS3Object(
			'storystore-api',
			`${req.params.store}/${req.params.store}_customer_service.txt`
		);

		res.json({ policy, customerService });
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
