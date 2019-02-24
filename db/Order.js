'use strict';

module.exports = (sequelize, Sequelize) => {
	const model = sequelize.define(
		'Order',
		{
			status: {
				// type: Sequelize.ENUM('PENDING', 'ERROR', 'SUCCESS'),
				type: Sequelize.STRING,
			},
			personal: Sequelize.JSON,
			address: Sequelize.JSON,
			items: Sequelize.JSON,
			total: Sequelize.DECIMAL(19, 4),
			request: Sequelize.JSON,
			response: Sequelize.JSON,
		},
		{
			indexes: [{ fields: ['status'] }],
		}
	);

	model.associate = function({ Store }) {
		this.belongsTo(Store);
	};
};
