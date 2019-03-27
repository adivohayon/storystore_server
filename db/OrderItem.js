'use strict';
const _ = require('lodash');
module.exports = (sequelize, Sequelize) => {
	const model = sequelize.define(
		'Order_Item',
		{
			id: {
				type: Sequelize.INTEGER,
				primaryKey: true,
				autoIncrement: true,
			},
			order_id: { type: Sequelize.INTEGER, allowNull: false },
			variation_attribute_id: { type: Sequelize.INTEGER, allowNull: false },
			// attribute_id:{ type: Sequelize.INTEGER },
			quantity: { type: Sequelize.INTEGER, defaultValue: 1 },
		},
		{
			indexes: [
				{ fields: ['order_id', 'variation_attribute_id'], unique: true },
			],
		}
	);
};
