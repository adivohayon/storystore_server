'use strict';

module.exports = (sequelize, Sequelize) => {
	const model = sequelize.define(
		'Shelf',
		{
			slug: { type: Sequelize.STRING, allowNull: false, required: true },
			name: Sequelize.STRING,
			description: Sequelize.TEXT,
			info: Sequelize.TEXT,
			type: { type: Sequelize.STRING, defaultValue: 'ADD_TO_CART' },
			cta_text: { type: Sequelize.STRING, defaultValue: 'הוספה לסל' },
			data: { type: Sequelize.JSON },
			shelf_order: Sequelize.INTEGER,
		},
		{
			indexes: [{ fields: ['StoreId', 'slug'], unique: true }],
		}
	);

	model.associate = function({ Store, Variation, Category, Influencer }) {
		this.belongsTo(Store);
		this.hasMany(Variation, { as: 'variations', onDelete: 'CASCADE' });
		this.belongsToMany(Category, {
			through: {
				model: 'Category_Shelf',
				unique: false,
			},
			foreignKey: 'shelf_id',
		});

		this.belongsToMany(Influencer, {
			through: {
				model: 'Influencer_Shelf',
				unique: false,
			},
			foreignKey: 'shelf_id',
		});
	};
};
