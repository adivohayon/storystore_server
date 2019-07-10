const path = require('path');
const require_all = require('require-all');
const Sequelize = require('sequelize');

// TO DO: check why const dbUrl = process.env.DATABASE_URL; returns object and not string
const dbUrl = 'postgres://danaweingart:localpass@localhost/storystore';
console.log('dbUrl', process.env.DATABASE_URL);
const sequelize = (module.exports = new Sequelize(dbUrl, {
	operatorsAliases: false,
	logging: false,
	// logging: console.log,
	pool: {
		max: 1,
		acquire: 20000,
	},
}));

for (const controller of Object.values(
	require_all({
		dirname: path.resolve(__dirname, './'),
		filter: filename => {
			if (!filename.endsWith('.js')) return false;
			if (filename == 'index.js') return false;
			return filename;
		},
	})
)) {
	controller(sequelize, Sequelize);
}

for (const model of Object.values(sequelize.models)) {
	// console.log('model', model.name);
	if (model.associate) model.associate(sequelize.models);
}
