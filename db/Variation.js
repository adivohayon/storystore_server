'use strict';
const _ = require('lodash');
module.exports = (sequelize, Sequelize) => {
	const model = sequelize.define(
		'Variation',
		{
			slug: { type: Sequelize.STRING, allowNull: false },

			price: {
				type: Sequelize.DECIMAL(19, 4),
				required: true,
				allowNull: false,
				get() {
					const price = this.getDataValue('price');
					return Math.floor(parseFloat(price));
				},
			},
			sale_price: {
				type: Sequelize.DECIMAL(19, 4),
				get() {
					const price = this.getDataValue('sale_price');
					return Math.floor(parseFloat(price));
				},
			},
			currency: { type: Sequelize.CHAR(3), defaultValue: 'ILS' },
			property_label: Sequelize.STRING,
			property_value: Sequelize.STRING,
			assets: Sequelize.ARRAY(Sequelize.STRING(1024)),
			variation_order: Sequelize.INTEGER,
			product_url: Sequelize.STRING,
			variation_info: Sequelize.TEXT,
		},
		{
			getterMethods: {
				finalPrice() {
					return this.get('sale_price') || this.get('price');
				},
				// attributesStr() {
				// 	let variationsArr = [];
				// 	for (let key in this.attrs) {
				// 		if (this.attrs.hasOwnProperty(key)) {
				// 			const label = _.get(this.attrs, [key, 'label'], '');
				// 			if (label.length > 0) {
				// 				variationsArr.push(label);
				// 			}
				// 		}
				// 	}

				// 	return variationsArr.join(' - ');
				// },
			},
			indexes: [{ fields: ['ShelfId', 'slug'], unique: true }],
			name: {
				singular: 'variation',
				plural: 'variations',
			},
		}
	);

	model.associate = function({ Shelf, Attribute, Item_Property, Order }) {
		this.belongsTo(Shelf);
		this.belongsTo(Item_Property, { as: 'itemProperty' });
		this.belongsToMany(Attribute, {
			through: {
				model: 'Variation_Attribute',
				unique: false,
			},
			foreignKey: 'variationId',
		});
	};
};
