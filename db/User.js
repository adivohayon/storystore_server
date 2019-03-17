'use strict';

module.exports = (sequelize, Sequelize) => {
	const model = sequelize.define(
		'User',
		{
			email: {
				type: Sequelize.STRING,
				allowNull: false,
				required: true,
				unique: true,
			},
			password: { type: Sequelize.STRING, allowNull: false, required: true },
			username: {
				type: Sequelize.STRING,
				allowNull: false,
				required: true,
				unique: true,
			},
			phone: { type: Sequelize.STRING, unique: true },
			first_name: Sequelize.STRING,
			last_name: Sequelize.STRING,
			tagline: Sequelize.STRING,
		},
		{
			indexes: [{ fields: ['email', 'username', 'phone'], unique: true }],
		}
	);
};
