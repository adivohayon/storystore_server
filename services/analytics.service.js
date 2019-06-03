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
	checkoutComplete(totalValue) {
		return new Promise((resolve, reject) => {
			this.visitor.event('category', 'action', 'label', 'value', )
			this.visitor.event(
				'checkoutComplete',
				'complete',
				totalValue,
				totalValue,
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
