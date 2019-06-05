const ua = require('universal-analytics');
module.exports = class Analytics {
	constructor(gaId) {
		console.log('gaId', gaId);
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
			const eventParams = {
				// hitType: 'event',
				eventCategory: storeSlug + '__checkout',
				eventAction: 'checkout__complete',
				eventLabel: influencer,
				// eventValue: 'aaaa',
			};

			this.visitor.event(eventParams, function(err) {
				if (err) {
					console.log(err);
					reject(err);
				}
				console.log('checkout complete');
				resolve();
			});
		});
	}
};
