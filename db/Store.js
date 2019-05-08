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
			shipping_options: Sequelize.JSON,
			payment: Sequelize.JSON,
			returns: Sequelize.TEXT,
			shipping_details: Sequelize.TEXT,
			settings: {
				type: Sequelize.JSON,
				defaultValue: {
					hasCart: true,
					primaryColor: '#000000',
					sendEmail: false,
					showSeeMore: true,
				},
			},
			// coupon_code: Sequelize.STRING,
		},
		{}
	);

	model.associate = function({ Shelf, Order }) {
		this.hasMany(Shelf, { as: 'shelves' });
	};
};
