const ua = require('universal-analytics');
module.exports = class Analytics {
	constructor(gaId) {
		this.visitor = ua(gaId);
	}

	pixelLoaded() {
		return new Promise((resolve, reject) => {
			this.visitor.event('pixelLoaded', 'loaded', 'loaded', 'loaded', err => {
				if (err) {
					reject(err);
				}

				resolve();
			});
		});
	}
	checkoutComplete(storeSlug, influencer) {
		return new Promise((resolve, reject) => {
			this.visitor.event(
				storeSlug + '__checkout',
				'checkoutComplete',
				'influencer',
				influencer,
				err => {
					if (err) {
						reject(err);
					}

					resolve();
				}
			);
		});
	}
};
