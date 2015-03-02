'use strict';

var BaseSerializer = require('./Base.js');
var helpers = require('../inc/helpers.js');

module.exports = function (entityTypeTitle, document, nestLevel) {
	return BaseSerializer.apply(this, arguments).then(function (templateData) {
		var taxMultiplier = ((100 + (templateData.taxPercentage || 0)) / 100);

		templateData.totals = {
			"ex": templateData.quantity * templateData.pricePerUnit,
			"in": templateData.totalEx * taxMultiplier,
			"perUnitEx": templateData.pricePerUnit,
			"perUnitIn": templateData.pricePerUnit * taxMultiplier
		};

		//support for legacy syntax -- deprecated!
		Object.keys(templateData.totals).forEach(function (key) {
			templateData['total' + helpers.ucfirst(key)] = '€' + helpers.number_format(templateData.totals[key]);
		});

		templateData.title = templateData.description;
		return templateData;
	});
};