const _ = require('lodash');
const { URL } = require('url');
const axios = require('axios');
module.exports = class ICredit {
	// API_URL;
	// GroupPrivateToken;
	// storeSlug;
	// order;
	constructor(groupPrivateToken, isTest, storeSlug, order, orderNumber) {
		this.GroupPrivateToken = groupPrivateToken;
		this.API_URL = isTest
			? 'https://testicredit.rivhit.co.il/API/PaymentPageRequest.svc/'
			: 'https://icredit.rivhit.co.il/API/PaymentPageRequest.svc/';
		this.storeSlug = storeSlug;
		this.order = order;
		this.orderNumber = orderNumber;
	}

	getIPNUrls(hostname) {
		return {
			success: `https://${hostname}/order/${this.storeSlug}/ipn/${
				this.order.id
			}`,
			failure: `https://${hostname}/order/${this.storeSlug}/ipn/${
				this.order.id
			}?error=1`,
		};
	}

	GetUrlRequest(referer, ipnUrls, items, quantities, shippingCost) {
		const clientEmail = _.get(this.order, 'personal.email');
		const redirectQuery = `/?order=success&orderNumber=${this.orderNumber}&orderEmail=${clientEmail}`;
		const iCreditGetUrlRequest = {
			GroupPrivateToken: this.GroupPrivateToken,
			Currency: 1,
			HideItemList: true,
			RedirectURL: String(new URL(redirectQuery, referer)),
			FailRedirectURL: String(new URL('/?order=error', referer)),

			IPNURL: ipnUrls.success,
			IPNFailureURL: ipnUrls.failure,
			CustomerFirstName: _.get(this.order, 'personal.firstName', 'unknown'),
			CustomerLastName: _.get(this.order, 'personal.lastName', 'unknown'),
			Address: _.get(this.order, 'address.street'),
			POB: _.get(this.order, 'address.pob', 0),
			City: _.get(this.order, 'address.city'),
			Country: 'ישראל',
			// Zipcode: _.get(this.order, 'address.zipCode'),
			PhoneNumber: _.get(this.order, 'personal.phone'),
			EmailAddress: clientEmail,
			Order: this.orderNumber,
			Custom1: 'storystore',
			SendMail: true,
			Items: items.map(item => {
				if (item.id !== -1) {
					let description = item.Shelf.name;
					for (let attr in item.attrs) {
						if (
							item.attrs.hasOwnProperty(attr) &&
							item.attrs[attr].label &&
							item.attrs[attr].label.length > 0
						) {
							description += ` | ${item.attrs[attr].label}`;
						}
					}
					return {
						Quantity: quantities[String(item.id)],
						UnitPrice: Number(item.sale_price) || Number(item.price) || 0,
						Description: description,
						CatalogNumber: item.sku,
					};
				} 
			}),
		};

		// console.log('SHIPPING COST', shippingCost);
		if (shippingCost > 0) {
			iCreditGetUrlRequest.Items.push({
				Quantity: 1,
				UnitPrice: shippingCost,
				Description: 'דמי משלוח',
			});
		}

		return iCreditGetUrlRequest;
	}

	getUrl(getUrlRequest) {
		return axios.post(this.API_URL + 'GetUrl', getUrlRequest);
	}

	VerifyRequest(saleId, totalAmount) {
		return {
			GroupPrivateToken: this.GroupPrivateToken,
			SaleId: saleId,
			TotalAmount: totalAmount,
		};
	}

	verify(verifyRequest) {
		return axios.post(this.API_URL + 'Verify', verifyRequest);
	}
};
