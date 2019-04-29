const _ = require('lodash');
const { URL } = require('url');
const axios = require('axios');
module.exports = class ICredit {
	// API_URL;
	// GroupPrivateToken;
	// storeSlug;
	// order;
	constructor(groupPrivateToken, isTest, orderId) {
		this.GroupPrivateToken = groupPrivateToken;
		this.API_URL = isTest
			? 'https://testicredit.rivhit.co.il/API/PaymentPageRequest.svc/'
			: 'https://icredit.rivhit.co.il/API/PaymentPageRequest.svc/';
		// this.storeSlug = storeSlug;
		// this.order = order;
		this.orderId = orderId;
		this.ipnUrls = {
			success: null,
			failure: null,
		};
	}
	// get ipnUrls() {
	// 	return this.ipnUrlsObj;
	// }
	// set ipnUrls(hostname, storeSlug) {
	// 	this.ipnUrlsObj = {
	// 		success: `https://${hostname}/order/${storeSlug}/ipn/${
	// 			this.orderId
	// 		}`,
	// 		failure: `https://${hostname}/order/${storeSlug}/ipn/${
	// 			this.orderId
	// 		}?error=1`,
	// 	};
	// }
	// setIPNUrls(hostname) {
	// 	this.ipnUrls = {
	// 		success: `https://${hostname}/order/${this.storeSlug}/ipn/${
	// 			this.order.id
	// 		}`,
	// 		failure: `https://${hostname}/order/${this.storeSlug}/ipn/${
	// 			this.order.id
	// 		}?error=1`,
	// 	};
	// }

	GetUrlRequest(
		items,
		quantitiesMap,
		orderId,
		shipping,
		paymentReturnUrl,
		customer
	) {
		const iCreditGetUrlRequest = {
			GroupPrivateToken: this.GroupPrivateToken,
			Currency: 1,
			HideItemList: true,
			RedirectURL: paymentReturnUrl,
			FailRedirectURL: `${paymentReturnUrl}&error=true`,

			IPNURL: this.ipnUrls.success,
			IPNFailureURL: this.ipnUrls.failure,
			CustomerFirstName: _.get(customer, 'first_name', 'unknown'),
			CustomerLastName: _.get(customer, 'last_name', 'unknown'),
			Address: customer.shipping_address,
			// POB: _.get(this.customer, 'address.pob', 0),
			City: customer.shipping_city,
			Country: 'ישראל',
			// Zipcode: _.get(this.order, 'address.zipCode'),
			PhoneNumber: customer.phone,
			EmailAddress: customer.email,
			Order: orderId,
			Custom1: 'storystore',
			SendMail: true,
			Items: items.map(item => {
				if (item.id !== -1) {
					let description = item.variation.Shelf.name;
					if (item.variation.property_label)
						description += ' - ' + item.variation.property_label;
					if (item.attribute.label) description += ' - ' + item.attribute.label;

					return {
						Quantity: quantitiesMap[String(item.id)],
						UnitPrice: item.variation.finalPrice,
						Description: description,
						CatalogNumber: item.id,
					};
				}
			}),
		};

		// console.log('SHIPPING COST', shippingCost);
		if (shipping.price > 0) {
			iCreditGetUrlRequest.Items.push({
				Quantity: 1,
				UnitPrice: shipping.price,
				Description: shipping.type || 'דמי משלוח',
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
