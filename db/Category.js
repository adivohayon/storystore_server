'use strict';
const _ = require('lodash');
module.exports = (sequelize, Sequelize) => {
	const model = sequelize.define(
		'Category',
		{
			slug: { type: Sequelize.STRING },
			label: { type: Sequelize.STRING },
			parent_id: { type: Sequelize.INTEGER, defaultValue: 0 },
		},
		{
			// name: {
			// 	singular: 'catego',
			// 	plural: 'attributes',
			// },
			indexes: [{ fields: ['slug', 'parent_id'] }],
		}
	);

	model.associate = function({ Shelf }) {
		this.belongsToMany(Shelf, {
			as: 'shelves',
			through: {
				model: 'Category_Shelf',
				unique: false,
			},
			foreignKey: 'category_id',
		});
		// // this.hasMany(Item_Properties, { as: 'item_property' });
		// // this.hasOne(Item_Property);
		// this.belongsTo(Item_Property, { as: 'itemProperty' });

		// this.belongsToMany(Variation, {
		// 	through: {
		// 		model: 'Variation_Attribute',
		// 		unique: false,
		// 	},
		// 	foreignKey: 'attributeId',
		// });
	};
};
