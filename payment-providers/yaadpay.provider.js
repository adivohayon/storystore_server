const _ = require('lodash');

const axios = require('axios');
module.exports = class YaadPay {
	constructor(masof, storeSlug, order) {
		this.Masof = masof;
		this.API_URL = 'https://icom.yaad.net/p/';
		this.storeSlug = storeSlug;
		this.order = order;
	}

	PayRequest(amount, transactionInfo) {
		return {
			// Config
			action: 'pay',
			Masof: this.Masof,
			UTF8: true,
			UTF8out: true,
			sendemail: true,
			PageLang: 'HEB',
			Coin: 1,
			SendHesh: true,
			// Order
			// Order: this.order,
			Amount: amount,
			Info: transactionInfo,
			// Client info
			ClientName: _.get(this.order, 'personal.firstName', 'unknown'),
			ClientLName: _.get(this.order, 'personal.lastName', 'unknown'),
			street: _.get(this.order, 'address.street'),
			city: _.get(this.order, 'address.city'),
			zip: _.get(this.order, 'address.zipCode'),
			phone: _.get(this.order, 'personal.phone'),
			email: _.get(this.order, 'personal.email'),
		};
	}

	getUrl(payRequest) {
		const url =
			this.API_URL +
			'?' +
			Object.keys(payRequest)
				.map(
					key =>
						encodeURIComponent(key) + '=' + encodeURIComponent(payRequest[key])
				)
				.join('&');

		return { url };
	}

	pay(payRequest) {
		console.log('MAKING PAYMENT REQUEST TO', this.API_URL);
		console.log(payRequest);
		return axios.post(this.API_URL, payRequest);
	}
};
