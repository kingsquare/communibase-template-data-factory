'use strict';

var BaseSerializer = require('./Base.js');
var helpers = require('../inc/helpers.js');

module.exports = function (entityTypeTitle, document, requestedPaths) {
	var allVariablesAreRequested = (requestedPaths.length === 1 && requestedPaths[0].substring(0, 1) === '#');

	return BaseSerializer.apply(this, arguments).then(function (templateData) {
		var taxes, totalEx, totalTax, totalIn, requestedTotalsVariables, requestedTaxesVariables;
		taxes = {};
		totalEx = 0;
		totalTax = 0;
		totalIn = 0;

		document.invoiceItems.forEach(function (invoiceItem) {
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

		var totals = {
			ex: totalEx,
			tax: totalTax,
			in: totalIn
		};

		requestedTotalsVariables = helpers.getRequestedSubVariables(requestedPaths, 'totals');
		if (requestedTotalsVariables.length !== 0) {
			templateData.totals = {};
			if (requestedTotalsVariables.indexOf('ex') !== -1) {
				templateData.totals.ex = totalEx;
			}
			if (requestedTotalsVariables.indexOf('tax') !== -1) {
				templateData.totals.perUnitEx = totalTax;
			}
			if (requestedTotalsVariables.indexOf('in') !== -1) {
				templateData.totals.perUnitIn = totalIn;
			}
		}

		//support for legacy syntax -- deprecated!
		Object.keys(totals).forEach(function (key) {
			var dataKey = 'total' + helpers.ucfirst(key);
			if (requestedPaths.indexOf(dataKey) === -1) {
				return;
			}
			templateData[dataKey] = '€' + helpers.number_format(totals[key]);
		});

		requestedTaxesVariables = helpers.getRequestedSubVariables(requestedPaths, 'taxes.#');
		if (requestedTaxesVariables.length !== 0) {
			templateData.taxes = [];
			Object.keys(taxes).forEach(function (taxPercentage) {
				var tax = {};

				if (requestedTaxesVariables.indexOf('#') !== -1 || requestedTaxesVariables.indexOf('percentage') !== -1) {
					tax.percentage = taxPercentage;
				}
				if (requestedTaxesVariables.indexOf('#') !== -1 || requestedTaxesVariables.indexOf('value') !== -1) {
					tax.value = taxes[taxPercentage];
				}
				if (requestedTaxesVariables.indexOf('#') !== -1 || requestedTaxesVariables.indexOf('total') !== -1) {
					tax.total = ('€' + helpers.number_format(taxes[taxPercentage]));
				}

				templateData.taxes.push(tax);
			});
		}

		if (allVariablesAreRequested || requestedPaths.indexOf('isCredit') !== -1) {
			templateData.isCredit = (totalEx < -0.1);
		}

		if (!templateData.invoiceNumber && !document.invoiceNumber) {
			templateData.invoiceNumber = 'Pro forma';
		}
		return templateData;
	});
};