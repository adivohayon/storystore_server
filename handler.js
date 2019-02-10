'use strict';
module.exports.api = require('serverless-http')(require('./api'), {
	callbackWaitsForEmptyEventLoop: false,
});
