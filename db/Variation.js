'use strict';

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
					// return this.getDataValue('price').toFixed(2);
					// return prc;
				}
			},
			sale_price: Sequelize.DECIMAL(19, 4),
			currency: { type: Sequelize.CHAR(3), defaultValue: 'ILS' },
			assets: Sequelize.JSON,
		},
		{
			indexes: [{ fields: ['ShelfId', 'slug'] }],
		}
	);

	model.associate = function({ Shelf }) {
		this.belongsTo(Shelf);
	};
};
