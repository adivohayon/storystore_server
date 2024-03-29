'use strict';
global.__DEV__ = process.env.NODE_ENV == 'development';

module.exports.api = require('serverless-http')(require('./api'), {
	callbackWaitsForEmptyEventLoop: false,
});

