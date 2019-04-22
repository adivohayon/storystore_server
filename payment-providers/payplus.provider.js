// const _ = require('lodash');
// const { URL } = require('url');
// const axios = require('axios');
module.exports = class Payplus {
	constructor(pfsAuthCode, isTest) {
		this.pfsAuthCode = pfsAuthCode;
		this.API_URL = 'https://ws.payplus.co.il/pp/cc/';
	}

	directLink(amount, orderId, returnURL) {
		// https://ws.payplus.co.il/pp/cc/oc.aspx?a=100&uniqNum=order1&pfsAuthCode=108ebd12540248bc9fb2ac7e600cc3c3&refURL=http://localhost:4000/payplus-test-capture
		const queryStr = this.jsonToQueryString({
			a: amount * 100,
			// a: 1,
			uniqNum: orderId,
			pfsAuthCode: this.pfsAuthCode,
			refURL: returnURL,
		});
		return this.API_URL + 'oc.aspx' + queryStr;
	}

	jsonToQueryString(json) {
		return (
			'?' +
			Object.keys(json)
				.map(function(key) {
					return encodeURIComponent(key) + '=' + encodeURIComponent(json[key]);
				})
				.join('&')
		);
	}
};
