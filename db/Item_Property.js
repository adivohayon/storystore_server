'use strict';
const _ = require('lodash');
module.exports = (sequelize, Sequelize) => {
	const model = sequelize.define(
		'Item_Property',
		{
			type: { type: Sequelize.STRING, allowNull: false },
			label: { type: Sequelize.STRING, allowNull: false },
		},
		{
			indexes: [{ fields: ['type', 'label'], unique: true }],
		}
	);

	model.associate = function({ Attribute, Variation }) {
		// this.hasOne(Attribute);
		// this.hasOne(Variation);
	};
};
