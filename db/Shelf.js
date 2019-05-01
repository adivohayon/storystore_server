'use strict';

module.exports = (sequelize, Sequelize) => {
	const model = sequelize.define(
		'Shelf',
		{
			slug: { type: Sequelize.STRING, allowNull: false, required: true },
			name: Sequelize.STRING,
			description: Sequelize.TEXT,
			info: Sequelize.TEXT,
			type: { type: Sequelize.STRING, defaultValue: 'SHOPPABLE' },
			cta_text: { type: Sequelize.STRING, defaultValue: 'הוספה לסל' },
			data: { type: Sequelize.JSON },
			shelf_order: Sequelize.INTEGER,
		},
		{
			indexes: [{ fields: ['StoreId', 'slug'], unique: true }],
		}
	);

	model.associate = function({ Store, Variation }) {
		this.belongsTo(Store);
		this.hasMany(Variation, { as: 'variations', onDelete: 'CASCADE' });
	};
};
