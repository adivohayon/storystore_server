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
			indexes: [{ fields: ['id', 'type'], unique: true }],
		}
	);

	model.associate = function({ Item_Attribute, Variation }) {
		this.hasOne(Item_Attribute);
		this.hasOne(Variation);
	};
};
