// const AuthHelper = require('../helpers/auth.helper');

module.exports = (app, { User }) => {
	app.get('/', async (req, res) => {
		res.json(await User.findAll());
	});

	// Create new user
	// app.post('/', async (req, res) => {
	// 	if (!req.body.email || !req.body.password || !req.body.username) {
	// 		return res.status(400).send({ message: 'Some values are missing' });
	// 	}

	// 	if (!AuthHelper.isValidEmail(req.body.email)) {
	// 		return res
	// 			.status(400)
	// 			.send({ message: 'Please enter a valid email address' });
	// 	}
	// 	const hashPassword = AuthHelper.hashPassword(req.body.password);

	// 	try {
	// 		const newUser = await User.create({
	// 			email: req.body.email,
	// 			password: hashPassword,
	// 			username: req.body.username,
	// 		});
	// 		console.log('Created new user - ID:', newUser.id);
	// 		const token = AuthHelper.generateToken(newUser.id);
	// 		return res.json({ token });
	// 	} catch (err) {
	// 		if (err.original && err.original.routine === '_bt_check_unique') {
	// 			return res
	// 				.status(400)
	// 				.json({ message: 'User already exist: ' + err.errors[0].message });
	// 		} else {
	// 			return res.status(400).send(err);
	// 		}
	// 	}
	// });

	// app.post('/login', async (req, res) => {
	// 	const loginParam = req.body.email || req.body.username || req.body.phone;
	// 	console.log('loginParam', loginParam);
	// 	if (!loginParam || !req.body.password) {
	// 		return res.status(400).send({ message: 'Some values are missing' });
	// 	}
	// 	if (req.body.email && !AuthHelper.isValidEmail(req.body.email)) {
	// 		return res
	// 			.status(400)
	// 			.send({ message: 'Please enter a valid email address' });
	// 	}
	// 	try {
	// 		const where = AuthHelper.generateFindUserWhere(req.body);
	// 		const user = await User.findOne({ where });
	// 		// console.log('user', user);

	// 		if (!user) {
	// 			return res
	// 				.status(400)
	// 				.send({ message: 'The credentials you provided is incorrect' });
	// 		}

	// 		// console.log('yoo');
	// 		if (!AuthHelper.comparePassword(user.password, req.body.password)) {
	// 			return res
	// 				.status(400)
	// 				.send({ message: 'The credentials you provided is incorrect' });
	// 		}

	// 		const token = AuthHelper.generateToken(user.id);
	// 		return res.status(200).send({ token, user });
	// 	} catch (error) {
	// 		return res.status(400).send(error);
	// 	}
	// });

	// Verify token middleware
	// app.use(async (req, res, next) => {
	// 	const token = req.headers['x-access-token'];
	// 	if (!token) {
	// 		return res.status(400).send({ message: 'Token is not provided' });
	// 	}
	// 	try {
	// 		console.log('token', token);
	// 		const decoded = await AuthHelper.verifyToken(token);
	// 		const user = await User.findOne({ where: { id: decoded.userId } });

	// 		if (!user) {
	// 			return res
	// 				.status(400)
	// 				.send({ message: 'The token you provided is invalid' });
	// 		}
	// 		req.user = { id: decoded.userId };
	// 		next();
	// 	} catch (error) {
	// 		return res.status(400).send(error);
	// 	}
	// });

	app.get('/:userId', async (req, res) => {
		if (Number(req.params.userId) !== Number(req.user.id)) {
			return res
				.status(400)
				.send({ message: 'The user does not match the token' });
		}

		const user = await User.findOne({ where: { id: req.user.id } });



		console.log('aaaa');
		res.json(user);
	});
};
