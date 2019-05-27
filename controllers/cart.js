// const _ = require('lodash');
const axios = require('axios');
const config = {
	headers: {
		'Content-Type': 'application/x-www-form-urlencoded',
	},
};
const ApiUrl = 'https://www.hoodies.co.il/Handlers/AddToCartHandler.ashx';
const FormData = {
	q: '2076_24066_1.416068.0_2.415145.0',
	func: '',
};
const StringifiedFormData = JSON.stringify(FormData);

module.exports = app => {
	app.post('/add-to-cart', async (req, res) => {
		// axios.post(ApiUrl, StringifiedFormData, config);
		// .then(result => {
		// 	console.log('success', result.data.message);
		// 	return res.send(result.data.message);
		// })
		// .catch(error => {
		// 	console.log(error.response);
		// });
		try {
			// const {data} = await axios.post(ApiUrl, StringifiedFormData, config);
			const response = await axios.post(ApiUrl, StringifiedFormData, config);
			console.log('%%%', response);
			return res.send(response);
		} catch (err) {
			console.error(err);
		}
	});
};
