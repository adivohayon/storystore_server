import { Routes } from './routes';

const express = require('express');
const sls = require('serverless-http');
const app = express();

// Test that serverless works
app.get('/ping', (req, res) => {
	res.send('pong');
});

// Setup all routes
Routes(app);

// Export API for serverless
export const api = sls(app, {});
