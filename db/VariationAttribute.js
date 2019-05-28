'use strict';
const _ = require('lodash');
module.exports = (sequelize, Sequelize) => {
	const model = sequelize.define(
		'Variation_Attribute',
		{
			id: {
				type: Sequelize.INTEGER,
				primaryKey: true,
				autoIncrement: true,
			},
			variationId: { type: Sequelize.INTEGER, allowNull: false },
			attributeId: { type: Sequelize.INTEGER },
			attribute_order: Sequelize.INTEGER,
			externalId: Sequelize.STRING,
		},
		{
			indexes: [{ fields: ['variationId', 'attributeId'], unique: true }],
		}
	);

	model.associate = function({ Variation, Attribute, Order }) {
		this.belongsTo(Attribute);
		this.belongsTo(Variation);
		this.belongsToMany(Order, {
			through: {
				model: 'Order_Item',
				unique: false,
			},
			foreignKey: 'variation_attribute_id',
		});
	};
};
