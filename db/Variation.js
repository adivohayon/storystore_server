'use strict';
const _ = require('lodash');
module.exports = (sequelize, Sequelize) => {
	const model = sequelize.define(
		'Variation',
		{
			slug: { type: Sequelize.STRING, allowNull: false },
			sku: Sequelize.STRING,
			attrs: Sequelize.JSON,
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
			assets: Sequelize.JSON,
		},
		{
			getterMethods: {
				finalPrice() {
					return this.get('sale_price') || this.get('price');
				},
				attributesStr() {
					let variationsArr = [];
					for (let key in this.attrs) {
						if (this.attrs.hasOwnProperty(key)) {
							const label = _.get(this.attrs, [key, 'label'], '');
							if (label.length > 0) {
								variationsArr.push(label);
							}
						}
					}

					return variationsArr.join(' - ');
				},
			},
			indexes: [{ fields: ['ShelfId', 'slug'] }],
		}
	);

	model.associate = function({ Shelf }) {
		this.belongsTo(Shelf);
	};
};
