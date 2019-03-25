'use strict';
const _ = require('lodash');
module.exports = (sequelize, Sequelize) => {
	const model = sequelize.define('Attribute', {
		label: { type: Sequelize.STRING, allowNull: false },
		value: { type: Sequelize.STRING, allowNull: false },
	}, {
		name: {
			singular: 'attribute',
			plural: 'attributes',
		},
		indexes: [{ fields: ['label', 'value'], unique: true }],
	});

	model.associate = function({ Variation, Item_Property, Order }) {
		// this.hasMany(Item_Properties, { as: 'item_property' });
		// this.hasOne(Item_Property);
		this.belongsTo(Item_Property, { as: 'itemProperty' });
		
		this.belongsToMany(Variation, {
			through: {
				model: 'Variation_Attribute',
				unique: false,
			},
			foreignKey: 'attributeId',
		});

	};
};
