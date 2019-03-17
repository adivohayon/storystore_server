const _ = require('lodash');
const axios = require('axios');
axios.defaults.baseURL = 'https://api.sandbox.paypal.com';
const token =
	'A21AAEr9O4_tErr5cVMyCshlVIBRLcvHVce2LJmbrkierZ5aK0aKj3-fxbvSUGTavpnkdDZqBiZ8RGV2TrCEqCtoHOpjjP7Ag';
axios.defaults.headers.common = { Authorization: `bearer ${token}` };
module.exports = class Paypal {
	constructor(order) {
		this.order = order;
		// this.accessToken = accessToken;
		// this.paypalApi = paypalApi;
	}

	createOrder() {
		// console.log('$$$$$$', this.order);
		return (
			axios
				.post('/v2/checkout/orders', this.order)
				// .then(resp => {
				// 	console.log('CREATE ORDER RESP', resp);
				// })
				.catch(err => {
					console.log('CREATE ORDER ERROR', error);
				})
		);
	}

	captureOrder(orderId) {
		return axios
			.post('/v2/checkout/orders/' + orderId + '/capture')
			.then(resp => {
				console.log('CAPTURE ORDER RESP', resp);
			})
			.catch(err => {
				console.log('CAPTURE ORDER ERROR', err);
			});
	}

	// yo() {
	// 	return 'yooo: ' + this.test;
	// }
};
