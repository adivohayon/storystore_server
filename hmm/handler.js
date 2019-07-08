'use strict';
global.__DEV__ = process.env.NODE_ENV == 'development';

module.exports.hmm = require('serverless-http')(require('./hmm'), {
	callbackWaitsForEmptyEventLoop: false,
});
