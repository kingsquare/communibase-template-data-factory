"use strict";

module.exports = {
	titleFields: ['merchantId'],
	_getTitlePromise: function(titleFields, entityTypeTitle, merchant) {
		var titles = [];

		titleFields.forEach(function (titleField) {
			titles.push(merchant[titleField]);
		});

		if (!merchant.data) {
			return Promise.resolve(titles.join(' - '));
		}

		return this.getTitlePromise('MerchantData', merchant.data).then(function (dataTitle) {
			titles.push(dataTitle);
			return titles;
		});
	}
};