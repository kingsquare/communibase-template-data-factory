'use strict';

var BaseSerializer = require('./Base.js');
var helpers = require('../inc/helpers.js');

module.exports = {
	titleFields: ['description'],
	getPromiseByPaths: function (entityTypeTitle, document, requestedPaths) {
		var allVariablesAreRequested = (requestedPaths.length === 1 && requestedPaths[0].substring(0, 1) === '#');

		return BaseSerializer.getPromiseByPaths.apply(this, arguments).then(function (templateData) {
			var requestedTotalsVariables, taxMultiplier, totals;

			// get all tax-related "totals"-values, like "invoiceItems.0.totals.ex"
			requestedTotalsVariables = helpers.getRequestedSubVariables(requestedPaths, 'totals');
			taxMultiplier = ((100 + (document.taxPercentage || 0)) / 100);
			totals = {
				ex: document.quantity * document.pricePerUnit,
				in: document.totalEx * taxMultiplier,
				perUnitEx: document.pricePerUnit,
				perUnitIn: document.pricePerUnit * taxMultiplier
			};

			if (requestedTotalsVariables.length !== 0) {
				templateData.totals = {};
				Object.keys(totals).forEach(function (totalKey) {
					if (requestedTotalsVariables.indexOf(totalKey) !== -1) {
						templateData.totals[totalKey] = totals[totalKey];
					}
				});
			}

			//support for legacy syntax -- deprecated!
			if (totals) {
				Object.keys(totals).forEach(function (key) {
					var dataKey = 'total' + helpers.ucfirst(key);
					if (requestedPaths.indexOf(dataKey) === -1) {
						return;
					}

					templateData[dataKey] = '€' + helpers.number_format(totals[key]);
				});
			}

			if (allVariablesAreRequested || requestedPaths.indexOf('title') !== -1) {
				templateData.title = document.description;
			}

			return templateData;
		});
	}
};