const YaadPay = require('./../payment-providers/yaadpay.provider');
const Paypal = require('./../payment-providers/paypal.provider');
const Payplus = require('./../payment-providers/payplus.provider');

module.exports = class DefaultConnector {
	constructor() {
		this.name = 'default';
	}


	addToCart(item) {
	}

	setConnectorName(name) {
		this.name = name;
	}
};
