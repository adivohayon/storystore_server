const Mailer = require('./../helpers/mailer.helper');

module.exports = (app, {}) => {
	app.get('/', async (req, res) => {
		res.sendStatus(200);
	});

	app.post('/submit-contact-form', async (req, res) => {
		const name = req.body.name || null;
		const company = req.body.company || null;
		const email = req.body.email || null;
		const phone = req.body.phone || null;

		try {
			if (name && company && phone && email) {
				const mailer = new Mailer();
				if (!mailer.validateEmail(email)) {
					throw new Error('Email not valid');
				}

				const view = mailer.getTemplate('contact-form');
				const from = `"storystore.co.il" <noreply@storystore.co.il>`;
				const to = ['hai@shop-together.io'];
				const subject = 'storystore Contact Form';
				res.render(
					view,
					{
						name,
						company,
						email,
						phone,
					},
					async (err, html) => {
						try {
							if (err) {
								throw new Error(err);
							}

							// return res.send(html);
							const mailResp = await mailer.send(from, to, subject, html);
							// console.log('mailResp', mailResp);
							return res.send(200);
						} catch (err) {
							console.error(err);
							return res.status(500).send(err.toString());
						}
					}
				);
			} else {
				throw new Error('Missing Fields');
			}
		} catch (err) {
			console.log('err', err.toString());
			res.status(422).send(err.toString());
		}

		// console.log(emailItems);
	});
};
