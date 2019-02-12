'use strict';

module.exports = (sequelize, Sequelize) => {
	const model = sequelize.define(
		'Store',
		{
			slug: {
				type: Sequelize.STRING,
				unique: true,
				allowNull: false,
				required: true,
			},
			name: Sequelize.STRING,
			tagline: Sequelize.STRING,
			about: Sequelize.TEXT,
			info: Sequelize.JSON,
			shipping_details: Sequelize.TEXT,
			payment: Sequelize.JSON,
		},
		{}
	);

	model.associate = function({ Shelf, Order }) {
		this.hasMany(Shelf, { as: 'shelves' });
		this.hasMany(Order, { as: 'orders' });
	};
};
