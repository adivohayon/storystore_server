'use strict';
const _ = require('lodash');
module.exports = (sequelize, Sequelize) => {
	const model = sequelize.define('Variation_Attribute', {
		id : {
			type: Sequelize.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		variation_id:{ type: Sequelize.INTEGER, allowNull: false },
		attribute_id: { type: Sequelize.INTEGER, allowNull: false },
		attribute_order: Sequelize.INTEGER,
	}, 
	{
		indexes: [{ fields: ['variation_id', 'attribute_id'], unique: true }],
	});
};
