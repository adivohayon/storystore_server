'use strict';
const _ = require('lodash');
module.exports = (sequelize, Sequelize) => {
	const model = sequelize.define(
		'Influencer_Shelf',
		{
			id: {
				type: Sequelize.INTEGER,
				primaryKey: true,
				autoIncrement: true,
			},
			influencer_id: { type: Sequelize.INTEGER, allowNull: false },
			shelf_id: { type: Sequelize.INTEGER, allowNull: false },
		},
		{
			indexes: [{ fields: ['influencer_id', 'shelf_id'], unique: true }],
		}
	);

	model.associate = function({ Influencer }) {
		// this.belongsTo(Influencer);
	};
};
