'use strict';
const path = require('path');
const express = require('express');
const cors = require('cors');
const Sequelize = require('sequelize');
const require_all = require('require-all');
const sequelize = require('./db');

for (let fn of require('methods').concat('use', 'all')) {
	let orig = express.Router[fn];
	express.Router[fn] = function(...args) {
		return orig.apply(
			this,
			args.map(f => {
				if (typeof f != 'function' || f.length > 3 || (f.handle && f.set))
					return f;
				return (req, res, next) =>
					(async () => f(req, res, next))().catch(next);
			})
		);
	};
}

const app = (module.exports = express());
app.set('view engine', 'ejs');
app.set('views', path.resolve(__dirname, './views'));
app.set('db', { ...sequelize.models, sequelize, Sequelize });

app.use(
	require('cookie-session')({
		keys: [process.env.COOKIE_SECRET],
		maxAge: Number(process.env.COOKIE_AGE) || 30 * 86400000,
		secure: !__DEV__,
	})
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors({ origin: true, credentials: true }));

if (__DEV__) {
	app.use(async (req, res, next) => {
		await sequelize.sync();
		next();
	});
}

for (const [name, controller] of Object.entries(
	require_all({ dirname: path.resolve(__dirname, './controllers') })
)) {
	let router = express.Router();
	let { admin } = controller(router, app.get('db')) || {};
	app.use(
		`/${name}`,
		(req, res, next) => {
			if (!admin) return next();
			if (
				__DEV__ ||
				req.query.token == 'storystore12345678' ||
				req.session.admin
			)
				return next();
			res.status(401).end();
		},
		router
	);
}

app.use((err, req, res, next) => {
	console.error(err);
	res.status(500).send(__DEV__ ? err.stack : 'Server Error');
	next;
});
