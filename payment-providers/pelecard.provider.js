const axios = require('axios');

module.exports = class Pelecard {
	constructor(terminal, user, isTest) {
		// this.pfsAuthCode = pfsAuthCode;
		this.API_URL = 'https://gateway20.pelecard.biz/PaymentGW/';
		this.terminal = isTest ? '0962210' : terminal;
		this.user = isTest ? 'testpelecard3' : user;
		this.password = isTest ? 'Q3EJB8Ah' : password;
	}

	InitRequest(paymentReturnUrl, total) {
		const initRequest = {
			terminal: this.terminal,
			user: this.user,
			password: this.password,
			GoodUrl: `${paymentReturnUrl}&success=true`,
			ErrorUrl: `${paymentReturnUrl}&error=true`,
			// ServerSideGoodFeedbackURL: `${paymentReturnUrl}&success=true`,
			// ServerSideErrorFeedbackURL: `${paymentReturnUrl}&error=true`,
			Currency: 1,
			Total: total * 100,
			ActionType: 'J4',
		}

		if (this.isTest) {
			// Always succeed
			initRequest.QAResultStatus = '000';
		}
		return initRequest;
	}

	// init endpoint: should return the url
	Init(initRequest) {
		return axios.post(this.API_URL + 'init', initRequest);
	}
};