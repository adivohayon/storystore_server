'use strict';

module.exports = (sequelize, Sequelize) => {
	const model = sequelize.define(
		'Order',
		{
			status: {
				// type: Sequelize.ENUM('PENDING', 'ERROR', 'SUCCESS'),
				type: Sequelize.STRING,
				defaultValue: 'CREATED',
			},
			total: Sequelize.DECIMAL(19, 4),
			payment_provider_request: Sequelize.JSON,
			shipping_type: Sequelize.STRING,
			shipping_price: {
				type: Sequelize.DECIMAL(19, 4),
				required: true,
				allowNull: false,
				get() {
					const price = this.getDataValue('shipping_price');
					return Math.floor(parseFloat(price));
				},
			},
		},
		{
			indexes: [{ fields: ['status'] }],
		}
	);

	model.associate = function({ Variation_Attribute, Customer, Attribute }) {
		// this.hasOne(Customer);
		this.belongsTo(Customer, { as: 'customer' });
		this.belongsToMany(Variation_Attribute, {
			as: 'items',
			through: {
				model: 'Order_Item',
				unique: false,
			},
			foreignKey: 'order_id',
		});
	};
};
