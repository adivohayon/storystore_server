'use strict';
const _ = require('lodash');
module.exports = (sequelize, Sequelize) => {
	const model = sequelize.define(
		'Customer',
		{
			first_name: { type: Sequelize.STRING, allowNull: false },
			last_name: { type: Sequelize.STRING, allowNull: false },
			phone: { type: Sequelize.STRING, allowNull: false },
			email: { type: Sequelize.STRING, allowNull: false },
			shipping_address: { type: Sequelize.STRING, allowNull: false },
			shipping_city: { type: Sequelize.STRING, allowNull: false },
			shipping_country_code: { type: Sequelize.STRING, defaultValue: 'IL' },
			shipping_state_code: { type: Sequelize.STRING },
			shipping_zip_code: { type: Sequelize.INTEGER },
		},
		{
			indexes: [
				{ fields: ['email'] },
				{ fields: ['first_name', 'last_name'] },
				{ fields: ['phone'] },
			],
		}
	);

	model.associate = function({ Order }) {
		// this.belongsTo(Order, { as: 'order' });
		// this.hasOne(Attribute);
		// this.hasOne(Variation);
	};
};
