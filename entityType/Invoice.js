'use strict';

var BaseSerializer = require('./Base.js');

module.exports = function (entityTypeTitle, document, nestLevel) {
	return BaseSerializer.apply(this, arguments).then(function (templateData) {
		var taxes = {};
		var totalEx = 0;
		var totalTax = 0;
		var totalIn = 0;
		templateData.taxes = [];
		templateData.invoiceItems.forEach(function (invoiceItem) {
			var taxPercentage = invoiceItem.taxPercentage;
			//https://trello.com/c/LdjswRU6/597-1-cent-verschil-op-elke-factuur-enkele-zelfs-2-zelfs-zonder-kortin
			//taxMultiplier = ((100 + (taxPercentage ? taxPercentage : 0)) / 100); --> FLOATING POINT ISSUE
			var taxMultiplier = (taxPercentage / 100);
			var itemEx = invoiceItem.quantity * invoiceItem.pricePerUnit;

			totalEx += itemEx;
			totalTax += (itemEx * taxMultiplier);
			totalIn += (itemEx * (1 + taxMultiplier));
			if (taxPercentage !== null) {
				taxPercentage = String(taxPercentage);
				if (taxes[taxPercentage] === undefined) {
					taxes[taxPercentage] = 0;
				}
				taxes[taxPercentage] += (itemEx * taxMultiplier);
			}
		});

		Object.keys(taxes, function (taxPercentage) {
			templateData.taxes.push({
				percentage: taxPercentage,
				total: taxes[taxPercentage]
			});
		});

		templateData.isCredit = (totalEx < -0.1);
		templateData.totalEx = totalEx;
		templateData.totalTax = totalTax;
		templateData.totalIn = totalIn;
		if (!templateData.invoiceNumber) {
			templateData.invoiceNumber = 'Pro forma';
		}
		//this is useless and spills memory...
		templateData.template = '';
		return templateData;
	});
};