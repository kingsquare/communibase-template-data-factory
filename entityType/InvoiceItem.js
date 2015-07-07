'use strict';

var BaseSerializer = require('./Base.js');
var helpers = require('../inc/helpers.js');
var _ = require('lodash');


module.exports = {
	titleFields: ['description'],
	getPromiseByPaths: function (entityTypeTitle, document, requestedPaths) {
		var allVariablesAreRequested = (requestedPaths.length === 1 && requestedPaths[0].substring(0, 1) === '#');

		return BaseSerializer.getPromiseByPaths.apply(this, arguments).then(function (templateData) {
			var requestedTotalsVariables = helpers.getRequestedSubVariables(requestedPaths, 'totals');
			var taxMultiplier = ((100 + (document.taxPercentage || 0)) / 100);
			var totals = {
				ex: document.quantity * document.pricePerUnit,
				in: document.totalEx * taxMultiplier,
				perUnitEx: document.pricePerUnit,
				perUnitIn: document.pricePerUnit * taxMultiplier
			};

			if (requestedTotalsVariables.length !== 0) {
				templateData.totals = {};
			}

			_.each(totals, function (value, identifier) {
				if (requestedTotalsVariables.indexOf(identifier) !== -1) {
					templateData.totals[identifier] = value;
				}

				//support for legacy syntax -- deprecated!
				var dataKey = 'total' + helpers.ucfirst(identifier);
				if (requestedPaths.indexOf(dataKey) !== -1) {
					templateData[dataKey] = helpers.euro_format(value);
				}
			});

			if (allVariablesAreRequested || requestedPaths.indexOf('title') !== -1) {
				templateData.title = document.description;
			}

			return templateData;
		});
	}
};