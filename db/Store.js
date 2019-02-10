'use strict';

module.exports = (sequelize, Sequelize) => {
	let model = sequelize.define(
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
		},
		{}
	);

	model.associate = function({ Shelf }) {
		this.hasMany(Shelf, { as: 'shelves' });
	};
};
