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
				where: { slug: req.params.store },

				include: [
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
				order: [['shelves', 'shelf_order', 'ASC']],
			})
		);
	});

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
