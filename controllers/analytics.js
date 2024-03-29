const Analytics = require('./../services/analytics.service');
const TRANSPARENT_GIF_BUFFER = Buffer.from(
	'R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=',
	'base64'
);

module.exports = (app, {}) => {
	app.get('/pixel', async (req, res) => {
		console.log('TRANSPARENT_GIF_BUFFER', TRANSPARENT_GIF_BUFFER.length);
		const analytics = new Analytics('UA-134688384-1');

		const { action, storeSlug, influencer } = req.query;
		if (action) {
			try {
				switch (action) {
					case 'checkoutComplete':
						await analytics.checkoutComplete(storeSlug, influencer);
						break;
					case 'checkoutBegin':
						await analytics.checkoutBegin(storeSlug, influencer);
						break;
					default:
						await analytics.pixelLoaded();
						break;
				}
				res.writeHead(200, { 'Content-Type': 'image/gif' });
				// res.end(TRANSPARENT_GIF_BUFFER, 'binary');
				res.end(new Buffer(TRANSPARENT_GIF_BUFFER, 'binary'));
			} catch (err) {
				console.error(err);
				res.sendStatus(500).send(err.toString());
			}
		}

		// res.writeHead(200, {
		// 	'Content-Type': 'image/gif',
		// 	'Content-Length': TRANSPARENT_GIF_BUFFER.length,
		// });

		// const { things } = req.query;
	});
};
