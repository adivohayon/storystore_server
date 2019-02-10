'use strict';

module.exports = (sequelize, Sequelize) => {
	let model = sequelize.define(
		'Shelf',
		{
			slug: { type: Sequelize.STRING, allowNull: false, required: true },
			name: Sequelize.STRING,
			description: Sequelize.TEXT,
			info: Sequelize.TEXT,
		},
		{
			indexes: [{ fields: ['StoreId', 'slug'], unique: true }],
		}
	);

	model.associate = function({ Store, Variation }) {
		this.belongsTo(Store);
		this.hasMany(Variation, { as: 'variations' });
	};
};
