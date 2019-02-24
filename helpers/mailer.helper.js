// const gmailSend = require('gmail-send');
const nodemailer = require('nodemailer');
module.exports = class Mailer {
	constructor() {
		this.user = 'adiv@shop-together.io';
		this.pass = 'igfuopwebaxyyrzd';
		this.transporter = nodemailer.createTransport({
			service: 'gmail',
			auth: {
				user: 'adiv@shop-together.io',
				pass: 'igfuopwebaxyyrzd',
			},
		});

		//var send = require('../index.js')({
		// user: credentials.user,                  // Your GMail account used to send emails
		// pass: credentials.pass,                  // Application-specific password
		// this.to = 'user@gmail.com';
		// to:   credentials.user,                  // Send to yourself
		// you also may set array of recipients:
		// [ 'user1@gmail.com', 'user2@gmail.com' ]
		// this.from = '';
		// from: by default equals to user
		// replyTo: credentials.user,            // replyTo: by default undefined
		// bcc: 'some-user@mail.com',            // almost any option of `nodemailer` will be passed to it
		// this.subject = 'test subject',
		// text:    'gmail-send example 1',         // Plain text
		//html:    '<b>html text</b>'            // HTML
	}

	getTemplate(template) {
		return `emails/${template}.email.ejs`;
	}
	renderEmail(render, template) {
		return new Promise((resolve, reject) => {
			console.log('RENDERING EMAIL...');
			render(template, {}, (err, html) => {
				if (err) {
					console.error('ERROR:', err);
					reject(err);
				}
				console.log('HTML', html);
				resolve(html);
			});
		});
	}

	send(from, to, subject, html) {
		return new Promise((resolve, reject) => {
			if (!this.validateEmail(to)) {
				reject(`Destination email '${to}' is not valid`);
			}
			if (!this.validateEmail(from)) {
				reject(`Sender email '${from}' is not valid`);
			}

			const mailOptions = {
				from,
				to,
				subject,
				html,
			};
			console.log(mailOptions);
			this.transporter.sendMail(mailOptions, (err, info) => {
				if (err) {
					reject(err);
				}
				resolve(info);
			});
		});
	}

	validateEmail(email) {
		const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		return regex.test(String(email).toLowerCase());
	}
};
