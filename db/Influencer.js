'use strict';
const _ = require('lodash');
module.exports = (sequelize, Sequelize) => {
	const model = sequelize.define(
		'Influencer',
		{
			slug: { type: Sequelize.STRING },
			name: { type: Sequelize.STRING },
			settings: {
				type: Sequelize.JSON,
				defaultValue: {
					type: 'STORY',
				},
			},
		},
		{
			// name: {
			// 	singular: 'catego',
			// 	plural: 'attributes',
			// },
			indexes: [{ fields: ['slug'] }],
		}
	);

	model.associate = function({ Store, Shelf }) {
		this.belongsTo(Store);

		this.belongsToMany(Shelf, {
			as: 'shelves',
			through: {
				model: 'Influencer_Shelf',
				unique: false,
			},
			foreignKey: 'influencer_id',
		});
	};
};
