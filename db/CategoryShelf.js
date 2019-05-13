'use strict';
const _ = require('lodash');
module.exports = (sequelize, Sequelize) => {
	const model = sequelize.define(
		'Category_Shelf',
		{
			id: {
				type: Sequelize.INTEGER,
				primaryKey: true,
				autoIncrement: true,
			},
			category_id: { type: Sequelize.INTEGER, allowNull: false },
			shelf_id: { type: Sequelize.INTEGER, allowNull: false },
		},
		{
			indexes: [{ fields: ['category_id', 'shelf_id'] }],
		}
	);
};
